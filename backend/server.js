require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

// Models
const Message = require('./models/Message');

const app = express();

// --- CORS CONFIGURATION (Sabhi ko allow karega) ---
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true
}));

// --- FIX: Image Upload Limit (10MB) ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Connection Error: ", err));

// --- Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/messages', require('./routes/message')); // Yahan check karein 'message' ya 'messages'

// --- Socket.IO Setup ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Sabhi ko allow
    methods: ["GET", "POST"]
  },
  // --- FIX: Image Size Limit (10MB) ---
  maxHttpBufferSize: 1e7
});

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // 1. Room Join
  socket.on('join_room', (data) => {
    socket.join(data);
    console.log(`User ${socket.id} joined room: ${data}`);
  });

  // 2. Typing Indicators
  socket.on('typing', (data) => {
    socket.to(data.room).emit('display_typing', data.username);
  });

  socket.on('stop_typing', (data) => {
    socket.to(data.room).emit('hide_typing');
  });

  // 3. Message & Image Handling
  socket.on('send_message', async (data) => {
    try {
      const newMessage = new Message({
        room: data.room,
        author: data.author,
        message: data.message,
        image: data.image, // Image support
        time: data.time
      });
      await newMessage.save();

      // Room mein sabko bhejo
      io.to(data.room).emit('receive_message', data);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log("User Disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 SERVER IS RUNNING ON PORT ${PORT}`);
});