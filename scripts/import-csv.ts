#!/usr/bin/env tsx

/**
 * CSV Import Script
 * 
 * Usage:
 *   npx tsx scripts/import-csv.ts <tag-groups.csv> <tags.csv> <recipes.csv>
 * 
 * Or import individually:
 *   npx tsx scripts/import-csv.ts --tag-groups tag-groups.csv
 *   npx tsx scripts/import-csv.ts --tags tags.csv
 *   npx tsx scripts/import-csv.ts --recipes recipes.csv
 */

import { importAllFromCSV, importTagGroupsFromCSV, importTagsFromCSV, importRecipesFromCSV } from '../lib/migrations/csv-import'
import * as fs from 'fs'

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(`
CSV Import Script for Recipe CMS

Usage:
  Import all:
    npx tsx scripts/import-csv.ts <tag-groups.csv> <tags.csv> <recipes.csv>

  Import individually:
    npx tsx scripts/import-csv.ts --tag-groups tag-groups.csv
    npx tsx scripts/import-csv.ts --tags tags.csv --tag-groups tag-groups.csv
    npx tsx scripts/import-csv.ts --recipes recipes.csv --tags tags.csv --tag-groups tag-groups.csv

CSV Format Examples:

tag-groups.csv:
  name,display_order
  Cuisine,0
  Type,1
  Ingredients,2

tags.csv:
  name,tag_group
  Chinese,Cuisine
  Turkish,Cuisine
  Stir-fry,Type
  Chicken,Ingredients

recipes.csv:
  name,slug,image_url,tags,ingredients,ingredients_text,instructions,inspiration
  "Pad Thai","pad-thai","https://...","Thai,Stir-fry","Chicken,Rice","- Rice noodles\\n- Chicken","1. Cook noodles\\n2. Add chicken","https://..."
    `)
    process.exit(1)
  }

  // Check for individual flags
  if (args[0].startsWith('--')) {
    const tagGroupsPath = args.find(arg => arg.startsWith('--tag-groups='))?.split('=')[1] || 
                         (args.includes('--tag-groups') && args[args.indexOf('--tag-groups') + 1])
    const tagsPath = args.find(arg => arg.startsWith('--tags='))?.split('=')[1] || 
                    (args.includes('--tags') && args[args.indexOf('--tags') + 1])
    const recipesPath = args.find(arg => arg.startsWith('--recipes='))?.split('=')[1] || 
                       (args.includes('--recipes') && args[args.indexOf('--recipes') + 1])

    if (tagGroupsPath) {
      if (!fs.existsSync(tagGroupsPath)) {
        console.error(`File not found: ${tagGroupsPath}`)
        process.exit(1)
      }
      await importTagGroupsFromCSV(tagGroupsPath)
    }

    if (tagsPath && tagGroupsPath) {
      if (!fs.existsSync(tagsPath)) {
        console.error(`File not found: ${tagsPath}`)
        process.exit(1)
      }
      // Need to get tag group map first
      const tagGroupMap = await importTagGroupsFromCSV(tagGroupsPath)
      await importTagsFromCSV(tagsPath, tagGroupMap)
    }

    if (recipesPath && tagsPath && tagGroupsPath) {
      if (!fs.existsSync(recipesPath)) {
        console.error(`File not found: ${recipesPath}`)
        process.exit(1)
      }
      const tagGroupMap = await importTagGroupsFromCSV(tagGroupsPath)
      const tagMap = await importTagsFromCSV(tagsPath, tagGroupMap)
      await importRecipesFromCSV(recipesPath, tagMap)
    }
  } else {
    // Import all files in order
    const [tagGroupsPath, tagsPath, recipesPath] = args

    if (!tagGroupsPath || !tagsPath || !recipesPath) {
      console.error('Error: Please provide all three CSV files')
      console.error('Usage: npx tsx scripts/import-csv.ts <tag-groups.csv> <tags.csv> <recipes.csv>')
      process.exit(1)
    }

    // Check files exist
    for (const file of [tagGroupsPath, tagsPath, recipesPath]) {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`)
        process.exit(1)
      }
    }

    await importAllFromCSV(tagGroupsPath, tagsPath, recipesPath)
  }
}

main().catch(console.error)

