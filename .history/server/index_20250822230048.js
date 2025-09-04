const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth'); // Auth routelari
const jobRoutes = require('./routes/jobs'); // Jobs routelari

// .env faylini yuklash
dotenv.config();

const app = express();

// JSON parser middleware
app.use(express.json());

// MongoDB ulanishi
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB ga ulanish muvaffaqiyatli'))
  .catch(err => console.error('MongoDB ulanish xatosi:', err));

// Routelar
app.use('/api/auth', authRoutes); // Auth routelari
app.use('/api/jobs', jobRoutes); // Jobs routelari

// Serverni ishga tushirish
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT}-portda ishlamoqda`));