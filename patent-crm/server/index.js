const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
const userRoutes = require('./routes/user');
app.use('/api/users', userRoutes);
const brandRoutes = require('./routes/brand');
app.use('/api/brands', brandRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch(err => console.log(err));
