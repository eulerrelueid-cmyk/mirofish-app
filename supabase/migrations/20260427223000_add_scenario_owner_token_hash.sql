ALTER TABLE mirofish_scenarios
ADD COLUMN IF NOT EXISTS owner_token_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_mirofish_scenarios_owner_token_hash
ON mirofish_scenarios(owner_token_hash);
