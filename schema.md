# DB SCHEMA

| table_name              | column_name               | data_type                |
| ----------------------- | ------------------------- | ------------------------ |
| claims                  | id                        | uuid                     |
| claims                  | influencer_id             | uuid                     |
| claims                  | claim_text                | text                     |
| claims                  | source_content            | text                     |
| claims                  | source_platform           | text                     |
| claims                  | category                  | text                     |
| claims                  | status                    | text                     |
| claims                  | confidence_score          | double precision         |
| claims                  | scientific_evidence       | jsonb                    |
| claims                  | analyzed_at               | timestamp with time zone |
| claims                  | created_at                | timestamp with time zone |
| influencers             | id                        | uuid                     |
| influencers             | canonical_name            | text                     |
| influencers             | known_aliases             | ARRAY                    |
| influencers             | platform_handles          | jsonb                    |
| influencers             | credentials               | ARRAY                    |
| influencers             | categories                | ARRAY                    |
| influencers             | follower_count            | integer                  |
| influencers             | trust_score               | double precision         |
| influencers             | verified_claims_count     | integer                  |
| influencers             | questionable_claims_count | integer                  |
| influencers             | debunked_claims_count     | integer                  |
| influencers             | last_analyzed             | timestamp with time zone |
| influencers             | created_at                | timestamp with time zone |
| research_configurations | id                        | uuid                     |
| research_configurations | name                      | text                     |
| research_configurations | date_range_start          | date                     |
| research_configurations | date_range_end            | date                     |
| research_configurations | max_claims_to_analyze     | integer                  |
| research_configurations | journals                  | ARRAY                    |
| research_configurations | created_at                | timestamp with time zone |
