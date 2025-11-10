const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('\n🔧 Applying database migration...\n');
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync('./database/alter-experiences-simple.sql', 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.log('\n📋 Please apply this SQL manually in Supabase SQL Editor:');
      console.log(sql);
      process.exit(1);
    }
    
    console.log('✅ Migration applied successfully!');
    console.log('\n🎉 Database is now ready!');
    console.log('\n📝 New columns added:');
    console.log('   • overall_experience');
    console.log('   • technical_rounds');
    console.log('   • hr_rounds');
    console.log('   • tips_and_advice');
    console.log('\n✨ You can now use the simplified form!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Please apply the SQL manually:');
    const sql = fs.readFileSync('./database/alter-experiences-simple.sql', 'utf8');
    console.log(sql);
  }
}

applyMigration();
