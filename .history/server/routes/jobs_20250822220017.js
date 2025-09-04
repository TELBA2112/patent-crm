const express = require('express');
const router = express.Router();

router.get('/__test', (req, res) => {
  res.json({ ok: true, msg: "jobs router yuklandi ✅" });
});

module.exports = router;
