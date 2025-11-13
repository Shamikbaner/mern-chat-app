const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  room: { type: String, required: true },
  author: { type: String, required: true },
  message: { type: String },
  image: { type: String },
  time: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema);