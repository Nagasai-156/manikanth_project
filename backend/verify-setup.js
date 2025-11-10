// Simple setup verification script
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function verifySetup() {
  console.log('🔍 Verifying Supabase Setup...\n');

  // Check environment variables
  console.log('1. Checking environment variables...');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.log('❌ SUPABASE_URL is missing in .env file');
    return;
  }
  console.log('✅ SUPABASE_URL:', supabaseUrl);

  if (!supabaseAnonKey) {
    console.log('❌ SUPABASE_ANON_KEY is missing in .env file');
    return;
  }
  console.log('✅ SUPABASE_ANON_KEY: Found (length:', supabaseAnonKey.length, 'characters)');

  if (!supabaseServiceKey) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY is missing in .env file');
    return;
  }
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY: Found (length:', supabaseServiceKey.length, 'characters)\n');

  // Test database connection
  console.log('2. Testing database connection...');
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test basic connection
    const { data, error } = await supabase
      .from('companies')
      .select('count')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ Tables not found. You need to run the database schema.');
        console.log('   Go to Supabase SQL Editor and run the schema.sql file');
        return;
      }
      console.log('❌ Database connection error:', error.message);
      return;
    }

    console.log('✅ Database connection successful');

    // Check if tables exist and have data
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('name')
      .limit(5);

    if (compError) {
      console.log('❌ Error fetching companies:', compError.message);
      return;
    }

    console.log('✅ Sample companies found:', companies?.length || 0);
    if (companies && companies.length > 0) {
      console.log('   Companies:', companies.map(c => c.name).join(', '));
    }

    // Check admin user
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('email, role')
      .eq('role', 'admin')
      .limit(1);

    if (adminError) {
      console.log('❌ Error checking admin user:', adminError.message);
    } else if (admin && admin.length > 0) {
      console.log('✅ Admin user found:', admin[0].email);
    } else {
      console.log('⚠️  No admin user found. Run setup script to create one.');
    }

    console.log('\n🎉 Setup verification completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Start your backend server: npm run dev');
    console.log('2. Test the API: node test-api.js');
    console.log('3. Connect your frontend to: http://localhost:5000/api');

  } catch (error) {
    console.log('❌ Setup verification failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your Supabase keys in .env file');
    console.log('2. Make sure you ran the database schema in Supabase SQL Editor');
    console.log('3. Verify your Supabase project is active');
  }
}

// Run verification
verifySetup();