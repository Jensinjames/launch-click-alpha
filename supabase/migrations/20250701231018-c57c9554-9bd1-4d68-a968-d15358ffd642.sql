-- Remove the incorrect unique constraint and dependent foreign key constraint
-- This constraint is preventing users from creating multiple content items of the same type
ALTER TABLE generated_content DROP CONSTRAINT IF EXISTS generated_content_type_fkey CASCADE;
ALTER TABLE generated_content DROP CONSTRAINT IF EXISTS generated_content_type_key CASCADE;

-- Add a non-unique index for performance on the type column
CREATE INDEX IF NOT EXISTS idx_generated_content_type ON generated_content(type);

-- Add a composite index for user queries (user_id, type, created_at)
CREATE INDEX IF NOT EXISTS idx_generated_content_user_type_created 
ON generated_content(user_id, type, created_at DESC);