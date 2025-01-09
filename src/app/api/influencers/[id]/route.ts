import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { Influencer, Claim } from '@/types';

interface InfluencerDetail extends Influencer {
  claims: Claim[];
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params object
    const params = await context.params;
    
    if (!params.id) {
      return NextResponse.json(
        { error: 'Missing influencer ID' },
        { status: 400 }
      );
    }
    // Fetch influencer details
    const { data: influencer, error: influencerError } = await supabase
      .from('influencers')
      .select(`
        id,
        canonical_name,
        known_aliases,
        platform_handles,
        credentials,
        categories,
        follower_count,
        trust_score,
        verified_claims_count,
        questionable_claims_count,
        debunked_claims_count,
        last_analyzed,
        created_at
      `)
      .eq('id', params.id)
      .single();

    if (influencerError) {
      throw influencerError;
    }

    if (!influencer) {
      return NextResponse.json(
        { error: 'Influencer not found' },
        { status: 404 }
      );
    }

    // Fetch related claims
    const { data: claims, error: claimsError } = await supabase
      .from('claims')
      .select(`
        id,
        influencer_id,
        claim_text,
        source_content,
        source_platform,
        category,
        status,
        confidence_score,
        scientific_evidence,
        analyzed_at,
        created_at
      `)
      .eq('influencer_id', params.id)
      .order('created_at', { ascending: false });

    if (claimsError) {
      throw claimsError;
    }

    const influencerDetail: InfluencerDetail = {
      ...influencer,
      claims: claims || []
    };

    return NextResponse.json({ 
      influencer: influencerDetail 
    });
  } catch (error) {
    console.error('Error fetching influencer details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch influencer details' },
      { status: 500 }
    );
  }
}
