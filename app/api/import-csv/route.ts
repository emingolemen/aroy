import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parse } from 'csv-parse/sync'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const tagGroupsFile = formData.get('tagGroups') as File | null
    const tagsFile = formData.get('tags') as File | null
    const recipesFile = formData.get('recipes') as File | null

    if (!tagGroupsFile || !tagsFile || !recipesFile) {
      return NextResponse.json(
        { error: 'Missing CSV files. Please upload tagGroups, tags, and recipes files.' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Parse tag groups
    const tagGroupsContent = await tagGroupsFile.text()
    const tagGroupsRecords = parse(tagGroupsContent, {
      columns: true,
      skip_empty_lines: true,
    })

    const tagGroupMap = new Map<string, string>()
    for (const record of tagGroupsRecords as Record<string, string>[]) {
      const name = record.name?.trim()
      const displayOrder = parseInt(record.display_order || '0', 10)

      if (!name) continue

      const { data: existing } = await supabase
        .from('tag_groups')
        .select('id')
        .eq('name', name)
        .single()

      if (existing) {
        tagGroupMap.set(name, existing.id)
        continue
      }

      const { data, error } = await supabase
        .from('tag_groups')
        .insert({ name, display_order: displayOrder })
        .select()
        .single()

      if (!error && data) {
        tagGroupMap.set(name, data.id)
      }
    }

    // Parse tags
    const tagsContent = await tagsFile.text()
    const tagsRecords = parse(tagsContent, {
      columns: true,
      skip_empty_lines: true,
    })

    const tagMap = new Map<string, string>()
    for (const record of tagsRecords as Record<string, string>[]) {
      const name = record.name?.trim()
      const tagGroupName = record.tag_group?.trim()

      if (!name || !tagGroupName) continue

      const tagGroupId = tagGroupMap.get(tagGroupName)
      if (!tagGroupId) continue

      const { data: existing } = await supabase
        .from('tags')
        .select('id')
        .eq('tag_group_id', tagGroupId)
        .eq('name', name)
        .single()

      if (existing) {
        tagMap.set(name, existing.id)
        continue
      }

      const { data, error } = await supabase
        .from('tags')
        .insert({ tag_group_id: tagGroupId, name })
        .select()
        .single()

      if (!error && data) {
        tagMap.set(name, data.id)
      }
    }

    // Parse recipes
    const recipesContent = await recipesFile.text()
    const recipesRecords = parse(recipesContent, {
      columns: true,
      skip_empty_lines: true,
    })

    let successCount = 0
    for (const record of recipesRecords as Record<string, string>[]) {
      const name = record.name?.trim()
      if (!name) continue

      const slug = record.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const tagNames = record.tags?.split(',').map((t: string) => t.trim()).filter(Boolean) || []
      const tagIds = tagNames.map((n: string) => tagMap.get(n)).filter(Boolean) as string[]

      const ingredientNames = record.ingredients?.split(',').map((i: string) => i.trim()).filter(Boolean) || []
      const ingredientTagIds = ingredientNames.map((n: string) => tagMap.get(n)).filter(Boolean) as string[]

      const ingredientsText = convertToTiptapJSON(record.ingredients_text || '')
      const instructions = convertToTiptapJSON(record.instructions || '')
      const inspiration = convertToTiptapJSON(record.inspiration || '')

      // Convert ingredient tag IDs to structured ingredients format
      const ingredientsStructured = ingredientTagIds.map(tagId => ({
        quantity: '',
        tagId: tagId,
        notes: '',
      }))

      const { data: recipe, error } = await supabase
        .from('recipes')
        .insert({
          slug,
          name,
          image_url: record.image_url?.trim() || null,
          ingredients_text: ingredientsText,
          ingredients_structured: ingredientsStructured,
          instructions,
          inspiration,
        })
        .select()
        .single()

      if (error) continue

      if (tagIds.length > 0) {
        await supabase.from('recipe_tags').insert(
          tagIds.map(tagId => ({ recipe_id: recipe.id, tag_id: tagId }))
        )
      }

      successCount++
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${successCount} recipes`,
      tagGroups: tagGroupMap.size,
      tags: tagMap.size,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    )
  }
}

function convertToTiptapJSON(content: string): string {
  if (!content?.trim()) return '{"type":"doc","content":[]}'
  if (content.trim().startsWith('{')) {
    try {
      JSON.parse(content)
      return content
    } catch {}
  }
  const lines = content.split('\n').filter(l => l.trim())
  const paragraphs = lines.map(line => ({
    type: 'paragraph',
    content: [{ type: 'text', text: line.trim().replace(/^[-•]\s*/, '') }]
  }))
  return JSON.stringify({ type: 'doc', content: paragraphs })
}

