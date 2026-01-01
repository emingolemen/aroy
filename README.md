# Gölemens' Meals - Recipe CMS

A modern recipe management system built with Next.js, Supabase, and Vercel. Migrated from Framer CMS with enhanced features including user authentication, favorites, calendar meal planning, and shopping list generation.

## Features

- **Recipe Management**: Full CRUD operations for recipes with rich text editing
- **Tag System**: Organized tag groups (Cuisine, Type, Ingredients) with hierarchical organization
- **User Authentication**: Sign up, login, and role-based access control (Viewer, Contributor, Admin)
- **Favorites**: Save and manage favorite recipes
- **Meal Calendar**: Plan meals by assigning recipes to breakfast, lunch, and dinner slots
- **Shopping Lists**: Generate shopping lists from calendar entries or create manually
- **Rich Text Editing**: Tiptap editor for ingredients, instructions, and inspiration fields
- **Image Upload**: Recipe images stored in Supabase Storage

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Rich Text**: Tiptap
- **Deployment**: Vercel

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- A Vercel account (for deployment)

### 2. Clone and Install

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor and run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`

3. Create a storage bucket for recipe images:
   - Go to Storage in Supabase dashboard
   - Create a new bucket named `recipe-images`
   - Set it to public

4. Get your Supabase credentials:
   - Project URL
   - Anon/public key
   - Service role key (keep this secret!)

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Set Up User Roles

After creating your first user account, you'll need to set their role in Supabase:

1. Go to Authentication > Users in Supabase dashboard
2. Find your user and click Edit
3. Under "User Metadata", add:
   ```json
   {
     "role": "admin"
   }
   ```

Available roles:
- `viewer`: Read-only access, can use favorites, calendar, and shopping lists
- `contributor`: Can create and edit recipes (own recipes only)
- `admin`: Full access including tag management and deleting any recipe

## Migration from Framer CMS

To migrate your existing recipes from Framer CMS:

1. Export your data from Framer CMS as JSON
2. Format it according to the expected structure (see `lib/migrations/framer-import.ts`)
3. Use the migration API endpoint or run the import function directly

Example migration data structure:

```json
{
  "tagGroups": [
    {
      "id": "1",
      "name": "Cuisine",
      "displayOrder": 0
    }
  ],
  "tags": [
    {
      "id": "1",
      "name": "Chinese",
      "tagGroup": "Cuisine"
    }
  ],
  "recipes": [
    {
      "name": "Recipe Name",
      "slug": "recipe-name",
      "image": "https://example.com/image.jpg",
      "tags": ["Chinese", "Stir-fry"],
      "ingredients": ["Chicken", "Rice"],
      "ingredientsText": "Rich text content",
      "instructions": "Rich text content",
      "inspiration": "Rich text content"
    }
  ]
}
```

## Project Structure

```
/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (public)/        # Public recipe pages
│   ├── (protected)/    # User-only pages
│   │   ├── admin/      # Admin interface
│   │   ├── favorites/  # User favorites
│   │   ├── calendar/   # Meal calendar
│   │   └── shopping-lists/ # Shopping lists
│   └── api/            # API routes
├── components/
│   ├── admin/          # Admin components
│   ├── auth/           # Auth components
│   ├── calendar/       # Calendar components
│   ├── editor/         # Rich text editor
│   ├── recipes/        # Recipe components
│   ├── shopping/       # Shopping list components
│   └── ui/             # shadcn/ui components
├── lib/
│   ├── auth/           # Auth utilities
│   ├── migrations/     # Migration scripts
│   └── supabase/       # Supabase clients
├── supabase/
│   └── migrations/     # Database migrations
└── types/              # TypeScript types
```

## Deployment to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The app will automatically build and deploy on every push to main.

## Database Schema

### Core Tables

- `tag_groups`: Organize tags into groups (Cuisine, Type, Ingredients, etc.)
- `tags`: Individual tags belonging to tag groups
- `recipes`: Recipe data with rich text fields
- `recipe_tags`: Many-to-many relationship between recipes and tags
- `recipe_ingredients`: Many-to-many relationship for main ingredients
- `user_favorites`: User's favorite recipes
- `calendar_entries`: Meal assignments to calendar dates
- `shopping_lists`: User shopping lists
- `shopping_list_items`: Items in shopping lists

All tables have Row Level Security (RLS) policies enabled for data protection.

## License

MIT
