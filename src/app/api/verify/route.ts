import { NextResponse } from 'next/server';
import { queryPerplexityJSONObject } from '@/lib/perplexity';
import { VERIFY_HEALTH_INFLUENCER_PROMPT } from '@/lib/prompts';
import { supabase } from '@/lib/supabase';
import { Influencer, VerificationResult } from '@/types';

// Helper function to normalize names for comparison
function normalizeInfluencerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special characters and spaces
    .trim();
}

// Helper function to check if names are similar
function areSimilarNames(name1: string, name2: string): boolean {
  return normalizeInfluencerName(name1) === normalizeInfluencerName(name2);
}

// Helper function to check if a name exists in an array of aliases
function nameExistsInAliases(name: string, aliases: string[]): boolean {
  const normalizedName = normalizeInfluencerName(name);
  return aliases.some(
    (alias) => normalizeInfluencerName(alias) === normalizedName
  );
}

export async function POST(req: Request) {
  try {
    const { influencerName } = await req.json();
    console.log('Checking influencer:', influencerName);

    // 1. Get all existing influencers first
    const { data: existingInfluencers, error: fetchError } = await supabase
      .from('influencers')
      .select('*');

    if (fetchError) throw fetchError;

    // 2. Check if influencer exists by checking canonical name and aliases
    const existingInfluencer = existingInfluencers?.find((influencer) => {
      // Check canonical name
      if (areSimilarNames(influencer.canonical_name, influencerName)) {
        return true;
      }
      // Check aliases
      return nameExistsInAliases(influencerName, influencer.known_aliases);
    });

    if (existingInfluencer) {
      console.log(
        'Found existing influencer:',
        existingInfluencer.canonical_name
      );
      // Return existing influencer data in VerificationResult format
      const result: VerificationResult = {
        canonicalName: existingInfluencer.canonical_name,
        knownAliases: existingInfluencer.known_aliases,
        isHealthInfluencer: true,
        confidence: 100,
        platformHandles: existingInfluencer.platform_handles,
        credentials: existingInfluencer.credentials,
        categories: existingInfluencer.categories,
        approximateFollowers: existingInfluencer.follower_count,
      };
      return NextResponse.json(result);
    }

    // 3. If not found, verify with Perplexity
    console.log('Verifying new influencer with Perplexity...');
    const verificationResult: VerificationResult =
      await queryPerplexityJSONObject(
        VERIFY_HEALTH_INFLUENCER_PROMPT(influencerName),
        {
          temperature: 0,
          max_tokens: 1500,
        }
      );

    // 4. If not a health influencer, return early
    if (!verificationResult.isHealthInfluencer) {
      return NextResponse.json(
        { error: 'Not identified as a health influencer' },
        { status: 400 }
      );
    }

    // 5. Double-check again after getting canonical name from Perplexity
    const duplicateCheck = existingInfluencers?.find((influencer) => {
      // Check canonical name
      if (
        areSimilarNames(
          influencer.canonical_name,
          verificationResult.canonicalName
        )
      ) {
        return true;
      }
      // Check if any of the new aliases match existing ones
      return verificationResult.knownAliases.some((alias) =>
        nameExistsInAliases(alias, influencer.known_aliases)
      );
    });

    if (duplicateCheck) {
      console.log(
        'Found duplicate after verification:',
        duplicateCheck.canonical_name
      );
      // Return existing influencer data
      const result: VerificationResult = {
        canonicalName: duplicateCheck.canonical_name,
        knownAliases: duplicateCheck.known_aliases,
        isHealthInfluencer: true,
        confidence: 100,
        platformHandles: duplicateCheck.platform_handles,
        credentials: duplicateCheck.credentials,
        categories: duplicateCheck.categories,
        approximateFollowers: duplicateCheck.follower_count,
      };
      return NextResponse.json(result);
    }

    // 6. Create new influencer
    console.log('Creating new influencer:', verificationResult.canonicalName);
    const newInfluencer: Influencer = {
      canonical_name: verificationResult.canonicalName,
      known_aliases: [
        verificationResult.canonicalName,
        ...verificationResult.knownAliases,
        influencerName, // Also add the original search term
      ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
      platform_handles: verificationResult.platformHandles,
      credentials: verificationResult.credentials,
      categories: verificationResult.categories,
      follower_count: verificationResult.approximateFollowers,
      trust_score: 0,
      verified_claims_count: 0,
      questionable_claims_count: 0,
      debunked_claims_count: 0,
    };

    const { data: influencer, error } = await supabase
      .from('influencers')
      .insert(newInfluencer)
      .select()
      .single();

    if (error) throw error;
    console.log(
      'Successfully created new influencer:',
      influencer.canonical_name
    );

    return NextResponse.json(verificationResult);
  } catch (error) {
    console.error('Verification error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
