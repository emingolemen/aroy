# Setting Your User Role to Admin

## Quick Steps:

1. **Go to Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication**
   - Click "Authentication" in the left sidebar
   - Click "Users" tab

3. **Find Your User**
   - Look for your email address in the users list
   - Click the three dots (⋮) or "Edit" button next to your user

4. **Add Admin Role**
   - Scroll down to "User Metadata" section
   - Click "Add row" or edit the JSON
   - Add this:
     ```json
     {
       "role": "admin"
     }
     ```
   - Click "Save"

5. **Verify**
   - Log out and log back in (or refresh the page)
   - You should now see "Admin" link in the navigation
   - Visit http://localhost:3000/admin/recipes to test

## Alternative: Using SQL Editor

If you prefer SQL, you can also run this in the SQL Editor:

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'your-email@example.com';
```

Replace `your-email@example.com` with your actual email address.

