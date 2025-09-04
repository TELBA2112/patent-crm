/**
 * Debug server - serveringizni lokal tarzda ishga tushirish va tekshirish uchun
 * 
 * Ishga tushirish: node debug-server.js
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// CORS va body-parser
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Debug middleware - barcha so'rovlarni ekranga chiqarish
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  
  next();
});

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Test jobs POST route
app.post('/api/jobs', (req, res) => {
  console.log('POST /api/jobs - Test route');
  console.log('Request body:', req.body);
  
  // Majburiy maydonlarni tekshirish
  const { clientName, clientSurname, phone, personType, assignedTo } = req.body;
  
  if (!clientName || !clientSurname || !phone || !personType || !assignedTo) {
    return res.status(400).json({ 
      message: 'Majburiy maydonlar to\'ldirilmagan',
      required: ['clientName', 'clientSurname', 'phone', 'personType', 'assignedTo'],
      received: req.body
    });
  }
  
  // Muvaffaqiyatli javob
  res.status(201).json({
    _id: 'test_' + Date.now(),
    ...req.body,
    status: 'yangi',
    createdAt: new Date().toISOString()
  });
});

// Server ishga tushirish
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`
=================================================
  DEBUG SERVER PORT ${PORT} da ishga tushirildi
=================================================
  
  Endpointlar:
  - GET  http://localhost:${PORT}/api/health
  - POST http://localhost:${PORT}/api/jobs
    
  Debug server lokal tarzda ishlayapti.
  Ctrl+C bilan to'xtatish mumkin.
=================================================
`);
});
