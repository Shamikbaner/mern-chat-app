
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// GET /api/messages/:room
router.get('/:room', auth, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error("Messages Error:", err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;