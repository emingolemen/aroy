# Running Supabase Migrations

You have two options to run the migrations:

## Option 1: Using Supabase Dashboard (Recommended - Easiest)

1. **Open your Supabase project dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the first migration**
   - Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Wait for it to complete successfully

4. **Run the second migration**
   - Copy the entire contents of `supabase/migrations/002_rls_policies.sql`
   - Paste it into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Wait for it to complete successfully

5. **Verify the migrations**
   - Go to "Table Editor" in the left sidebar
   - You should see all the tables created:
     - tag_groups
     - tags
     - recipes
     - recipe_tags
     - recipe_ingredients
     - user_favorites
     - calendar_entries
     - shopping_lists
     - shopping_list_items

## Option 2: Using Supabase CLI (Advanced)

If you prefer using the CLI:

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link your project**
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (You can find your project ref in the project settings URL)

4. **Run migrations**
   ```bash
   supabase db push
   ```

## After Running Migrations

1. **Create the storage bucket for recipe images**
   - Go to "Storage" in the Supabase dashboard
   - Click "New bucket"
   - Name: `recipe-images`
   - Public: ✅ Yes (check this box)
   - Click "Create bucket"

2. **Set up your environment variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase credentials from Project Settings > API

3. **Create your first admin user**
   - Start the dev server: `npm run dev`
   - Sign up at http://localhost:3000/signup
   - Go to Supabase Dashboard > Authentication > Users
   - Find your user and click "Edit"
   - Under "User Metadata", add:
     ```json
     {
       "role": "admin"
     }
     ```

## Troubleshooting

If you encounter errors:

- **"relation already exists"**: The table already exists. You can either drop it first or skip that part of the migration.
- **"permission denied"**: Make sure you're running the SQL as the postgres user (default in SQL Editor).
- **"extension already exists"**: This is fine, the `IF NOT EXISTS` clause handles this.

If you need to reset everything:
- Go to SQL Editor and run: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
- Then re-run the migrations

