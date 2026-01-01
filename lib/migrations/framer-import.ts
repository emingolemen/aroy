import { createAdminClient } from '@/lib/supabase/admin'
import { Recipe, Tag, TagGroup } from '@/types/database'

interface FramerRecipe {
  id?: string
  name: string
  slug?: string
  image?: string
  imageUrl?: string
  tags?: string[]
  ingredients?: string[]
  ingredientsText?: string
  instructions?: string
  inspiration?: string
  createdAt?: string
  updatedAt?: string
}

interface FramerTag {
  id?: string
  name: string
  tagGroup: string
}

interface FramerTagGroup {
  id?: string
  name: string
  displayOrder?: number
}

/**
 * Migration script to import data from Framer CMS export
 * 
 * Usage:
 * 1. Export your Framer CMS data as JSON
 * 2. Format it according to the FramerRecipe, FramerTag, FramerTagGroup interfaces
 * 3. Run this script with the formatted data
 */
export async function importFramerData(
  recipes: FramerRecipe[],
  tags: FramerTag[],
  tagGroups: FramerTagGroup[]
) {
  const supabase = createAdminClient()

  // Step 1: Create tag groups
  const tagGroupMap = new Map<string, string>() // Framer ID -> Supabase ID
  
  for (const group of tagGroups) {
    const { data, error } = await supabase
      .from('tag_groups')
      .insert({
        name: group.name,
        display_order: group.displayOrder || 0,
      })
      .select()
      .single()

    if (error && !error.message.includes('duplicate')) {
      console.error(`Error creating tag group ${group.name}:`, error)
      throw error
    }

    if (data) {
      tagGroupMap.set(group.id || group.name, data.id)
    } else {
      // Tag group already exists, fetch it
      const { data: existing } = await supabase
        .from('tag_groups')
        .select('id')
        .eq('name', group.name)
        .single()
      
      if (existing) {
        tagGroupMap.set(group.id || group.name, existing.id)
      }
    }
  }

  // Step 2: Create tags
  const tagMap = new Map<string, string>() // Framer ID/Name -> Supabase ID
  
  for (const tag of tags) {
    const tagGroupId = tagGroupMap.get(tag.tagGroup)
    if (!tagGroupId) {
      console.warn(`Tag group ${tag.tagGroup} not found for tag ${tag.name}`)
      continue
    }

    const { data, error } = await supabase
      .from('tags')
      .insert({
        tag_group_id: tagGroupId,
        name: tag.name,
      })
      .select()
      .single()

    if (error && !error.message.includes('duplicate')) {
      console.error(`Error creating tag ${tag.name}:`, error)
      throw error
    }

    if (data) {
      tagMap.set(tag.id || tag.name, data.id)
    } else {
      // Tag already exists, fetch it
      const { data: existing } = await supabase
        .from('tags')
        .select('id')
        .eq('tag_group_id', tagGroupId)
        .eq('name', tag.name)
        .single()
      
      if (existing) {
        tagMap.set(tag.id || tag.name, existing.id)
      }
    }
  }

  // Step 3: Upload images and create recipes
  for (const recipe of recipes) {
    let imageUrl: string | null = null

    // Upload image if provided
    if (recipe.image || recipe.imageUrl) {
      const imageUrlToUse = recipe.image || recipe.imageUrl!
      try {
        // If it's a URL, download and upload to Supabase Storage
        if (imageUrlToUse.startsWith('http')) {
          const response = await fetch(imageUrlToUse)
          const blob = await response.blob()
          const fileName = `${recipe.slug || recipe.name.toLowerCase().replace(/\s+/g, '-')}.${blob.type.split('/')[1] || 'jpg'}`
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('recipe-images')
            .upload(fileName, blob, {
              contentType: blob.type,
              upsert: true,
            })

          if (uploadError) {
            console.error(`Error uploading image for ${recipe.name}:`, uploadError)
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('recipe-images')
              .getPublicUrl(fileName)
            imageUrl = publicUrl
          }
        } else {
          // Assume it's already a Supabase Storage path
          imageUrl = imageUrlToUse
        }
      } catch (error) {
        console.error(`Error processing image for ${recipe.name}:`, error)
      }
    }

    // Generate slug if not provided
    const slug = recipe.slug || recipe.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    // Convert rich text if it's HTML or plain text
    const ingredientsText = recipe.ingredientsText 
      ? (typeof recipe.ingredientsText === 'string' && recipe.ingredientsText.startsWith('{') 
          ? recipe.ingredientsText 
          : convertToTiptapJSON(recipe.ingredientsText))
      : '{"type":"doc","content":[]}'

    const instructions = recipe.instructions
      ? (typeof recipe.instructions === 'string' && recipe.instructions.startsWith('{')
          ? recipe.instructions
          : convertToTiptapJSON(recipe.instructions))
      : '{"type":"doc","content":[]}'

    const inspiration = recipe.inspiration
      ? (typeof recipe.inspiration === 'string' && recipe.inspiration.startsWith('{')
          ? recipe.inspiration
          : convertToTiptapJSON(recipe.inspiration))
      : '{"type":"doc","content":[]}'

    // Create recipe
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        slug,
        name: recipe.name,
        image_url: imageUrl,
        ingredients_text: ingredientsText,
        instructions,
        inspiration,
        created_at: recipe.createdAt || new Date().toISOString(),
        updated_at: recipe.updatedAt || new Date().toISOString(),
      })
      .select()
      .single()

    if (recipeError) {
      console.error(`Error creating recipe ${recipe.name}:`, recipeError)
      continue
    }

    // Step 4: Link tags to recipe
    if (recipe.tags && recipe.tags.length > 0) {
      const recipeTagInserts = recipe.tags
        .map(tagName => {
          const tagId = tagMap.get(tagName)
          return tagId ? { recipe_id: recipeData.id, tag_id: tagId } : null
        })
        .filter(Boolean) as { recipe_id: string; tag_id: string }[]

      if (recipeTagInserts.length > 0) {
        await supabase.from('recipe_tags').insert(recipeTagInserts)
      }
    }

    // Step 5: Link main ingredients to recipe
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      const ingredientInserts = recipe.ingredients
        .map(ingredientName => {
          const tagId = tagMap.get(ingredientName)
          return tagId ? { recipe_id: recipeData.id, tag_id: tagId } : null
        })
        .filter(Boolean) as { recipe_id: string; tag_id: string }[]

      if (ingredientInserts.length > 0) {
        await supabase.from('recipe_ingredients').insert(ingredientInserts)
      }
    }
  }

  console.log('Migration completed successfully!')
}

/**
 * Convert HTML or plain text to Tiptap JSON format
 */
function convertToTiptapJSON(content: string): string {
  // If it's already JSON, return as is
  if (content.trim().startsWith('{')) {
    return content
  }

  // Simple conversion: split by newlines and create paragraphs
  const lines = content.split('\n').filter(line => line.trim())
  const paragraphs = lines.map(line => ({
    type: 'paragraph',
    content: line.trim() ? [{ type: 'text', text: line.trim() }] : []
  }))

  return JSON.stringify({
    type: 'doc',
    content: paragraphs.filter(p => p.content.length > 0)
  })
}

