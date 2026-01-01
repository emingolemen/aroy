-- Migration: Remove unwanted tag groups
-- This migration deletes tag groups that are NOT:
--   - "cuisine"
--   - "type"  
--   - Ingredient-related groups (name contains "ingredient", "protein", "veggie", "carb", or "dairy")
-- Tags within deleted groups will be automatically removed due to ON DELETE CASCADE

-- Delete tag groups that are not cuisine, type, or ingredient-related
DELETE FROM tag_groups
WHERE LOWER(name) NOT IN ('cuisine', 'type')
  AND LOWER(name) NOT LIKE '%ingredient%'
  AND LOWER(name) NOT LIKE '%protein%'
  AND LOWER(name) NOT LIKE '%veggie%'
  AND LOWER(name) NOT LIKE '%carb%'
  AND LOWER(name) NOT LIKE '%dairy%';

-- Note: Tags within deleted tag groups are automatically removed
-- due to the ON DELETE CASCADE constraint on tags.tag_group_id

