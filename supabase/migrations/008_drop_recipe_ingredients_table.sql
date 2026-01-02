-- Drop the recipe_ingredients table and its index
-- This table is no longer needed since we're using ingredients_structured JSONB column
-- All data has already been removed in migration 007

-- Drop the index first (if it exists)
DROP INDEX IF EXISTS idx_recipe_ingredients_recipe_id;
DROP INDEX IF EXISTS idx_recipe_ingredients_tag_id;

-- Drop the table
DROP TABLE IF EXISTS recipe_ingredients;

