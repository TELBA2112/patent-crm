/**
 * MKTU endpoints tekshirish uchun utility script
 * 
 * Ishlatish: node test-mktu-endpoints.js
 */

require('dotenv').config();
const axios = require('axios');

// Test uchun ma'lumotlar
const TEST_JOB_ID = process.argv[2] || '000000000000000000000000'; // Replace with actual job ID or pass as argument
const TOKEN = process.argv[3] || 'YOUR_TOKEN_HERE'; // Replace with actual token or pass as argument

// Test function
async function testMktuEndpoints() {
  console.log('=== MKTU ENDPOINTS TEST ===');
  
  // 1. jobActions endpoint test
  try {
    console.log('\n1. Testing POST /api/job-actions/:id/update-mktu-classes');
    const jobActionsResponse = await axios.post(
      `http://localhost:5000/api/job-actions/${TEST_JOB_ID}/update-mktu-classes`,
      { classes: [1, 5, 9, 35] },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    
    console.log('✅ Status:', jobActionsResponse.status);
    console.log('✅ Response:', jobActionsResponse.data);
  } catch (error) {
    console.error('❌ Error with jobActions endpoint:', error.response?.data || error.message);
  }
  
  // 2. jobs endpoint test
  try {
    console.log('\n2. Testing POST /api/jobs/:id/update-mktu-classes');
    const jobsResponse = await axios.post(
      `http://localhost:5000/api/jobs/${TEST_JOB_ID}/update-mktu-classes`,
      { classes: [2, 6, 10, 36] },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    
    console.log('✅ Status:', jobsResponse.status);
    console.log('✅ Response:', jobsResponse.data);
  } catch (error) {
    console.error('❌ Error with jobs endpoint:', error.response?.data || error.message);
  }
  
  // 3. Get MKTU classes test
  try {
    console.log('\n3. Testing GET /api/jobs/:id/mktu-classes');
    const getResponse = await axios.get(
      `http://localhost:5000/api/jobs/${TEST_JOB_ID}/mktu-classes`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    
    console.log('✅ Status:', getResponse.status);
    console.log('✅ Response:', getResponse.data);
  } catch (error) {
    console.error('❌ Error getting MKTU classes:', error.response?.data || error.message);
  }
  
  console.log('\n=== TEST FINISHED ===');
}

// Execute test
testMktuEndpoints().catch(err => {
  console.error('Unhandled error:', err);
});
