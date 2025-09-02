import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:8000'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupMediaLibrary() {
  console.log('Setting up Media Library...')
  
  // Read the SQL file
  const fs = require('fs').promises
  const path = require('path')
  
  try {
    const sqlPath = path.join(__dirname, '../../..', 'database', 'media_library_schema_fixed.sql')
    const sql = await fs.readFile(sqlPath, 'utf8')
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`Executing statement ${i + 1}/${statements.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        })
        
        if (error) {
          console.error(`Error in statement ${i + 1}:`, error)
          // Continue with next statement
        } else {
          console.log(`Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.error(`Failed to execute statement ${i + 1}:`, err.message)
      }
    }
    
    console.log('Media Library setup completed!')
    
  } catch (error) {
    console.error('Error setting up media library:', error)
    process.exit(1)
  }
}

// Run the setup
setupMediaLibrary()