# Setup Guide

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Supabase**
   - Create a new project at https://supabase.com
   - Run the SQL migrations in order:
     - `supabase/migrations/001_initial_schema.sql`
     - `supabase/migrations/002_rls_policies.sql`

3. **Create Storage Bucket**
   - Go to Storage in Supabase dashboard
   - Click "New bucket"
   - Name: `recipe-images`
   - Public: Yes (checked)
   - Click "Create bucket"

4. **Configure Environment Variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase credentials:
     - `NEXT_PUBLIC_SUPABASE_URL`: Found in Project Settings > API
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Found in Project Settings > API
     - `SUPABASE_SERVICE_ROLE_KEY`: Found in Project Settings > API (keep secret!)

5. **Set up your first admin user**
   - Start the dev server: `npm run dev`
   - Sign up at http://localhost:3000/signup
   - Go to Supabase Dashboard > Authentication > Users
   - Find your user and click Edit
   - Under "User Metadata", add:
     ```json
     {
       "role": "admin"
     }
     ```

6. **Run the app**
   ```bash
   npm run dev
   ```

## Migrating Data from Framer CMS

1. Export your data from Framer CMS
2. Format it according to the structure expected by `lib/migrations/framer-import.ts`
3. Use the migration API endpoint at `/api/migrate` (POST request) or run the import function directly

Example migration payload:
```json
{
  "tagGroups": [
    {
      "name": "Cuisine",
      "displayOrder": 0
    }
  ],
  "tags": [
    {
      "name": "Chinese",
      "tagGroup": "Cuisine"
    }
  ],
  "recipes": [
    {
      "name": "Recipe Name",
      "slug": "recipe-name",
      "image": "https://example.com/image.jpg",
      "tags": ["Chinese"],
      "ingredients": ["Chicken"],
      "ingredientsText": "{\"type\":\"doc\",\"content\":[]}",
      "instructions": "{\"type\":\"doc\",\"content\":[]}",
      "inspiration": "{\"type\":\"doc\",\"content\":[]}"
    }
  ]
}
```

## User Roles

- **viewer**: Default role, can read recipes and use favorites/calendar/shopping lists
- **contributor**: Can create and edit their own recipes
- **admin**: Full access including tag management and deleting any recipe

To change a user's role, edit their metadata in Supabase Dashboard > Authentication > Users.

