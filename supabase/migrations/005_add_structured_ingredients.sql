-- Add ingredients_structured field to recipes table
-- This migration is idempotent - safe to run multiple times
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recipes' 
    AND column_name = 'ingredients_structured'
  ) THEN
    ALTER TABLE recipes 
    ADD COLUMN ingredients_structured JSONB DEFAULT '[]'::jsonb;
    
    -- Add comment to document the structure
    COMMENT ON COLUMN recipes.ingredients_structured IS 'Structured ingredient data as JSONB array: [{"quantity": string, "tagId": string | null, "notes": string}]';
  END IF;
END $$;

