require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// CORS sozlamalarini kengaytirilgan ko'rinishda
app.use(cors({
  origin: '*', // Barcha hostlardan so'rovlarni qabul qilish
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON so'rovlarini qayta ishlash uchun
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true }));

// So'rovlarni kuzatish uchun middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// MongoDB ulanish
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/patent-db')
  .then(() => console.log('MongoDB ulandi'))
  .catch(err => console.error('MongoDB ulanish xatosi:', err));

// Routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/jobs', require('./routes/jobs'));

// Statik fayllar
app.use('/uploads', express.static('uploads'));

// 404 xatoligi uchun middleware
app.use((req, res) => {
  console.log('404 xatoligi:', req.method, req.url);
  res.status(404).json({ message: 'Manba topilmadi' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT} portda ishlayapti`));
