#!/usr/bin/env tsx

/**
 * Script to download recipe images from Framer CDN and upload to Supabase Storage
 * 
 * Usage:
 *   npx tsx scripts/migrate-images-to-supabase.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

import { createAdminClient } from '../lib/supabase/admin'

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

function getFileExtension(url: string): string {
  const urlPath = new URL(url).pathname
  const match = urlPath.match(/\.(jpg|jpeg|png|webp|gif)$/i)
  return match ? match[1].toLowerCase() : 'jpg'
}

function getFileName(slug: string, extension: string): string {
  // Sanitize filename: remove special characters, keep only alphanumeric, hyphens, and dots
  const sanitized = slug
    .normalize('NFD') // Normalize to decomposed form
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9-]/gi, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  
  return `${sanitized}.${extension}`
}

async function main() {
  const supabase = createAdminClient()

  console.log('Starting image migration to Supabase Storage...\n')

  // Get all recipes with images
  const { data: recipes, error: fetchError } = await supabase
    .from('recipes')
    .select('id, slug, name, image_url')
    .not('image_url', 'is', null)

  if (fetchError) {
    console.error('Error fetching recipes:', fetchError)
    process.exit(1)
  }

  if (!recipes || recipes.length === 0) {
    console.log('No recipes with images found.')
    return
  }

  console.log(`Found ${recipes.length} recipes with images\n`)

  let successCount = 0
  let errorCount = 0
  let skippedCount = 0

  for (const recipe of recipes) {
    const imageUrl = recipe.image_url

    if (!imageUrl) {
      skippedCount++
      continue
    }

    // Skip if already uploaded to Supabase
    if (imageUrl.includes('supabase.co') || imageUrl.includes('supabase.storage')) {
      console.log(`⏭️  Skipping "${recipe.name}" - already in Supabase Storage`)
      skippedCount++
      continue
    }

    try {
      console.log(`📥 Downloading image for "${recipe.name}"...`)
      console.log(`   URL: ${imageUrl}`)

      // Download image
      const imageBuffer = await downloadImage(imageUrl)
      const extension = getFileExtension(imageUrl)
      const fileName = getFileName(recipe.slug, extension)
      const contentType = `image/${extension === 'jpg' ? 'jpeg' : extension}`

      console.log(`   File: ${fileName} (${(imageBuffer.length / 1024).toFixed(2)} KB)`)

      // Upload to Supabase Storage
      console.log(`   📤 Uploading to Supabase Storage...`)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(fileName, imageBuffer, {
          contentType,
          cacheControl: '3600',
          upsert: true, // Overwrite if exists
        })

      if (uploadError) {
        console.error(`   ❌ Upload error:`, uploadError.message)
        errorCount++
        continue
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(fileName)

      console.log(`   ✅ Uploaded: ${publicUrl}`)

      // Update recipe with new URL
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ image_url: publicUrl })
        .eq('id', recipe.id)

      if (updateError) {
        console.error(`   ❌ Update error:`, updateError.message)
        errorCount++
        continue
      }

      console.log(`   ✅ Updated recipe with new image URL\n`)
      successCount++

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error(`   ❌ Error processing "${recipe.name}":`, error instanceof Error ? error.message : error)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('Migration Summary:')
  console.log(`  ✅ Success: ${successCount}`)
  console.log(`  ⏭️  Skipped: ${skippedCount}`)
  console.log(`  ❌ Errors: ${errorCount}`)
  console.log('='.repeat(50))
}

main().catch(console.error)

