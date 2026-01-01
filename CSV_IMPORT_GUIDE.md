# CSV Import Guide

You can import your recipes, tags, and tag groups from CSV files in two ways:

## Method 1: Web UI (Recommended)

1. Go to http://localhost:3000/admin/import-csv
2. Upload your three CSV files
3. Click "Import"

## Method 2: Command Line

```bash
npx tsx scripts/import-csv.ts tag-groups.csv tags.csv recipes.csv
```

## CSV File Formats

### 1. tag-groups.csv

```csv
name,display_order
Cuisine,0
Type,1
Ingredients,2
```

**Columns:**
- `name` (required): Name of the tag group
- `display_order` (optional): Display order (default: 0)

### 2. tags.csv

```csv
name,tag_group
Chinese,Cuisine
Turkish,Cuisine
Stir-fry,Type
Oven-baked,Type
Chicken,Ingredients
Rice,Ingredients
```

**Columns:**
- `name` (required): Name of the tag
- `tag_group` (required): Name of the tag group this tag belongs to

### 3. recipes.csv

```csv
name,slug,image_url,tags,ingredients,ingredients_text,instructions,inspiration
"Pad Thai","pad-thai","https://example.com/pad-thai.jpg","Thai,Stir-fry","Chicken,Rice","- Rice noodles\n- Chicken breast\n- Pad Thai sauce","1. Cook noodles\n2. Stir-fry chicken\n3. Combine everything","https://example.com/inspiration"
"Lasagna","lasagna","https://example.com/lasagna.jpg","Italian,Oven-baked","Beef,Cheese","- Lasagna noodles\n- Ground beef\n- Ricotta cheese","1. Cook meat\n2. Layer noodles\n3. Bake",""
```

**Columns:**
- `name` (required): Recipe name
- `slug` (optional): URL slug (auto-generated from name if not provided)
- `image_url` (optional): URL to recipe image
- `tags` (optional): Comma-separated list of tag names (e.g., "Thai,Stir-fry")
- `ingredients` (optional): Comma-separated list of ingredient tag names for main ingredients
- `ingredients_text` (optional): Full ingredients list (plain text or Tiptap JSON)
  - Plain text: Use newlines (`\n`) for line breaks, `-` for bullet points
  - Example: `- Rice noodles\n- Chicken\n- Sauce`
- `instructions` (optional): Cooking instructions (plain text or Tiptap JSON)
  - Plain text: Use newlines (`\n`) for line breaks, numbers for steps
  - Example: `1. Cook noodles\n2. Add chicken\n3. Serve`
- `inspiration` (optional): Inspiration/credits (plain text or Tiptap JSON)

## Tips

1. **Tag Groups First**: Make sure tag groups are created before tags
2. **Tags Before Recipes**: Make sure tags exist before importing recipes
3. **CSV Encoding**: Save your CSV files as UTF-8
4. **Quotes**: Use quotes around values that contain commas (e.g., `"Pad Thai, Spicy"`)
5. **Newlines in CSV**: Use `\n` for line breaks within CSV cells

## Example: Complete Import

1. Create `tag-groups.csv`:
```csv
name,display_order
Cuisine,0
Type,1
```

2. Create `tags.csv`:
```csv
name,tag_group
Chinese,Cuisine
Thai,Cuisine
Stir-fry,Type
```

3. Create `recipes.csv`:
```csv
name,slug,image_url,tags,ingredients,ingredients_text,instructions,inspiration
"Pad Thai","pad-thai","","Thai,Stir-fry","Chicken,Rice","- Rice noodles\n- Chicken","1. Cook noodles\n2. Add chicken",""
```

4. Run import:
```bash
npx tsx scripts/import-csv.ts tag-groups.csv tags.csv recipes.csv
```

## Troubleshooting

- **"Tag group not found"**: Make sure tag groups are imported before tags
- **"Tag not found"**: Make sure tags are imported before recipes
- **Duplicate errors**: The script skips existing items, so it's safe to re-run
- **Encoding issues**: Make sure CSV files are saved as UTF-8

