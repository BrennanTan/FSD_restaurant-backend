const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Users = require('../models/users');

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingUser = await Users.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new Users({ username, password: hashedPassword });
    await user.save();
    
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error registering user',
      error: error.message 
     });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const user = await Users.findOne({ username, role: 'USER' });

    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful!' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error during login',
      error: error.message 
    });
  }
});

// Admin Login
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const admin = await Users.findOne({ username, role: 'ADMIN' });

    if (!admin) {
      return res.status(404).json({ message: 'User not found!' });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful!' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error during login', 
      error: error.message  
    });
  }
});

module.exports = router;
