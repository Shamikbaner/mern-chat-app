// backend/routes/auth.js (COMPLETE FILE)
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// 1. REGISTER ROUTE
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    user = new User({ username, password });

    // Password Hash karna
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// 2. LOGIN ROUTE (WITH DEBUGGING LOGS)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // --- DEBUGGING START ---
  console.log("------------------------------------------------");
  console.log("Login Attempt for Username:", username);
  console.log("Password entered:", password);
  // -----------------------

  try {
    let user = await User.findOne({ username });

    if (!user) {
      console.log("❌ Error: User Database mein nahi mila!");
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    console.log("✅ User Found in DB:", user.username);
    // Note: Real app mein password log nahi karte, bas debugging ke liye:
    // console.log("Stored Hashed Password:", user.password);

    // Password Check
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password Match Result:", isMatch);

    if (!isMatch) {
      console.log("❌ Error: Password match nahi hua!");
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    console.log("✅ Login Successful! Token generate ho raha hai...");

    // JWT Token Generation
    const payload = {
      user: {
        id: user.id,
        username: user.username,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, username: user.username });
      }
    );
  } catch (err) {
    console.error("Server Error:", err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;