-- Storage bucket policies for recipe-images
-- These policies allow authenticated users with admin or contributor roles to upload images
-- Note: RLS is already enabled on storage.objects by default in Supabase

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public can view recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Contributors can upload recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete recipe images" ON storage.objects;

-- Policy: Allow public read access to recipe-images bucket
CREATE POLICY "Public can view recipe images"
ON storage.objects FOR SELECT
USING (bucket_id = 'recipe-images');

-- Policy: Allow authenticated admins to upload images
CREATE POLICY "Admins can upload recipe images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recipe-images'
  AND auth.uid() IS NOT NULL
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Policy: Allow authenticated contributors to upload images
CREATE POLICY "Contributors can upload recipe images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recipe-images'
  AND auth.uid() IS NOT NULL
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'contributor'
);

-- Policy: Allow admins to update images
CREATE POLICY "Admins can update recipe images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'recipe-images'
  AND auth.uid() IS NOT NULL
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Policy: Allow admins to delete images
CREATE POLICY "Admins can delete recipe images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recipe-images'
  AND auth.uid() IS NOT NULL
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

