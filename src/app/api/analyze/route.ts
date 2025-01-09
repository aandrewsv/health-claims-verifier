import { NextResponse } from 'next/server';
import { queryPerplexityJSONArray } from '@/lib/perplexity';
import {
  CLASSIFICATION_PROMPT,
  DEDUP_PROMPT,
  GET_RECENT_CLAIMS_PROMPT,
} from '@/lib/prompts';
import { supabase } from '@/lib/supabase';
import { AnalysisRequestBody, Claim } from '@/types';
import pLimit from 'p-limit'; // To control concurrency

// -------------
// HELPERS
// -------------
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

// Trust score calculation
function calculateTrustScore(
  verifiedCount: number,
  questionableCount: number,
  debunkedCount: number,
  totalClaims: number
): number {
  if (totalClaims === 0) return 0;

  // Weight factors - verified claims have highest impact
  const VERIFIED_WEIGHT = 1.0;    // 100% contribution
  const QUESTIONABLE_WEIGHT = 0.5; // 50% contribution
  const DEBUNKED_WEIGHT = 0.0;    // 0% contribution

  // Calculate weighted sum
  const weightedScore = 
    (verifiedCount * VERIFIED_WEIGHT + 
     questionableCount * QUESTIONABLE_WEIGHT + 
     debunkedCount * DEBUNKED_WEIGHT);

  // Convert to percentage (0-100)
  const percentageScore = (weightedScore / totalClaims) * 100;

  // Round to 2 decimal places
  return Number(percentageScore.toFixed(2));
}

