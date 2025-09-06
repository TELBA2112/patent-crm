const express = require('express');
const router = express.Router();

router.get('/ping', (req, res) => {
  res.json({ ok: true, router: 'notifications' });
});

module.exports = router;
