// Simple API test script
const http = require('http');

function testAPI() {
  console.log('🧪 Testing Interview Experience Platform API...\n');

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('✅ Health Check Response:');
        console.log(JSON.stringify(response, null, 2));
        console.log('\n🎉 API is running successfully!');
        console.log('\n📋 Available Endpoints:');
        console.log('- Health Check: GET http://localhost:5000/health');
        console.log('- Register: POST http://localhost:5000/api/auth/register');
        console.log('- Login: POST http://localhost:5000/api/auth/login');
        console.log('- Experiences: GET http://localhost:5000/api/experiences');
        console.log('- Companies: GET http://localhost:5000/api/companies');
        console.log('\n🔗 Frontend Integration:');
        console.log('Update your frontend API base URL to: http://localhost:5000/api');
      } catch (error) {
        console.error('❌ Invalid JSON response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ API Test Failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the server is running: npm run dev');
    console.log('2. Check if port 5000 is available');
    console.log('3. Verify your .env configuration');
    console.log('4. Check server logs for errors');
  });

  req.end();
}

// Run test
testAPI();