// -------------
// MAIN ENDPOINT
// -------------
export async function POST(req: Request) {
  try {
    const {
      influencerName,
      recencyFilter,
      claimsLimit: claimsLimitStr,
      selectedJournals,
    } = (await req.json()) as AnalysisRequestBody;
    const claimsLimit = parseInt(claimsLimitStr, 10);
    if (!influencerName) {
      return NextResponse.json(
        { error: 'Missing influencerName' },
        { status: 400 }
      );
    }

    // 1. Check influencer existence
    const { data: influencer, error: infError } = await supabase
      .from('influencers')
      .select('*')
      .eq('canonical_name', influencerName)
      .single();

    if (infError || !influencer) {
      return NextResponse.json(
        { error: 'Influencer not found' },
        { status: 404 }
      );
    }

    // 2. Fetch recent claims from Perplexity
    // We'll pass the recency filter to perplexity config, and the influencer's canonical_name to the prompt
    const perplexityConfig = {
      max_tokens: 5000,
      temperature: 0,
      top_p: 1,
      search_recency_filter: recencyFilter, // e.g. "week"
    };

    const getClaimsPrompt = GET_RECENT_CLAIMS_PROMPT(
      influencer.canonical_name,
      claimsLimit
    );
    const recentClaims = await queryPerplexityJSONArray<
      {
        claim_text: string;
        source_content: string | null;
        source_platform: string | null;
        found_date: string | null;
      }[]
    >(getClaimsPrompt, perplexityConfig);

    if (!recentClaims || recentClaims.length === 0) {
      // No claims found
      return NextResponse.json({
        influencerId: influencer.id,
        message: 'No new claims found from Perplexity',
      });
    }

    // 3. Load existing claims from DB
    const { data: existingClaims, error: loadClaimsErr } = await supabase
      .from('claims')
      .select('id, claim_text')
      .eq('influencer_id', influencer.id);

    if (loadClaimsErr) {
      throw loadClaimsErr;
    }

    const existingClaimTexts = existingClaims?.map((c) => c.claim_text) || [];

    // 4. Deduplicate if we have existing claims to compare against
    // Deduplicate new claims using Perplexity in batches
    let uniqueClaimsFull = recentClaims; // default assume all are unique
    if (existingClaimTexts.length > 0) {
      //    We'll only pass the 'claim_text' from the new claims to the dedup prompt.
      const newClaimTexts = recentClaims.map((c) => c.claim_text);
      const newClaimsBatches = chunkArray(newClaimTexts, 10); // chunk size 10 for dedup
      const limit = pLimit(3); // up to 3 concurrent requests for dedup

      let dedupResults: {
        new_claim_text: string;
        is_duplicate: boolean;
        matched_existing_claim_text: string | null;
        similarity_score: number;
      }[] = [];

      // For each batch of new claims, compare against existing claim texts
      await Promise.all(
        newClaimsBatches.map((batch) =>
          limit(async () => {
            const dedupPrompt = DEDUP_PROMPT(batch, existingClaimTexts);
            const result = await queryPerplexityJSONArray<
              {
                new_claim_text: string;
                is_duplicate: boolean;
                matched_existing_claim_text: string | null;
                similarity_score: number;
              }[]
            >(dedupPrompt, { max_tokens: 4000, temperature: 0, top_p: 1 });

            dedupResults = dedupResults.concat(result);
          })
        )
      );

      // Filter out duplicates
      const uniqueClaimTexts = dedupResults
        .filter((r) => !r.is_duplicate)
        .map((r) => r.new_claim_text);

      // 5. Build a "uniqueClaims" array with full data from recentClaims
      uniqueClaimsFull = recentClaims.filter((cl) =>
        uniqueClaimTexts.includes(cl.claim_text)
      );
    }

    if (uniqueClaimsFull.length === 0) {
      return NextResponse.json({
        influencerId: influencer.id,
        message: 'All recent claims were duplicates',
      });
    }

    // 6. Classify the unique claims
    //    Could do 1 claim per request, but let's batch them in small chunks (3-5 claims each).
    const classifyBatches = chunkArray(uniqueClaimsFull, 3);
    const classifyLimit = pLimit(3); // up to 3 concurrent requests

    // We'll accumulate classification results in this array
    interface ClassificationResult {
      claim_text: string;
      status: 'Verified' | 'Questionable' | 'Debunked';
      category:
        | 'Sleep'
        | 'Performance'
        | 'Hormones'
        | 'Stress'
        | 'Nutrition'
        | 'Exercise'
        | 'Stress'
        | 'Cognition'
        | 'Motivation'
        | 'Recovery'
        | 'Mental Health'
        | 'Other'
        | null;
      confidence_score: number;
      journals_supporting: string[];
      journals_questioning: string[];
      journals_contradicting: string[];
    }

    let finalClassificationResults: ClassificationResult[] = [];

    try {
      const batchPromises = classifyBatches.map((batch) =>
        classifyLimit(async () => {
          try {
            const batchTexts = batch.map((b) => b.claim_text);
            console.log('Processing classification batch:', batchTexts);

            const classifyPrompt = CLASSIFICATION_PROMPT(
              batchTexts,
              selectedJournals
            );
            console.log('Classification prompt:', classifyPrompt);

            const batchResult = await queryPerplexityJSONArray<
              ClassificationResult[]
            >(classifyPrompt, { max_tokens: 4000, temperature: 0, top_p: 1 });

            console.log('Raw batch result:', batchResult);

            if (!batchResult || !Array.isArray(batchResult)) {
              console.error('Invalid batch result format:', batchResult);
              return [];
            }

            // Validate each result in the batch and ensure it matches a claim text from the batch
            const validResults = batchResult.filter((result) => {
              const isValid =
                result &&
                typeof result === 'object' &&
                'claim_text' in result &&
                'status' in result &&
                'category' in result &&
                'confidence_score' in result &&
                'journals_supporting' in result &&
                'journals_questioning' in result &&
                'journals_contradicting' in result &&
                Array.isArray(result.journals_supporting) &&
                Array.isArray(result.journals_questioning) &&
                Array.isArray(result.journals_contradicting) &&
                batchTexts.includes(result.claim_text); // Ensure the claim text matches one from this batch

              if (!isValid) {
                console.error(
                  'Invalid result format or claim text mismatch:',
                  result
                );
              }
              return isValid;
            });

            console.log('Valid results from batch:', validResults);
            return validResults;
          } catch (error) {
            console.error('Error processing batch:', error);
            return [];
          }
        })
      );

      const batchResults = await Promise.all(batchPromises);
      finalClassificationResults = batchResults.flat();

      // Additional validation to ensure we have results for all claims
      const processedClaimTexts = new Set(
        finalClassificationResults.map((r) => r.claim_text)
      );
      const missingClaims = uniqueClaimsFull.filter(
        (c) => !processedClaimTexts.has(c.claim_text)
      );

      if (missingClaims.length > 0) {
        console.error(
          'Missing classification results for claims:',
          missingClaims
        );
      }
    } catch (error) {
      console.error('Classification process error:', error);
      throw error;
    }

    console.log('All classification results:', finalClassificationResults);

    if (finalClassificationResults.length === 0) {
      throw new Error('Classification failed - no valid results returned');
    }

    // 7. Insert unique claims with classification into DB
    let newVerified = 0;
    let newQuestionable = 0;
    let newDebunked = 0;

    // Build an array for supabase insert
    const claimsToInsert = finalClassificationResults
      .map((fc) => {
        // Find the original claim object
        const original = uniqueClaimsFull.find(
          (u) => u.claim_text === fc.claim_text
        );

        if (!original) {
          // Should not happen, but handle gracefully
          return null;
        }

        // Count how many claims in each category
        if (fc.status === 'Verified') newVerified++;
        if (fc.status === 'Questionable') newQuestionable++;
        if (fc.status === 'Debunked') newDebunked++;

        const newClaim: Partial<Claim> = {
          influencer_id: influencer.id,
          claim_text: fc.claim_text,
          source_content: original.source_content,
          source_platform: original.source_platform,
          category: fc.category, // Could be provided by classification if needed
          status: fc.status,
          confidence_score: fc.confidence_score,
          scientific_evidence: {
            journals_supporting: fc.journals_supporting,
            journals_questioning: fc.journals_questioning,
            journals_contradicting: fc.journals_contradicting,
          },
        };

        return newClaim;
      })
      .filter(Boolean); // Remove null if any

    // 7. Insert unique claims with classification into DB and update counts
    if (claimsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('claims')
        .insert(claimsToInsert);

      if (insertError) throw insertError;

      // 8. After successful insert, get updated claim counts from DB
      const { data: claimStats, error: statsErr } = await supabase
        .from('claims')
        .select('status')
        .eq('influencer_id', influencer.id);

      if (statsErr) throw statsErr;

      // Calculate totals from all claims including newly inserted ones
      const verifiedCount =
        claimStats?.filter((c) => c.status === 'Verified').length || 0;
      const questionableCount =
        claimStats?.filter((c) => c.status === 'Questionable').length || 0;
      const debunkedCount =
        claimStats?.filter((c) => c.status === 'Debunked').length || 0;
      const totalClaimsDB = claimStats?.length || 0;

      const newTrustScore = calculateTrustScore(
        verifiedCount,
        questionableCount,
        debunkedCount,
        totalClaimsDB
      );

      const { error: updateInfError } = await supabase
        .from('influencers')
        .update({
          verified_claims_count: verifiedCount,
          questionable_claims_count: questionableCount,
          debunked_claims_count: debunkedCount,
          trust_score: newTrustScore,
          last_analyzed: new Date().toISOString(),
        })
        .eq('id', influencer.id);

      if (updateInfError) throw updateInfError;

      // 9. Return final result
      return NextResponse.json({
        influencerId: influencer.id,
        newClaimsFound: recentClaims.length,
        newUniqueClaims: uniqueClaimsFull.length,
        insertedClaims: claimsToInsert.length,
        newVerified,
        newQuestionable,
        newDebunked,
        trustScore: newTrustScore,
        totalClaimsInDB: totalClaimsDB,
        details: finalClassificationResults,
      });
    }

    // If no claims to insert, return with zeros
    return NextResponse.json({
      influencerId: influencer.id,
      newClaimsFound: recentClaims.length,
      newUniqueClaims: uniqueClaimsFull.length,
      insertedClaims: 0,
      newVerified: 0,
      newQuestionable: 0,
      newDebunked: 0,
      trustScore: 0,
      totalClaimsInDB: 0,
      details: [],
    });
  } catch (error) {
    console.error('ANALYSIS ERROR:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
