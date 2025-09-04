// Mongoose modellarini ro'yxatdan o'tkazish

// User modelini import qilish - agar allaqachon yaratilgan bo'lsa
try {
  require('./User');
  console.log('User modeli muvaffaqiyatli yuklandi');
} catch (e) {
  console.log('User modeli topilmadi, o\'tkazib yuborildi');
}

// Job modelini import qilish
try {
  require('./Job');
  console.log('Job modeli muvaffaqiyatli yuklandi');
} catch (e) {
  console.error('Job modelini yuklashda xatolik:', e.message);
}
