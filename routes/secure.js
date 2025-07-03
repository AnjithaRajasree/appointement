const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  res.json({ msg: `Hello user with ID: ${req.user.id} and role: ${req.user.role}` });
});

module.exports = router;
