#!/usr/bin/env tsx

/**
 * Import script for Framer CMS CSV exports
 * 
 * Usage:
 *   npx tsx scripts/import-framer-csv.ts
 * 
 * Make sure these files are in the project root:
 *   - Tag Categories.csv
 *   - Tags.csv
 *   - Ingredient Categories.csv
 *   - Ingredients.csv
 *   - Recipes.csv
 * 
 * Make sure .env.local exists with:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

import { createAdminClient } from '../lib/supabase/admin'
import { parse } from 'csv-parse/sync'
import * as fs from 'fs'
import * as path from 'path'

interface CSVRow {
  [key: string]: string
}

// Helper to convert HTML to Tiptap JSON
function htmlToTiptapJSON(html: string): string {
  if (!html || !html.trim()) {
    return '{"type":"doc","content":[]}'
  }

  // If it's already JSON, return as is
  if (html.trim().startsWith('{')) {
    try {
      JSON.parse(html)
      return html
    } catch {
      // Invalid JSON, treat as HTML
    }
  }

  // Simple HTML to Tiptap conversion
  // Remove HTML tags and convert to paragraphs
  const text = html
    .replace(/<h6>(.*?)<\/h6>/gi, '\n### $1\n')
    .replace(/<h4>(.*?)<\/h4>/gi, '\n## $1\n')
    .replace(/<ul>/gi, '')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol>/gi, '')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()

  const lines = text.split('\n').filter(line => line.trim())
  const paragraphs: any[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Check for headings
    if (trimmed.startsWith('### ')) {
      paragraphs.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: trimmed.substring(4) }]
      })
    } else if (trimmed.startsWith('## ')) {
      paragraphs.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: trimmed.substring(3) }]
      })
    } else if (trimmed.startsWith('- ')) {
      // Bullet point
      paragraphs.push({
        type: 'paragraph',
        content: [{ type: 'text', text: trimmed.substring(2) }]
      })
    } else {
      // Regular paragraph
      paragraphs.push({
        type: 'paragraph',
        content: [{ type: 'text', text: trimmed }]
      })
    }
  }

  return JSON.stringify({
    type: 'doc',
    content: paragraphs.length > 0 ? paragraphs : [{
      type: 'paragraph',
      content: []
    }]
  })
}

async function main() {
  const supabase = createAdminClient()
  const projectRoot = process.cwd()

  console.log('Starting Framer CMS CSV import...\n')

  // Step 1: Import Tag Categories
  console.log('1. Importing Tag Categories...')
  const tagCategoriesPath = path.join(projectRoot, 'Tag Categories.csv')
  if (!fs.existsSync(tagCategoriesPath)) {
    console.error(`Error: ${tagCategoriesPath} not found`)
    process.exit(1)
  }

  const tagCategoriesContent = fs.readFileSync(tagCategoriesPath, 'utf-8')
  const tagCategoriesRecords: CSVRow[] = parse(tagCategoriesContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  })

  const tagCategoryMap = new Map<string, string>() // slug -> id
  let displayOrder = 0

  for (const record of tagCategoriesRecords) {
    const slug = record.Slug?.trim()
    const title = record.Title?.trim() || slug

    if (!slug) continue

    const { data: existing } = await supabase
      .from('tag_groups')
      .select('id')
      .eq('name', title)
      .single()

    if (existing) {
      console.log(`  Tag Category "${title}" already exists`)
      tagCategoryMap.set(slug, existing.id)
      continue
    }

    const { data, error } = await supabase
      .from('tag_groups')
      .insert({
        name: title,
        display_order: displayOrder++,
      })
      .select()
      .single()

    if (error) {
      console.error(`  Error creating tag category "${title}":`, error.message)
      continue
    }

    console.log(`  ✓ Created tag category: ${title}`)
    tagCategoryMap.set(slug, data.id)
  }

  // Step 2: Import Ingredient Categories
  console.log('\n2. Importing Ingredient Categories...')
  const ingredientCategoriesPath = path.join(projectRoot, 'Ingredient Categories.csv')
  if (!fs.existsSync(ingredientCategoriesPath)) {
    console.error(`Error: ${ingredientCategoriesPath} not found`)
    process.exit(1)
  }

  const ingredientCategoriesContent = fs.readFileSync(ingredientCategoriesPath, 'utf-8')
  const ingredientCategoriesRecords: CSVRow[] = parse(ingredientCategoriesContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  })

  const ingredientCategoryMap = new Map<string, string>() // slug -> id

  for (const record of ingredientCategoriesRecords) {
    const slug = record.Slug?.trim()
    const title = record.Title?.trim() || slug

    if (!slug) continue

    const { data: existing } = await supabase
      .from('tag_groups')
      .select('id')
      .eq('name', title)
      .single()

    if (existing) {
      console.log(`  Ingredient Category "${title}" already exists`)
      ingredientCategoryMap.set(slug, existing.id)
      continue
    }

    const { data, error } = await supabase
      .from('tag_groups')
      .insert({
        name: title,
        display_order: displayOrder++,
      })
      .select()
      .single()

    if (error) {
      console.error(`  Error creating ingredient category "${title}":`, error.message)
      continue
    }

    console.log(`  ✓ Created ingredient category: ${title}`)
    ingredientCategoryMap.set(slug, data.id)
  }

  // Step 3: Import Tags
  console.log('\n3. Importing Tags...')
  const tagsPath = path.join(projectRoot, 'Tags.csv')
  if (!fs.existsSync(tagsPath)) {
    console.error(`Error: ${tagsPath} not found`)
    process.exit(1)
  }

  const tagsContent = fs.readFileSync(tagsPath, 'utf-8')
  const tagsRecords: CSVRow[] = parse(tagsContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  })

  const tagMap = new Map<string, string>() // slug -> id

  for (const record of tagsRecords) {
    const slug = record.Slug?.trim()
    const title = record.Title?.trim() || slug
    const categorySlug = record['Tag Category']?.trim()

    if (!slug || !categorySlug) {
      console.warn(`  Skipping tag with missing slug or category: ${title}`)
      continue
    }

    const categoryId = tagCategoryMap.get(categorySlug)
    if (!categoryId) {
      console.warn(`  Tag category "${categorySlug}" not found for tag "${title}"`)
      continue
    }

    const { data: existing } = await supabase
      .from('tags')
      .select('id')
      .eq('tag_group_id', categoryId)
      .eq('name', title)
      .single()

    if (existing) {
      console.log(`  Tag "${title}" already exists`)
      tagMap.set(slug, existing.id)
      continue
    }

    const { data, error } = await supabase
      .from('tags')
      .insert({
        tag_group_id: categoryId,
        name: title,
      })
      .select()
      .single()

    if (error) {
      console.error(`  Error creating tag "${title}":`, error.message)
      continue
    }

    console.log(`  ✓ Created tag: ${title}`)
    tagMap.set(slug, data.id)
  }

  // Step 4: Import Ingredients (as tags)
  console.log('\n4. Importing Ingredients...')
  const ingredientsPath = path.join(projectRoot, 'Ingredients.csv')
  if (!fs.existsSync(ingredientsPath)) {
    console.error(`Error: ${ingredientsPath} not found`)
    process.exit(1)
  }

  const ingredientsContent = fs.readFileSync(ingredientsPath, 'utf-8')
  const ingredientsRecords: CSVRow[] = parse(ingredientsContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  })

  const ingredientMap = new Map<string, string>() // slug -> id

  for (const record of ingredientsRecords) {
    const slug = record.Slug?.trim()
    const name = record.Name?.trim() || slug
    const categorySlug = record.Category?.trim()

    if (!slug) {
      console.warn(`  Skipping ingredient with missing slug: ${name}`)
      continue
    }

    // If no category, skip (or create a default one)
    if (!categorySlug) {
      console.warn(`  Ingredient "${name}" has no category, skipping`)
      continue
    }

    const categoryId = ingredientCategoryMap.get(categorySlug)
    if (!categoryId) {
      console.warn(`  Ingredient category "${categorySlug}" not found for ingredient "${name}"`)
      continue
    }

    const { data: existing } = await supabase
      .from('tags')
      .select('id')
      .eq('tag_group_id', categoryId)
      .eq('name', name)
      .single()

    if (existing) {
      console.log(`  Ingredient "${name}" already exists`)
      ingredientMap.set(slug, existing.id)
      continue
    }

    const { data, error } = await supabase
      .from('tags')
      .insert({
        tag_group_id: categoryId,
        name: name,
      })
      .select()
      .single()

    if (error) {
      console.error(`  Error creating ingredient "${name}":`, error.message)
      continue
    }

    console.log(`  ✓ Created ingredient: ${name}`)
    ingredientMap.set(slug, data.id)
  }

  // Step 5: Import Recipes
  console.log('\n5. Importing Recipes...')
  const recipesPath = path.join(projectRoot, 'Recipes.csv')
  if (!fs.existsSync(recipesPath)) {
    console.error(`Error: ${recipesPath} not found`)
    process.exit(1)
  }

  const recipesContent = fs.readFileSync(recipesPath, 'utf-8')
  const recipesRecords: CSVRow[] = parse(recipesContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  })

  let successCount = 0
  let errorCount = 0

  for (const record of recipesRecords) {
    try {
      const slug = record.Slug?.trim()
      const title = record.Title?.trim()
      const imageUrl = record.Image?.trim() || null
      const tagsStr = record.Tags?.trim() || ''
      const ingredientsStr = record.Ingredients?.trim() || ''
      const ingredientsText = record['Ingredients Text']?.trim() || ''
      const instructionsText = record['Instructions Text']?.trim() || ''
      const inspiration = record.Inspiration?.trim() || ''

      if (!slug || !title) {
        console.warn(`  Skipping recipe with missing slug or title`)
        errorCount++
        continue
      }

      // Check if recipe exists
      const { data: existing } = await supabase
        .from('recipes')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existing) {
        console.log(`  Recipe "${title}" already exists (slug: ${slug})`)
        continue
      }

      // Parse tags (comma-separated slugs)
      const tagSlugs = tagsStr.split(',').map(s => s.trim()).filter(Boolean)
      const tagIds = tagSlugs
        .map(tagSlug => tagMap.get(tagSlug))
        .filter(Boolean) as string[]

      // Parse ingredients (comma-separated slugs)
      const ingredientSlugs = ingredientsStr.split(',').map(s => s.trim()).filter(Boolean)
      const ingredientTagIds = ingredientSlugs
        .map(ingSlug => ingredientMap.get(ingSlug))
        .filter(Boolean) as string[]

      // Convert HTML to Tiptap JSON
      const ingredientsTextJSON = htmlToTiptapJSON(ingredientsText)
      const instructionsJSON = htmlToTiptapJSON(instructionsText)
      const inspirationJSON = htmlToTiptapJSON(inspiration)

      // Create recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          slug,
          name: title,
          image_url: imageUrl,
          ingredients_text: ingredientsTextJSON,
          instructions: instructionsJSON,
          inspiration: inspirationJSON,
        })
        .select()
        .single()

      if (recipeError) {
        console.error(`  Error creating recipe "${title}":`, recipeError.message)
        errorCount++
        continue
      }

      // Link tags
      if (tagIds.length > 0) {
        await supabase.from('recipe_tags').insert(
          tagIds.map(tagId => ({
            recipe_id: recipe.id,
            tag_id: tagId,
          }))
        )
      }

      // Link main ingredients
      if (ingredientTagIds.length > 0) {
        await supabase.from('recipe_ingredients').insert(
          ingredientTagIds.map(tagId => ({
            recipe_id: recipe.id,
            tag_id: tagId,
          }))
        )
      }

      console.log(`  ✓ Created recipe: ${title}`)
      successCount++
    } catch (error) {
      console.error(`  Error processing recipe:`, error)
      errorCount++
    }
  }

  console.log(`\n✓ Import complete!`)
  console.log(`  Recipes: ${successCount} successful, ${errorCount} errors`)
  console.log(`  Tag Categories: ${tagCategoryMap.size}`)
  console.log(`  Ingredient Categories: ${ingredientCategoryMap.size}`)
  console.log(`  Tags: ${tagMap.size}`)
  console.log(`  Ingredients: ${ingredientMap.size}`)
}

main().catch(console.error)

