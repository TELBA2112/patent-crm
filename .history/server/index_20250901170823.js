require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true }));

// Debugging middleware - har bir so'rovni log qilish
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const jobRoutes = require('./routes/jobs');
const jobActionsRoutes = require('./routes/jobActions');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/job-actions', jobActionsRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Patent API Server ishlayapti!');
});

// 404 xatoligi
app.use((req, res) => {
  console.log(`404 xatoligi: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Manba topilmadi', path: req.url, method: req.method });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('SERVER XATOSI:', err.stack);
  res.status(500).json({ message: 'Server xatosi', error: err.message });
});

// Serverni ishga tushirish
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB ga ulanish muvaffaqiyatli o\'rnatildi');
    
    const PORT = process.env.PORT || 5000;
    
    app.listen(PORT, () => {
      console.log(`\n✅ Server ${PORT} portda ishlayapti`);
      console.log(`📡 API manzili: http://localhost:${PORT}\n`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n⛔️ Xatolik: ${PORT} port allaqachon band.`);
        console.log('Iltimos, portni bo\'shatib, serverni qayta ishga tushiring.');
        process.exit(1);
      } else {
        console.error('Server ishga tushirishda xatolik:', err);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('\n⛔️ MongoDB ga ulanishda xatolik:', err.message);
    process.exit(1);
  }
};

startServer();