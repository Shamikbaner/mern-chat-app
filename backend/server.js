require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

// Models
const Message = require('./models/Message');

const app = express();

// --- CORS CONFIGURATION ---
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true
}));

// --- Image Upload Limit (10MB) ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Connection Error: ", err));

// --- Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/messages', require('./routes/message')); // Yahan 'message' ya 'messages' check kar lena

// --- Socket.IO Setup ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  // --- Image Size Limit (10MB) ---
  maxHttpBufferSize: 1e7
});

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // 1. Room Join
  socket.on('join_room', (data) => {
    socket.join(data.room);

    // Socket ko username aur room yaad karwayein
    socket.username = data.username;
    socket.room = data.room;

    console.log(`User ${socket.username} (ID: ${socket.id}) joined room: ${data.room}`);

    // Sabko "System" message bhejo
    socket.to(data.room).emit('receive_message', {
      author: 'System',
      message: `${data.username} has joined the chat`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
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
        image: data.image,
        time: data.time
      });
      await newMessage.save();

      io.to(data.room).emit('receive_message', data);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  // 4. Disconnect Handling
  socket.on('disconnect', () => {
    console.log("User Disconnected", socket.id);

    if (socket.username) {
      io.to(socket.room).emit('receive_message', {
        author: 'System',
        message: `${socket.username} has left the chat`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 SERVER IS RUNNING ON PORT ${PORT}`);
});