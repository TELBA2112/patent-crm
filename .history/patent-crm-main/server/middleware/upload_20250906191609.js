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
  // Rasm va PDF fayllarini qabul qilamiz
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Faqat rasm yoki PDF fayllari qabul qilinadi'), false);
  }
};

const upload = multer({ storage, fileFilter });

// Less restrictive uploader for arbitrary files (e.g., receipts, certificates)
const uploadAny = multer({ storage });

module.exports = upload;
module.exports.uploadAny = uploadAny;
