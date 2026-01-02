#!/usr/bin/env tsx

/**
 * Create Structured Ingredient Rows Script
 * 
 * This script migrates ingredient tags from the recipe_ingredients table
 * into the ingredients_structured JSONB field for each recipe.
 * 
 * Usage:
 *   npx tsx scripts/create-structured-ingredients.ts
 * 
 * The script will:
 * - Find all recipes that have ingredient tags but missing/empty ingredients_structured
 * - Create structured ingredient rows from those tags
 * - Update recipes with the new structured data
 * - Preserve existing structured ingredients (won't overwrite)
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

import { createAdminClient } from '../lib/supabase/admin'

interface IngredientRow {
  quantity: string
  tagId: string | null
  notes: string
}

interface RecipeWithIngredients {
  id: string
  name: string
  slug: string
  ingredients_structured: IngredientRow[] | null
  recipe_ingredients: Array<{
    tag: {
      id: string
      name: string
    }
  }>
}

async function main() {
  console.log('🚀 Starting structured ingredients migration...\n')

  const supabase = createAdminClient()

  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: Missing required environment variables')
    console.error('   Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
    process.exit(1)
  }

  try {
    // Fetch all recipes with their ingredient tags
    console.log('📥 Fetching recipes with ingredient tags...')
    const { data: recipes, error: fetchError } = await supabase
      .from('recipes')
      .select(`
        id,
        name,
        slug,
        ingredients_structured,
        recipe_ingredients (
          tag:tags (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: true })

    if (fetchError) {
      throw new Error(`Failed to fetch recipes: ${fetchError.message}`)
    }

    if (!recipes || recipes.length === 0) {
      console.log('ℹ️  No recipes found in database')
      return
    }

    console.log(`✅ Found ${recipes.length} recipes\n`)

    let updatedCount = 0
    let skippedCount = 0
    const errors: Array<{ recipe: string; error: string }> = []

    // Process each recipe
    for (const recipe of recipes as RecipeWithIngredients[]) {
      const ingredientTags = recipe.recipe_ingredients || []
      
      // Check if ingredients_structured is missing or empty
      const currentStructured = recipe.ingredients_structured
      const isEmpty = !currentStructured || 
                      (Array.isArray(currentStructured) && currentStructured.length === 0) ||
                      JSON.stringify(currentStructured) === '[]' ||
                      currentStructured === null

      // Skip if no ingredient tags or if structured ingredients already exist
      if (ingredientTags.length === 0) {
        skippedCount++
        continue
      }

      if (!isEmpty) {
        console.log(`⏭️  Skipping "${recipe.name}" - already has structured ingredients`)
        skippedCount++
        continue
      }

      // Create structured ingredient rows from ingredient tags
      const structuredIngredients: IngredientRow[] = ingredientTags.map((ri) => ({
        quantity: '',
        tagId: ri.tag.id,
        notes: '',
      }))

      // Update the recipe
      const { error: updateError } = await supabase
        .from('recipes')
        .update({
          ingredients_structured: structuredIngredients,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recipe.id)

      if (updateError) {
        const errorMsg = `Failed to update recipe "${recipe.name}": ${updateError.message}`
        console.error(`❌ ${errorMsg}`)
        errors.push({ recipe: recipe.name, error: updateError.message })
        continue
      }

      updatedCount++
      console.log(`✅ Updated "${recipe.name}" - created ${structuredIngredients.length} structured ingredient rows`)
      
      // Show sample of created ingredients
      if (updatedCount <= 3) {
        const tagNames = ingredientTags.map(ri => ri.tag.name).join(', ')
        console.log(`   └─ Tags: ${tagNames}`)
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Migration Summary')
    console.log('='.repeat(60))
    console.log(`Total recipes processed: ${recipes.length}`)
    console.log(`✅ Recipes updated: ${updatedCount}`)
    console.log(`⏭️  Recipes skipped: ${skippedCount}`)
    
    if (errors.length > 0) {
      console.log(`❌ Errors encountered: ${errors.length}`)
      console.log('\nErrors:')
      errors.forEach(({ recipe, error }) => {
        console.log(`  - ${recipe}: ${error}`)
      })
    } else {
      console.log('✨ All recipes processed successfully!')
    }
    
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\n❌ Fatal error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main().catch(console.error)

