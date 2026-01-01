import { config } from 'dotenv'
import { resolve } from 'path'
import { createAdminClient } from '@/lib/supabase/admin'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

async function checkTagGroups() {
  const supabase = createAdminClient()
  
  console.log('Checking tag groups in database...')
  console.log('')
  
  const { data: tagGroups, error } = await supabase
    .from('tag_groups')
    .select(`
      *,
      tags (*)
    `)
    .order('display_order')
    .order('name', { foreignTable: 'tags' })

  if (error) {
    console.error('❌ Error fetching tag groups:', error)
    process.exit(1)
  }

  if (!tagGroups || tagGroups.length === 0) {
    console.log('⚠️  No tag groups found in database.')
    return
  }

  console.log(`Found ${tagGroups.length} tag group(s):`)
  console.log('')
  
  tagGroups.forEach((group: any) => {
    const tagCount = group.tags?.length || 0
    const isIngredient = 
      group.name.toLowerCase().includes('ingredient') ||
      group.name.toLowerCase().includes('protein') ||
      group.name.toLowerCase().includes('veggie') ||
      group.name.toLowerCase().includes('carb') ||
      group.name.toLowerCase().includes('dairy')
    const isCuisineOrType = 
      group.name.toLowerCase() === 'cuisine' ||
      group.name.toLowerCase() === 'type'
    
    const status = isCuisineOrType 
      ? '✅ KEEP (cuisine/type)'
      : isIngredient 
        ? '✅ KEEP (ingredient-related)'
        : '❌ SHOULD BE DELETED'
    
    console.log(`  ${status}`)
    console.log(`  Name: ${group.name}`)
    console.log(`  Tags: ${tagCount}`)
    console.log(`  Display Order: ${group.display_order}`)
    console.log('')
  })

  const unwantedGroups = tagGroups.filter((group: any) => {
    const name = group.name.toLowerCase()
    return name !== 'cuisine' && 
           name !== 'type' &&
           !name.includes('ingredient') &&
           !name.includes('protein') &&
           !name.includes('veggie') &&
           !name.includes('carb') &&
           !name.includes('dairy')
  })

  if (unwantedGroups.length > 0) {
    console.log(`⚠️  Found ${unwantedGroups.length} unwanted tag group(s) that should be deleted:`)
    unwantedGroups.forEach((group: any) => {
      console.log(`  - ${group.name}`)
    })
    console.log('')
    console.log('Run the migration: supabase/migrations/004_remove_unwanted_tag_groups.sql')
  } else {
    console.log('✅ All tag groups are valid (cuisine, type, or ingredient-related)')
  }
}

checkTagGroups().catch(console.error)

