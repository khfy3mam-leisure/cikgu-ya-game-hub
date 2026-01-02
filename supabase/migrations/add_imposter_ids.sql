-- Add imposter_ids column to store multiple imposters as JSON array
ALTER TABLE rounds 
ADD COLUMN IF NOT EXISTS imposter_ids JSONB DEFAULT '[]'::jsonb;

-- Migrate existing imposter_id to imposter_ids array
UPDATE rounds 
SET imposter_ids = jsonb_build_array(imposter_id)
WHERE imposter_id IS NOT NULL AND (imposter_ids IS NULL OR imposter_ids = '[]'::jsonb);

