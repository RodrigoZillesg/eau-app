"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const supabaseUrl = process.env.SUPABASE_URL || 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
// Como não temos acesso direto ao SQL via RPC, vamos criar as tabelas
// usando uma abordagem diferente - vamos inserir dados estruturados
// que forçarão a criação das tabelas (se o Supabase permitir)
// ou vamos usar a API de forma criativa
async function testConnection() {
    console.log('🔗 Testing Supabase connection...');
    const { data, error } = await supabase.from('members').select('id').limit(1);
    if (error) {
        console.error('❌ Connection failed:', error.message);
        return false;
    }
    console.log('✅ Connection successful!');
    return true;
}
async function checkTableExists(tableName) {
    const { data, error } = await supabase.from(tableName).select('id').limit(1);
    if (error && error.message.includes('does not exist')) {
        return false;
    }
    return true;
}
async function createInstitutionsData() {
    console.log('\n📝 Attempting to create institutions table via data insertion...');
    // Test if table exists
    const exists = await checkTableExists('institutions');
    if (exists) {
        console.log('✅ Institutions table already exists!');
        return true;
    }
    console.log('❌ Institutions table does not exist.');
    console.log('⚠️  Manual creation required via Supabase Studio SQL Editor.');
    return false;
}
async function insertTestData() {
    console.log('\n📝 Inserting test data into institutions...');
    const testInstitutions = [
        {
            name: 'English Australia Test University',
            company_email: 'test@eau.edu.au',
            company_type: 'University',
            state: 'NSW',
            country: 'Australia',
            status: 'active'
        },
        {
            name: 'Sydney Language School',
            company_email: 'admin@sydneylang.edu.au',
            company_type: 'Language School',
            state: 'NSW',
            country: 'Australia',
            status: 'active'
        },
        {
            name: 'Melbourne Education Centre',
            company_email: 'info@melbedu.edu.au',
            company_type: 'Education Centre',
            state: 'VIC',
            country: 'Australia',
            status: 'active'
        }
    ];
    const { data, error } = await supabase
        .from('institutions')
        .upsert(testInstitutions, { onConflict: 'company_email' })
        .select();
    if (error) {
        console.error('❌ Insert failed:', error.message);
        return false;
    }
    console.log('✅ Test data inserted successfully!');
    console.log('📊 Inserted records:', data?.length);
    return true;
}
async function main() {
    console.log('=== INSTITUTIONS TABLE SETUP ===\n');
    // Test connection
    const connected = await testConnection();
    if (!connected) {
        process.exit(1);
    }
    // Check if institutions table exists
    const tableExists = await checkTableExists('institutions');
    if (tableExists) {
        console.log('✅ Institutions table exists!');
        // Try to insert test data
        await insertTestData();
        console.log('\n🎉 SUCCESS! Table is ready!');
        console.log('🔗 Access at: http://localhost:5180/admin/institutions');
    }
    else {
        console.log('\n❌ INSTITUTIONS TABLE DOES NOT EXIST');
        console.log('\n📋 MANUAL STEPS REQUIRED:');
        console.log('1. Access: https://english-australia-eau-supabase.lkobs5.easypanel.host/');
        console.log('2. Login: supabase / this_password_is_insecure_and_should_be_updated');
        console.log('3. Go to SQL Editor');
        console.log('4. Copy and paste the SQL from: sql-for-supabase-studio.sql');
        console.log('5. Click RUN');
        console.log('6. Then run this script again to insert test data');
    }
}
main().catch(console.error);
//# sourceMappingURL=create-institutions-tables.js.map