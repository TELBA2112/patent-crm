require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(express.json()); // JSON body parse qilish uchun kerak

// MongoDB ulanish
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/patent-db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB ulandi'))
  .catch(err => {
    console.error('❌ MongoDB ulanish xatosi:', err.message);
    process.exit(1); // muammo bo'lsa, serverni to'xtatadi
  });

// Routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/jobs', require('./routes/jobs'));

// Statik fayllar
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT} portda ishlayapti`));
