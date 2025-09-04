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

// Message modelini import qilish
try {
  require('./Message');
  console.log('Message modeli muvaffaqiyatli yuklandi');
} catch (e) {
  console.log('Message modeli topilmadi, o\'tkazib yuborildi');
}

// Notification modelini import qilish
try {
  require('./Notification');
  console.log('Notification modeli muvaffaqiyatli yuklandi');
} catch (e) {
  console.log('Notification modeli topilmadi, o\'tkazib yuborildi');
}
