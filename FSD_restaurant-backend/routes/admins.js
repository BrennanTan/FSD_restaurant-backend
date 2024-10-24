const express = require('express');
const router = express.Router();
const Admins = require('../models/admins');
const bcrypt = require('bcrypt');

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const admin = await Admins.findOne({ username });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found!' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    if (isPasswordValid) {
      res.status(200).json({ message: 'Login successful!' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

module.exports = router;
