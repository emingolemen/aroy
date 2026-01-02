-- Remove all ingredient tags from recipe_ingredients table
-- Structured ingredients store tagIds directly in ingredients_structured JSONB column,
-- so they don't depend on recipe_ingredients table. This migration removes the old
-- direct associations while preserving tags that are referenced in structured ingredients.

-- Delete all entries from recipe_ingredients table
-- The tags themselves remain in the tags table and can still be referenced
-- through ingredients_structured JSONB column
DELETE FROM recipe_ingredients;

