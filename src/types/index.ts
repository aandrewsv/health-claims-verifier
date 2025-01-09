// src/types/index.ts
export interface Influencer {
  id?: string;
  canonical_name: string;
  known_aliases: string[];
  platform_handles: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  credentials: string[];
  categories: string[];
  follower_count: number;
  trust_score: number;
  verified_claims_count: number;
  questionable_claims_count: number;
  debunked_claims_count: number;
  last_analyzed?: string;
  created_at?: string;
}

export interface ResearchConfig {
  recencyFilter: 'hour' | 'day' | 'week' | 'month';
  claimsLimit: string;
  selectedJournals: string[];
}

export interface VerificationResult {
  canonicalName: string; // Official full name
  knownAliases: string[]; // All known variations of their name
  isHealthInfluencer: boolean; // Whether they are a health influencer
  confidence: number; // Confidence in the verification (0-100)
  platformHandles: PlatformHandles; // Social media handles
  credentials: string[]; // Academic/professional credentials
  categories: string[]; // Areas of expertise
  approximateFollowers: number; // Total followers across platforms
}

export interface PlatformHandles {
  twitter: string;
  instagram: string;
  youtube: string;
}

export interface InitialClaimsResult {
  claims: {
    claim_text: string;
    source_content: string;
    source_platform: string;
    found_date: string;
  }[];
}

export interface DeduplicationResult {
  results: {
    claim_text: string;
    is_duplicate: boolean;
    matched_existing_claim: string | null;
    similarity_score: number;
    reasoning: string;
  }[];
}

export interface AnalysisRequestBody {
  influencerName: string;
  recencyFilter: 'hour' | 'day' | 'week' | 'month';
  claimsLimit: string;
  selectedJournals: string[];
}

export interface Claim {
  id?: string;
  influencer_id: string;
  claim_text: string;
  source_content: string | null;
  source_platform: string | null;
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
  status: ('Verified' | 'Questionable' | 'Debunked') | null;
  confidence_score: number | null;
  scientific_evidence: ScientificEvidence;
  analyzed_at?: string;
  created_at?: string;
}
export interface ScientificEvidence {
  journals_supporting: string[];
  journals_questioning: string[];
  journals_contradicting: string[];
}
