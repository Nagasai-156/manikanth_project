const { supabaseAdmin } = require('../config/database');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  console.log('🚀 Setting up Interview Experience Platform Database...\n');

  try {
    // Test connection
    console.log('1. Testing database connection...');
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    console.log('✅ Database connection successful\n');

    // Create default admin user if not exists
    console.log('2. Setting up default admin user...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@college.edu';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if admin already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .single();

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      
      const { error: adminError } = await supabaseAdmin
        .from('users')
        .insert({
          email: adminEmail,
          password_hash: passwordHash,
          name: 'System Administrator',
          college: 'System',
          degree: 'Administration',
          course: 'System Administration',
          year: 'Admin',
          role: 'admin',
          is_verified: true,
          is_active: true
        });

      if (adminError) {
        console.error('❌ Failed to create admin user:', adminError.message);
      } else {
        console.log(`✅ Admin user created successfully`);
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        console.log('   ⚠️  Please change the default password after first login!\n');
      }
    } else {
      console.log('✅ Admin user already exists\n');
    }

    // Check if companies exist
    console.log('3. Checking default companies...');
    const { count: companyCount } = await supabaseAdmin
      .from('companies')
      .select('id', { count: 'exact' });

    if (companyCount === 0) {
      console.log('   Adding default companies...');
      const defaultCompanies = [
        { name: 'Tata Consultancy Services', slug: 'tcs', category: 'Service', tier: 'Tier 1', description: 'Leading IT services and consulting company' },
        { name: 'Infosys', slug: 'infosys', category: 'Service', tier: 'Tier 1', description: 'Global leader in next-generation digital services' },
        { name: 'Amazon', slug: 'amazon', category: 'Product', tier: 'FAANG', description: 'Multinational technology company' },
        { name: 'Microsoft', slug: 'microsoft', category: 'Product', tier: 'FAANG', description: 'Technology corporation' },
        { name: 'Google', slug: 'google', category: 'Product', tier: 'FAANG', description: 'Multinational technology company' },
        { name: 'Wipro', slug: 'wipro', category: 'Service', tier: 'Tier 1', description: 'Information technology services corporation' },
        { name: 'Capgemini', slug: 'capgemini', category: 'Service', tier: 'Tier 1', description: 'French multinational IT consulting corporation' },
        { name: 'Accenture', slug: 'accenture', category: 'Consulting', tier: 'Tier 1', description: 'Multinational professional services company' },
        { name: 'IBM', slug: 'ibm', category: 'Service', tier: 'Tier 1', description: 'International technology corporation' },
        { name: 'Cognizant', slug: 'cognizant', category: 'Service', tier: 'Tier 1', description: 'American multinational IT services company' },
        { name: 'HCL Technologies', slug: 'hcl', category: 'Service', tier: 'Tier 2', description: 'Indian multinational IT services company' },
        { name: 'Tech Mahindra', slug: 'tech-mahindra', category: 'Service', tier: 'Tier 2', description: 'Indian multinational IT services company' },
        { name: 'Flipkart', slug: 'flipkart', category: 'Product', tier: 'Unicorn', description: 'Indian e-commerce company' },
        { name: 'Paytm', slug: 'paytm', category: 'Fintech', tier: 'Unicorn', description: 'Indian digital payments company' },
        { name: 'Zomato', slug: 'zomato', category: 'Product', tier: 'Unicorn', description: 'Indian restaurant aggregator and food delivery company' }
      ];

      const { error: companiesError } = await supabaseAdmin
        .from('companies')
        .insert(defaultCompanies);

      if (companiesError) {
        console.error('❌ Failed to create default companies:', companiesError.message);
      } else {
        console.log(`✅ ${defaultCompanies.length} default companies created\n`);
      }
    } else {
      console.log(`✅ ${companyCount} companies already exist\n`);
    }

    console.log('🎉 Database setup completed successfully!\n');
    console.log('📋 Next Steps:');
    console.log('1. Update your .env file with actual Supabase credentials');
    console.log('2. Run the database schema using the SQL file in database/schema.sql');
    console.log('3. Start the server with: npm run dev');
    console.log('4. Test the API endpoints');
    console.log('\n📚 API Documentation:');
    console.log('- Health Check: GET /health');
    console.log('- Register: POST /api/auth/register');
    console.log('- Login: POST /api/auth/login');
    console.log('- Admin Login: Use the credentials above');
    console.log('\n🔗 Frontend Integration:');
    console.log('- Update your frontend API base URL to: http://localhost:5000/api');
    console.log('- Use the authentication endpoints for login/register');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase().then(() => {
    process.exit(0);
  });
}

module.exports = { setupDatabase };