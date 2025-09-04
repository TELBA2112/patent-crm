require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// CORS sozlamalari
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// So'rovlarni qayta ishlash
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// So'rovlarni kuzatish middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Uploads papkasini yaratish
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
const certificatesDir = path.join(uploadsDir, 'certificates');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Uploads papkasi yaratildi');
}

if (!fs.existsSync(certificatesDir)) {
  fs.mkdirSync(certificatesDir);
  console.log('Certificates papkasi yaratildi');
}

// MongoDB ulanish
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/patent-db')
  .then(() => console.log('MongoDB ulandi'))
  .catch(err => console.error('MongoDB ulanish xatosi:', err));

// Diagnostika endpointi
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/jobs', require('./routes/jobs'));

// Statik fayllar
app.use('/uploads', express.static('uploads'));

// 404 xatoligi
app.use((req, res) => {
  console.log(`404 xatoligi: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Manba topilmadi', path: req.url, method: req.method });
});

// Xatolarni qayta ishlash
app.use((err, req, res, next) => {
  console.error('Server xatoligi:', err);
  res.status(500).json({ message: 'Serverda ichki xatolik', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portda ishlayapti`);
  console.log(`Server vaqti: ${new Date().toISOString()}`);
  console.log('API endpointlari:');
  console.log('- GET    /api/health');
  console.log('- GET    /api/users');
  console.log('- GET    /api/jobs');
  console.log('- POST   /api/jobs');
  console.log('- PATCH  /api/jobs/:id');
  console.log('- DELETE /api/jobs/:id');
});
