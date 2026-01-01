-- Fix RLS policies to use JWT token instead of querying auth.users
-- This fixes the "permission denied for table users" error

-- Drop existing policies that query auth.users
DROP POLICY IF EXISTS "Tag groups can be created by admins" ON tag_groups;
DROP POLICY IF EXISTS "Tag groups can be updated by admins" ON tag_groups;
DROP POLICY IF EXISTS "Tag groups can be deleted by admins" ON tag_groups;

DROP POLICY IF EXISTS "Tags can be created by admins" ON tags;
DROP POLICY IF EXISTS "Tags can be updated by admins" ON tags;
DROP POLICY IF EXISTS "Tags can be deleted by admins" ON tags;

DROP POLICY IF EXISTS "Recipes can be created by contributors and admins" ON recipes;
DROP POLICY IF EXISTS "Recipes can be updated by their creator or admins" ON recipes;
DROP POLICY IF EXISTS "Recipes can be deleted by admins" ON recipes;

DROP POLICY IF EXISTS "Recipe tags can be managed by contributors and admins" ON recipe_tags;
DROP POLICY IF EXISTS "Recipe ingredients can be managed by contributors and admins" ON recipe_ingredients;

-- Recreate policies using JWT token metadata
-- Tag Groups Policies
CREATE POLICY "Tag groups can be created by admins"
  ON tag_groups FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Tag groups can be updated by admins"
  ON tag_groups FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Tag groups can be deleted by admins"
  ON tag_groups FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Tags Policies
CREATE POLICY "Tags can be created by admins"
  ON tags FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Tags can be updated by admins"
  ON tags FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Tags can be deleted by admins"
  ON tags FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Recipes Policies
CREATE POLICY "Recipes can be created by contributors and admins"
  ON recipes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'contributor'
      OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    )
  );

CREATE POLICY "Recipes can be updated by their creator or admins"
  ON recipes FOR UPDATE
  USING (
    created_by = auth.uid()
    OR (
      auth.uid() IS NOT NULL
      AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    )
  );

CREATE POLICY "Recipes can be deleted by admins"
  ON recipes FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Recipe Tags Policies
CREATE POLICY "Recipe tags can be managed by contributors and admins"
  ON recipe_tags FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'contributor'
      OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    )
  );

-- Recipe Ingredients Policies
CREATE POLICY "Recipe ingredients can be managed by contributors and admins"
  ON recipe_ingredients FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'contributor'
      OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    )
  );

