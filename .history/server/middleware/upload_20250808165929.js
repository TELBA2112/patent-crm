const multer = require('multer');
const path = require('path');

// Saqlash joyi va fayl nomi
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // unikal nom
  }
});

const fileFilter = (req, file, cb) => {
  // Faqat rasm fayllarini qabul qilamiz
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Faqat rasm fayllari qabul qilinadi'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
