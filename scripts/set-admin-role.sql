-- Set admin role for a user
-- Replace 'your-email@example.com' with your actual email address

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT id, email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'your-email@example.com';

