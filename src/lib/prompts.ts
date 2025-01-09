export const VERIFY_HEALTH_INFLUENCER_PROMPT = (influencerName: string) => `
Analyze if the given person is a health influencer by performing a comprehensive verification:

1. Identity verification:
   - Identify their canonical (official) name and professional titles
   - Document all known variations/aliases of their name
   - Verify their primary professional credentials and qualifications

2. Social media presence analysis:
   - Locate and verify their official accounts across platforms
   - Locate total follower count across all platforms
   - Verify account authenticity (look for verified badges, consistent branding)

3. Professional impact assessment:
   - Evaluate their areas of expertise and main content categories
   - Verify their professional credentials against reliable sources
   - Assess their influence in the health/medical community

For: ${influencerName}

Return a JSON object with the following structure. The response must be valid parseable JSON only, with no additional text, comments or markdown.

Structure:
{
  "canonicalName": string,
  "knownAliases": string[],
  "isHealthInfluencer": boolean,
  "confidence": number, // Integer 0-100
  "platformHandles": {
    "twitter": string | null,
    "instagram": string | null,
    "youtube": string | null
  },
  "credentials": string[],
  "categories": string[],
  "approximateFollowers": number | null // Plain integer without underscores or commas or null
}

Example response format:
{
  "canonicalName": "John Smith",
  "knownAliases": ["Dr. J Smith", "J.S."],
  "isHealthInfluencer": true,
  "confidence": 95,
  "platformHandles": {
    "twitter": "@handle",
    "instagram": "@handle", 
    "youtube": "@channel"
  },
  "credentials": ["PhD in Medicine", "Board Certified"],
  "categories": ["Nutrition", "Fitness"],
  "approximateFollowers": 23000000
}

Important rules:
- Must return only valid, parseable JSON without any comments, explanations or markdown
- Numbers must be plain integers/decimals without underscores or commas
- All strings must use double quotes, not single quotes
- No trailing commas allowed after the last item in arrays/objects
- No // comments or /* */ comment blocks allowed
- JSON must not be wrapped in code blocks
- For unknown handles, use null
- For unknown numbers, use null 
- Empty arrays should be [] rather than null
- Canonical name should be their most widely recognized official/professional one
- Include all known variations of their name in knownAliases
- Verify credentials against reliable sources
- For approximateFollowers should be the most recent estimate total count across all platforms ensuring you pass number as a plain integer without underscores or commas, and not a string
`;
export const GET_RECENT_CLAIMS_PROMPT = (
  influencerName: string,
  limit: number
) => `
Gather a maximum of ${limit} recent distinct health-related statements from ${influencerName}.
Return only statements that focus on diet, nutrition, fitness, mental health, supplementation, or medical/scientific interventions.
Exclude any statements about podcast rankings, personal achievements, or who was a guest on the podcast, unless it contains a scientifically testable claim.
The response must be valid JSON only—no code blocks, no triple backticks, no commentary.
If a field is unknown, use null.
If no valid claims are found, return an empty JSON array [].
Don't return more than ${limit} claims.
Don't repeat semantically identical claims.

Return each health claim statement with the following fields in this exact JSON format only, no extra text:

[
  {
    "claim_text": string,
    "source_content": string | null,
    "source_platform": string | null,
    "found_date": string | null,
  },
  ...
]


Rules:
- Must be valid pure JSON (no extra comments avoid UTF-8 special characters for dashes, quotes, etc.).
- For unknown fields, use null or an empty string if no data is found.
- The response must not contain triple backticks. Only return valid JSON
- If you cannot provide valid JSON, return an empty array. Do not wrap it in code blocks.
- No more than ${limit} claims.
- No repeated claims.
- Avoid including any URL in the claim text, source content, or source platform. No URLs in the response.
- Provide proper JSON formatting with double quotes for strings and no trailing commas.
`;
export const DEDUP_PROMPT = (newClaims: string[], existingClaims: string[]) => `
Duplicate Detection Task:
Compare each claim from newClaims against existingClaims to identify semantic duplicates.
Input:
newClaims = ${JSON.stringify(newClaims)}
existingClaims = ${JSON.stringify(existingClaims)}
Required Output Format:
Return a JSON array containing one object per new claim. Each object must have exactly these fields:
{
"new_claim_text": "exact text from newClaims",
"is_duplicate": boolean true/false,
"matched_existing_claim_text": "matching text from existingClaims or null",
"similarity_score": number between 0.0 and 1.0
}
Critical Requirements:

Response must be pure JSON - no markdown, no comments, no explanations
Values must be:

new_claim_text: exact string from newClaims
is_duplicate: boolean true/false only
matched_existing_claim_text: exact string from existingClaims or null
similarity_score: number between 0.0 and 1.0


Special characters:

Use standard ASCII quotes (") not curly quotes
Escape special characters properly


No wrapper formatting:

No code blocks
No backticks
No additional text before or after the JSON



Example valid response:
[{
"new_claim_text": "Example claim",
"is_duplicate": false,
"matched_existing_claim_text": null,
"similarity_score": 0.0
}]
If unable to generate valid JSON meeting these requirements, return only: []
Scoring Rules:

similarity_score = 1.0: Exact match or semantically identical
similarity_score >= 0.8: Strong semantic similarity (probable duplicate)
similarity_score < 0.8: Not considered a duplicate
is_duplicate should be true when similarity_score >= 0.8
`;
export const CLASSIFICATION_PROMPT = (
  claims: string[],
  selectedJournals: string[]
) => `
We need to classify an array of scientific claims using evidence from these journals: ${JSON.stringify(selectedJournals)}
Claims to classify: ${JSON.stringify(claims)}
Required Output Format:
Return a JSON array containing one object per claim. Each object must have exactly these fields:
{
"claim_text": "exact claim text as provided",
"status": one of ["Verified", "Questionable", "Debunked"],
"category": one of ["Sleep", "Performance", "Hormones", "Stress", "Nutrition", "Exercise", "Cognition", "Motivation", "Recovery", "Mental Health", "Other"],
"confidence_score": integer between 0-100,
"journals_supporting": array of journal names that validate the claim,
"journals_questioning": array of journal names with mixed/partial support,
"journals_contradicting": array of journal names that dispute the claim
}
Critical Requirements:

Response must be pure JSON - no markdown, no comments, no explanations, no codeblocks
Values must be:

status: exact string match to one of the three options
confidence_score: integer 0-100 only
journal arrays: string arrays using exact journal names as provided,
category: exact string match to one of the categories listed above if not related to any use "Other" instead
Empty/unknown values: use null for missing fields, [] for empty arrays


Special characters:

Use standard ASCII quotes (") not curly quotes
Use standard ASCII hyphens (-) not em/en dashes
Escape special characters properly


No wrapper formatting:

No code blocks
No backticks
No additional text before or after the JSON



Example valid response:
[{
"claim_text": "Example claim",
"status": "Verified",
"confidence_score": 85,
"journals_supporting": ["Nature"],
"journals_questioning": [],
"journals_contradicting": [],
"category": "Other"
}]
If unable to generate valid JSON meeting these requirements, return only: []
`;
