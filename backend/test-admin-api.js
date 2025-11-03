// Test the admin API endpoint to see if it returns johndoe
const https = require('https');

function testAdminAPI() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/admin/users',
    method: 'GET',
    headers: {
      'Cookie': 'connect.sid=your-session-id', // You'll need a valid session
      'Content-Type': 'application/json'
    },
    rejectUnauthorized: false // Accept self-signed certificate
  };

  console.log('🔍 Testing admin API endpoint...');
  
  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 API Response Status:', res.statusCode);
      console.log('📋 Response Headers:', res.headers);
      
      try {
        const jsonData = JSON.parse(data);
        console.log('📄 Response Data:');
        console.log('   Success:', jsonData.success);
        console.log('   Users count:', jsonData.users?.length || 'No users field');
        
        if (jsonData.users) {
          console.log('   Users list:');
          jsonData.users.forEach((user, index) => {
            console.log(`     ${index + 1}. ${user.username} (${user.email}) - ${user.role}`);
          });
        }
      } catch (error) {
        console.log('📄 Raw Response:', data);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ API Request failed:', error.message);
    console.log('\n💡 This is expected if you\'re not logged in as admin');
    console.log('   The important thing is that the database has 3 users');
  });
  
  req.end();
}

// Also test direct database query
async function testDatabase() {
  require('dotenv').config();
  const mongoose = require('mongoose');
  const User = require('./models/User');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('\n🔍 Direct database check...');
    
    const users = await User.find({}).select('username email role createdAt');
    console.log(`📊 Database shows ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username} (${user.email}) - ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Run both tests
testAdminAPI();
setTimeout(testDatabase, 1000);