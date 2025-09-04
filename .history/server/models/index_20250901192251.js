// Mongoose modellarini to'plash va eksport qilish uchun

// Modellarni import qilish
const User = require('./User');
const Job = require('./Job');

// Barcha modellarni eksport qilish
module.exports = {
  User,
  Job
};
