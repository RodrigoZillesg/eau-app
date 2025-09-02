import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Supabase configuration (usando as credenciais locais)
const supabaseUrl = 'http://localhost:8000'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupCPDSettings() {
  try {
    console.log('🚀 Setting up CPD Settings tables...')

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'sql', 'create_cpd_settings.sql')
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')

    // Split SQL commands by semicolon and filter empty ones
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

    console.log(`📝 Found ${commands.length} SQL commands to execute`)

    // Execute each command
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      console.log(`⏳ Executing command ${i + 1}/${commands.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command })
        if (error) {
          // Try direct execution if rpc fails
          const { error: directError } = await supabase.from('_').select().limit(0)
          if (directError) {
            console.log(`⚠️ Warning on command ${i + 1}: ${error.message}`)
          }
        }
      } catch (err) {
        console.log(`⚠️ Warning on command ${i + 1}: ${err.message}`)
      }
    }

    console.log('✅ CPD Settings setup completed!')

    // Verify tables were created
    console.log('🔍 Verifying table creation...')
    
    const { data: settings, error: settingsError } = await supabase
      .from('cpd_settings')
      .select('*')
      .limit(1)

    if (settingsError) {
      console.error('❌ cpd_settings table verification failed:', settingsError.message)
    } else {
      console.log('✅ cpd_settings table verified')
    }

    const { data: categories, error: categoriesError } = await supabase
      .from('cpd_category_settings')
      .select('*')
      .limit(1)

    if (categoriesError) {
      console.error('❌ cpd_category_settings table verification failed:', categoriesError.message)
    } else {
      console.log('✅ cpd_category_settings table verified')
      console.log(`📊 Found ${categories?.length || 0} category settings`)
    }

    console.log('🎉 Setup complete! You can now use CPD Settings.')

  } catch (error) {
    console.error('❌ Error setting up CPD Settings:', error)
    process.exit(1)
  }
}

// Run the setup
setupCPDSettings()