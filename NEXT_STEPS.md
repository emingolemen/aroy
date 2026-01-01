# Next Steps After Running Migrations

## ✅ Step 1: Verify Migrations Ran Successfully

1. Go to your Supabase Dashboard
2. Click on "Table Editor" in the left sidebar
3. You should see these 9 tables:
   - `tag_groups`
   - `tags`
   - `recipes`
   - `recipe_tags`
   - `recipe_ingredients`
   - `user_favorites`
   - `calendar_entries`
   - `shopping_lists`
   - `shopping_list_items`

If you see all these tables, migrations were successful! ✅

---

## 📦 Step 2: Create Storage Bucket for Recipe Images

1. In Supabase Dashboard, go to **Storage** (left sidebar)
2. Click **"New bucket"**
3. Fill in:
   - **Name**: `recipe-images`
   - **Public bucket**: ✅ **Check this box** (important!)
4. Click **"Create bucket"**

---

## 🔑 Step 3: Set Up Environment Variables

1. **Get your Supabase credentials:**
   - Go to **Project Settings** → **API** in Supabase Dashboard
   - You'll see:
     - Project URL
     - `anon` `public` key
     - `service_role` `secret` key (keep this secret!)

2. **Create `.env.local` file:**
   ```bash
   cp .env.local.example .env.local
   ```

3. **Edit `.env.local`** and fill in your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

---

## 👤 Step 4: Create Your First Admin User

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Sign up for an account:**
   - Open http://localhost:3000/signup
   - Create your account with email and password

3. **Set yourself as admin:**
   - Go to Supabase Dashboard → **Authentication** → **Users**
   - Find your user email and click **"Edit"** (or the three dots menu)
   - Scroll down to **"User Metadata"**
   - Click **"Add row"** or edit the JSON:
     ```json
     {
       "role": "admin"
     }
     ```
   - Click **"Save"**

---

## 🧪 Step 5: Test the Application

1. **Visit the homepage:**
   - http://localhost:3000
   - You should see the recipe listing page

2. **Test admin features:**
   - Go to http://localhost:3000/admin/recipes
   - Click **"New Recipe"** to create your first recipe
   - Go to http://localhost:3000/admin/tags to manage tags

3. **Test user features:**
   - Go to http://localhost:3000/favorites
   - Go to http://localhost:3000/calendar
   - Go to http://localhost:3000/shopping-lists

---

## 🚀 Step 6: Deploy to Vercel (Optional)

When you're ready to deploy:

1. **Push your code to GitHub**
2. **Import to Vercel:**
   - Go to https://vercel.com
   - Click **"New Project"**
   - Import your GitHub repository
3. **Add environment variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add the same three variables from `.env.local`
4. **Deploy!**

---

## 📝 Quick Checklist

- [ ] Migrations ran successfully (9 tables visible)
- [ ] Storage bucket `recipe-images` created (public)
- [ ] `.env.local` file created with Supabase credentials
- [ ] Development server running (`npm run dev`)
- [ ] First user account created
- [ ] User set as admin in Supabase
- [ ] Can access admin pages
- [ ] Can create a test recipe

---

## 🆘 Troubleshooting

**"Invalid API key" error:**
- Double-check your `.env.local` file
- Make sure there are no extra spaces or quotes
- Restart the dev server after changing env vars

**"Permission denied" error:**
- Make sure you set your user role to "admin" in Supabase
- Check that RLS policies were created (should be in the second migration)

**Storage upload fails:**
- Verify the `recipe-images` bucket exists
- Make sure it's set to **public**
- Check bucket policies in Supabase Storage settings

**Can't access admin pages:**
- Make sure your user metadata has `"role": "admin"`
- Try logging out and back in
- Check browser console for errors

---

## 🎉 You're All Set!

Once you complete these steps, you can:
- Start creating recipes and tags
- Migrate your existing Framer CMS data
- Use all the features (favorites, calendar, shopping lists)

Need help? Check the `README.md` or `SETUP.md` files for more details.

