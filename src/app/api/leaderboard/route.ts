import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// Weight factors for different claim statuses
const CLAIM_WEIGHTS = {
  'Verified': 1,
  'Questionable': -0.5,
  'Debunked': -1
};

type Claim = {
  status: 'Verified' | 'Questionable' | 'Debunked';
  created_at: string;
  confidence_score: number;
};

async function calculateTrend(influencerId: string): Promise<'up' | 'down'> {
  // Fetch all claims for the influencer, ordered by creation date
  const { data: claims, error } = await supabase
    .from('claims')
    .select('status, created_at, confidence_score')
    .eq('influencer_id', influencerId)
    .order('created_at', { ascending: true });

  if (error || !claims || claims.length === 0) {
    return 'down'; // Default to down if no claims or error
  }

  // Calculate the number of claims that represent the latest 20%
  const recentClaimsCount = Math.max(Math.ceil(claims.length * 0.2), 1);
  const olderClaims = claims.slice(0, -recentClaimsCount);
  const recentClaims = claims.slice(-recentClaimsCount);

  // Calculate weighted scores for both periods
  function calculateWeightedScore(claimSet: Claim[]) {
    return claimSet.reduce((score, claim) => {
      const weight = CLAIM_WEIGHTS[claim.status];
      return score + (weight * claim.confidence_score);
    }, 0) / (claimSet.length || 1); // Avoid division by zero
  }

  const olderScore = calculateWeightedScore(olderClaims);
  const recentScore = calculateWeightedScore(recentClaims);

  return recentScore >= olderScore ? 'up' : 'down';
}

async function fetchLeaderboardStats() {
  const [influencersResponse, claimsResponse] = await Promise.all([
    supabase
      .from('influencers')
      .select('trust_score'),
    supabase
      .from('claims')
      .select('id')
  ]);

  if (influencersResponse.error || claimsResponse.error) {
    throw new Error('Failed to fetch statistics');
  }

  const totalInfluencers = influencersResponse.data?.length || 0;
  const totalVerifiedClaims = claimsResponse.data?.length || 0;
  const averageTrustScore = influencersResponse.data?.reduce(
    (sum, inf) => sum + (inf.trust_score || 0), 
    0
  ) / (totalInfluencers || 1);

  return {
    totalInfluencers,
    totalVerifiedClaims,
    averageTrustScore: Number(averageTrustScore.toFixed(2))
  };
}

export async function GET() {
  try {
    // Fetch influencers and stats in parallel
    const [{ data: influencers, error }, stats] = await Promise.all([
      supabase
        .from('influencers')
        .select(`
          id,
          canonical_name,
          trust_score,
          follower_count,
          verified_claims_count
        `)
        .order('trust_score', { ascending: false }),
      fetchLeaderboardStats()
    ]);

    if (error) throw error;

    // Calculate trends for each influencer
    const influencersWithTrends = await Promise.all(
      (influencers || []).map(async (influencer) => ({
        ...influencer,
        trend: await calculateTrend(influencer.id)
      }))
    );

    return NextResponse.json({
      stats,
      influencers: influencersWithTrends || [],
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}