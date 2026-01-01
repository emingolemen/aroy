import { createAdminClient } from '@/lib/supabase/admin'
import { readFileSync } from 'fs'
import { join } from 'path'

async function runMigration() {
  const supabase = createAdminClient()
  
  // Read the migration file
  const migrationPath = join(process.cwd(), 'supabase/migrations/003_fix_rls_policies.sql')
  const migrationSQL = readFileSync(migrationPath, 'utf-8')
  
  console.log('Running RLS policy fix migration...')
  console.log('Migration file:', migrationPath)
  console.log('')
  
  // Split by semicolons and execute each statement
  // Note: Supabase doesn't have a direct SQL execution method via JS client
  // So we'll need to use the REST API or provide instructions
  
  // Actually, the JS client doesn't support raw SQL execution
  // We need to use the REST API or psql
  console.log('⚠️  The Supabase JS client cannot execute raw SQL migrations.')
  console.log('')
  console.log('Please run this migration using one of these methods:')
  console.log('')
  console.log('Method 1: Supabase Dashboard')
  console.log('1. Go to https://supabase.com/dashboard')
  console.log('2. Select your project')
  console.log('3. Go to SQL Editor')
  console.log('4. Copy and paste the contents of: supabase/migrations/003_fix_rls_policies.sql')
  console.log('5. Click "Run"')
  console.log('')
  console.log('Method 2: Using Supabase CLI (if linked)')
  console.log('Run: supabase db push')
  console.log('')
  console.log('Method 3: Using psql')
  console.log('Get your database connection string from Supabase Dashboard > Settings > Database')
  console.log('Then run: psql "your-connection-string" -f supabase/migrations/003_fix_rls_policies.sql')
  console.log('')
  
  // Display the SQL for easy copy-paste
  console.log('==========================================')
  console.log('MIGRATION SQL (copy this):')
  console.log('==========================================')
  console.log('')
  console.log(migrationSQL)
  console.log('')
  console.log('==========================================')
}

runMigration().catch(console.error)

