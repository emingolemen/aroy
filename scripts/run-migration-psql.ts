import { readFileSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'
import { resolve } from 'path'
import { execSync } from 'child_process'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local')
    process.exit(1)
  }

  // Extract project reference from URL
  // URL format: https://[project-ref].supabase.co
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)
  if (!match) {
    console.error('❌ Could not extract project reference from Supabase URL')
    process.exit(1)
  }

  const projectRef = match[1]
  
  console.log('📋 Migration Information:')
  console.log('   Project:', projectRef)
  console.log('   Supabase URL:', supabaseUrl)
  console.log('')
  console.log('⚠️  To run this migration, you need your database password.')
  console.log('   Get it from: Supabase Dashboard → Settings → Database → Connection string')
  console.log('')
  console.log('The connection string format is:')
  console.log(`   postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`)
  console.log('')
  console.log('Or use the "URI" format from the Database settings page.')
  console.log('')
  console.log('Once you have the connection string, run:')
  console.log('')
  console.log(`   psql "YOUR_CONNECTION_STRING" -f supabase/migrations/003_fix_rls_policies.sql`)
  console.log('')
  console.log('Alternatively, you can run it in the Supabase Dashboard SQL Editor.')
  console.log('')
  
  // Display the SQL for easy copy-paste
  const migrationPath = join(process.cwd(), 'supabase/migrations/003_fix_rls_policies.sql')
  const migrationSQL = readFileSync(migrationPath, 'utf-8')
  
  console.log('==========================================')
  console.log('MIGRATION SQL (for Supabase Dashboard):')
  console.log('==========================================')
  console.log('')
  console.log(migrationSQL)
  console.log('')
  console.log('==========================================')
}

runMigration()

