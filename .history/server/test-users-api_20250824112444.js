/**
 * Foydalanuvchi API-ni tekshirish uchun skript
 * 
 * Ishga tushirish: node test-users-api.js
 */

const axios = require('axios');
const token = 'YOUR_TOKEN_HERE'; // Token qo'yish kerak

async function testUserAPI() {
  try {
    console.log('User API tekshirilmoqda...');
    
    // GET /api/users-test (autentifikatsiyasiz)
    console.log('\nTEST 1: GET /api/users-test');
    const testResponse = await axios.get('http://localhost:5000/api/users-test');
    console.log('Status:', testResponse.status);
    console.log('Javob:', testResponse.data);
    
    // GET /api/users (autentifikatsiya bilan)
    console.log('\nTEST 2: GET /api/users');
    try {
      const usersResponse = await axios.get('http://localhost:5000/api/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Status:', usersResponse.status);
      console.log('Javob:', usersResponse.data);
    } catch (err) {
      console.error('Xatolik:', err.response?.status, err.response?.data || err.message);
    }
    
    // GET /api/users?role=operator (autentifikatsiya bilan)
    console.log('\nTEST 3: GET /api/users?role=operator');
    try {
      const operatorsResponse = await axios.get('http://localhost:5000/api/users?role=operator', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Status:', operatorsResponse.status);
      console.log('Javob:', operatorsResponse.data);
    } catch (err) {
      console.error('Xatolik:', err.response?.status, err.response?.data || err.message);
    }
    
  } catch (err) {
    console.error('Asosiy xatolik:', err.message);
  }
}

testUserAPI();
