import { NextRequest, NextResponse } from 'next/server'
import { importFramerData } from '@/lib/migrations/framer-import'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin (you should add proper auth check)
    const supabase = createAdminClient()
    
    const body = await request.json()
    const { recipes, tags, tagGroups } = body

    if (!recipes || !tags || !tagGroups) {
      return NextResponse.json(
        { error: 'Missing required data: recipes, tags, tagGroups' },
        { status: 400 }
      )
    }

    await importFramerData(recipes, tags, tagGroups)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Migration failed' },
      { status: 500 }
    )
  }
}

