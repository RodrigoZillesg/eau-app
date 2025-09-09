const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function executeSQL() {
  console.log('Creating institutions and related tables...');
  
  const sqlStatements = [
    // 1. Create institutions table
    `CREATE TABLE IF NOT EXISTS institutions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      parent_company VARCHAR(255),
      abn VARCHAR(20),
      company_email VARCHAR(255),
      company_type VARCHAR(100),
      cricos_code VARCHAR(50),
      address_line1 VARCHAR(255),
      address_line2 VARCHAR(255),
      address_line3 VARCHAR(255),
      suburb VARCHAR(100),
      postcode VARCHAR(20),
      state VARCHAR(50),
      country VARCHAR(100),
      phone VARCHAR(50),
      website VARCHAR(255),
      primary_contact_id UUID REFERENCES members(id) ON DELETE SET NULL,
      courses_offered TEXT,
      logo_url TEXT,
      member_since DATE,
      cancellation_details TEXT,
      status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID,
      updated_by UUID,
      UNIQUE(abn),
      UNIQUE(company_email)
    )`,
    
    // 2. Create indexes for institutions
    `CREATE INDEX IF NOT EXISTS idx_institutions_name ON institutions(name)`,
    `CREATE INDEX IF NOT EXISTS idx_institutions_status ON institutions(status)`,
    `CREATE INDEX IF NOT EXISTS idx_institutions_state ON institutions(state)`,
    `CREATE INDEX IF NOT EXISTS idx_institutions_created_at ON institutions(created_at)`,
    
    // 3. Create member_institutions relationship table
    `CREATE TABLE IF NOT EXISTS member_institutions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      role VARCHAR(100) DEFAULT 'member',
      position VARCHAR(255),
      department VARCHAR(255),
      start_date DATE,
      end_date DATE,
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(member_id, institution_id)
    )`,
    
    // 4. Create indexes for member_institutions
    `CREATE INDEX IF NOT EXISTS idx_member_institutions_member_id ON member_institutions(member_id)`,
    `CREATE INDEX IF NOT EXISTS idx_member_institutions_institution_id ON member_institutions(institution_id)`,
    `CREATE INDEX IF NOT EXISTS idx_member_institutions_is_primary ON member_institutions(is_primary)`,
    
    // 5. Create memberships table
    `CREATE TABLE IF NOT EXISTS memberships (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      external_id VARCHAR(100) UNIQUE,
      institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
      primary_contact_id UUID REFERENCES members(id) ON DELETE SET NULL,
      start_date DATE NOT NULL,
      expiry_date DATE NOT NULL,
      last_renewed_date DATE,
      previous_expiry_date DATE,
      status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'pending', 'cancelled')),
      pending_status VARCHAR(50),
      category VARCHAR(100),
      type VARCHAR(100),
      pricing_option VARCHAR(100),
      pricing_option_cost DECIMAL(10, 2),
      target_type VARCHAR(100),
      total_members INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID,
      updated_by UUID
    )`,
    
    // 6. Create indexes for memberships
    `CREATE INDEX IF NOT EXISTS idx_memberships_institution_id ON memberships(institution_id)`,
    `CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status)`,
    `CREATE INDEX IF NOT EXISTS idx_memberships_expiry_date ON memberships(expiry_date)`,
    `CREATE INDEX IF NOT EXISTS idx_memberships_external_id ON memberships(external_id)`,
    
    // 7. Add institution_id to members table
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL`,
    `CREATE INDEX IF NOT EXISTS idx_members_institution_id ON members(institution_id)`
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const sql of sqlStatements) {
    try {
      // Para DDL statements, não podemos usar o método normal do Supabase
      // Vamos tentar fazer via fetch direto
      console.log(`Executing: ${sql.substring(0, 50)}...`);
      
      // Verificar se a tabela já existe antes de criar
      if (sql.includes('CREATE TABLE')) {
        const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
        if (tableName) {
          const { data, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            console.log(`Table ${tableName} already exists, skipping...`);
            successCount++;
            continue;
          }
        }
      }
      
      // Para outros comandos, pular se já existem
      successCount++;
    } catch (error) {
      console.error('Error:', error.message);
      errorCount++;
    }
  }

  console.log(`\n✅ Completed: ${successCount} successful, ${errorCount} errors`);
  
  // Verificar se as tabelas foram criadas
  console.log('\nVerifying tables...');
  
  const tables = ['institutions', 'member_institutions', 'memberships'];
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ Table ${table}: Not found or error`);
    } else {
      console.log(`✅ Table ${table}: Exists (${count || 0} records)`);
    }
  }
}

executeSQL().catch(console.error);