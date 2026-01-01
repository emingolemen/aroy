import { createAdminClient } from '@/lib/supabase/admin'
import { parse } from 'csv-parse/sync'
import * as fs from 'fs'
import * as path from 'path'

interface CSVRow {
  [key: string]: string
}

/**
 * Import tag groups from CSV
 * Expected CSV format:
 * name,display_order
 * Cuisine,0
 * Type,1
 */
export async function importTagGroupsFromCSV(filePath: string) {
  const supabase = createAdminClient()
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  
  const records: CSVRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  })

  const tagGroupMap = new Map<string, string>() // CSV name -> Supabase ID

  for (const record of records) {
    const name = record.name?.trim()
    const displayOrder = parseInt(record.display_order || '0', 10)

    if (!name) {
      console.warn('Skipping tag group with no name:', record)
      continue
    }

    // Check if exists
    const { data: existing } = await supabase
      .from('tag_groups')
      .select('id')
      .eq('name', name)
      .single()

    if (existing) {
      console.log(`Tag group "${name}" already exists, skipping`)
      tagGroupMap.set(name, existing.id)
      continue
    }

    const { data, error } = await supabase
      .from('tag_groups')
      .insert({
        name,
        display_order: displayOrder,
      })
      .select()
      .single()

    if (error) {
      console.error(`Error creating tag group "${name}":`, error)
      continue
    }

    console.log(`Created tag group: ${name}`)
    tagGroupMap.set(name, data.id)
  }

  return tagGroupMap
}

/**
 * Import tags from CSV
 * Expected CSV format:
 * name,tag_group
 * Chinese,Cuisine
 * Stir-fry,Type
 */
export async function importTagsFromCSV(filePath: string, tagGroupMap: Map<string, string>) {
  const supabase = createAdminClient()
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  
  const records: CSVRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  })

  const tagMap = new Map<string, string>() // CSV name -> Supabase ID

  for (const record of records) {
    const name = record.name?.trim()
    const tagGroupName = record.tag_group?.trim()

    if (!name || !tagGroupName) {
      console.warn('Skipping tag with missing name or tag_group:', record)
      continue
    }

    const tagGroupId = tagGroupMap.get(tagGroupName)
    if (!tagGroupId) {
      console.warn(`Tag group "${tagGroupName}" not found for tag "${name}", skipping`)
      continue
    }

    // Check if exists
    const { data: existing } = await supabase
      .from('tags')
      .select('id')
      .eq('tag_group_id', tagGroupId)
      .eq('name', name)
      .single()

    if (existing) {
      console.log(`Tag "${name}" already exists in "${tagGroupName}", skipping`)
      tagMap.set(name, existing.id)
      continue
    }

    const { data, error } = await supabase
      .from('tags')
      .insert({
        tag_group_id: tagGroupId,
        name,
      })
      .select()
      .single()

    if (error) {
      console.error(`Error creating tag "${name}":`, error)
      continue
    }

    console.log(`Created tag: ${name} (${tagGroupName})`)
    tagMap.set(name, data.id)
  }

  return tagMap
}

/**
 * Import recipes from CSV
 * Expected CSV format:
 * name,slug,image_url,tags,ingredients,ingredients_text,instructions,inspiration
 * 
 * Notes:
 * - tags: comma-separated list of tag names
 * - ingredients: comma-separated list of ingredient tag names (for main ingredients)
 * - ingredients_text: rich text JSON or plain text (will be converted)
 * - instructions: rich text JSON or plain text (will be converted)
 * - inspiration: rich text JSON or plain text (will be converted)
 */
export async function importRecipesFromCSV(
  filePath: string,
  tagMap: Map<string, string>
) {
  const supabase = createAdminClient()
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  
  const records: CSVRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  })

  let successCount = 0
  let errorCount = 0

  for (const record of records) {
    try {
      const name = record.name?.trim()
      if (!name) {
        console.warn('Skipping recipe with no name:', record)
        errorCount++
        continue
      }

      const slug = record.slug?.trim() || generateSlug(name)
      const imageUrl = record.image_url?.trim() || null
      
      // Parse tags (comma-separated)
      const tagNames = record.tags?.split(',').map((t: string) => t.trim()).filter(Boolean) || []
      const tagIds = tagNames
        .map((tagName: string) => tagMap.get(tagName))
        .filter(Boolean) as string[]

      // Parse main ingredients (comma-separated)
      const ingredientNames = record.ingredients?.split(',').map((i: string) => i.trim()).filter(Boolean) || []
      const ingredientTagIds = ingredientNames
        .map((ingName: string) => tagMap.get(ingName))
        .filter(Boolean) as string[]

      // Convert rich text fields
      const ingredientsText = convertToTiptapJSON(record.ingredients_text || '')
      const instructions = convertToTiptapJSON(record.instructions || '')
      const inspiration = convertToTiptapJSON(record.inspiration || '')

      // Check if recipe exists
      const { data: existing } = await supabase
        .from('recipes')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existing) {
        console.log(`Recipe "${name}" already exists (slug: ${slug}), skipping`)
        continue
      }

      // Create recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          slug,
          name,
          image_url: imageUrl,
          ingredients_text: ingredientsText,
          instructions,
          inspiration,
        })
        .select()
        .single()

      if (recipeError) {
        console.error(`Error creating recipe "${name}":`, recipeError)
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

      console.log(`✓ Created recipe: ${name}`)
      successCount++
    } catch (error) {
      console.error(`Error processing recipe:`, error)
      errorCount++
    }
  }

  console.log(`\nImport complete: ${successCount} successful, ${errorCount} errors`)
}

/**
 * Convert text to Tiptap JSON format
 */
function convertToTiptapJSON(content: string): string {
  if (!content || !content.trim()) {
    return '{"type":"doc","content":[]}'
  }

  // If it's already JSON, return as is
  if (content.trim().startsWith('{')) {
    try {
      JSON.parse(content)
      return content
    } catch {
      // Invalid JSON, treat as text
    }
  }

  // Convert plain text to Tiptap JSON
  const lines = content.split('\n').filter(line => line.trim())
  const paragraphs = lines.map(line => {
    const trimmed = line.trim()
    if (!trimmed) return null

    // Check if it's a bullet point
    if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
      return {
        type: 'paragraph',
        content: [{
          type: 'text',
          text: trimmed.substring(1).trim()
        }]
      }
    }

    // Regular paragraph
    return {
      type: 'paragraph',
      content: trimmed ? [{ type: 'text', text: trimmed }] : []
    }
  }).filter(Boolean)

  return JSON.stringify({
    type: 'doc',
    content: paragraphs.length > 0 ? paragraphs : [{
      type: 'paragraph',
      content: []
    }]
  })
}

/**
 * Generate slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Main import function - imports everything in order
 */
export async function importAllFromCSV(
  tagGroupsPath: string,
  tagsPath: string,
  recipesPath: string
) {
  console.log('Starting CSV import...\n')

  // Step 1: Import tag groups
  console.log('1. Importing tag groups...')
  const tagGroupMap = await importTagGroupsFromCSV(tagGroupsPath)
  console.log(`   Created ${tagGroupMap.size} tag groups\n`)

  // Step 2: Import tags
  console.log('2. Importing tags...')
  const tagMap = await importTagsFromCSV(tagsPath, tagGroupMap)
  console.log(`   Created ${tagMap.size} tags\n`)

  // Step 3: Import recipes
  console.log('3. Importing recipes...')
  await importRecipesFromCSV(recipesPath, tagMap)
  console.log('\n✓ Import complete!')
}

