import { readFileSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

async function executeMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗')
    console.error('')
    console.error('Please make sure .env.local is configured with these values.')
    process.exit(1)
  }

  // Read the migration file
  const migrationPath = join(process.cwd(), 'supabase/migrations/003_fix_rls_policies.sql')
  const migrationSQL = readFileSync(migrationPath, 'utf-8')

  console.log('🚀 Executing RLS policy fix migration...')
  console.log('')

  try {
    // Use Supabase REST API to execute SQL
    // The SQL endpoint is at /rest/v1/rpc/exec_sql or we can use the management API
    // Actually, Supabase doesn't expose a direct SQL execution endpoint via REST
    // We need to use the PostgREST API or the Management API
    
    // Let's try using the PostgREST query endpoint with the service role
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: migrationSQL }),
    })

    if (!response.ok) {
      // Try alternative: use the Supabase Management API
      // But that requires a different endpoint
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }

    const result = await response.json()
    console.log('✅ Migration executed successfully!')
    console.log('Result:', result)
  } catch (error: any) {
    console.error('❌ Error executing migration:', error.message)
    console.error('')
    console.error('The Supabase JS/REST API doesn\'t support direct SQL execution.')
    console.error('Please run this migration manually:')
    console.error('')
    console.error('1. Go to Supabase Dashboard → SQL Editor')
    console.error('2. Copy and paste the SQL from: supabase/migrations/003_fix_rls_policies.sql')
    console.error('3. Click "Run"')
    console.error('')
    console.error('Or use psql with your database connection string.')
    process.exit(1)
  }
}

executeMigration()

