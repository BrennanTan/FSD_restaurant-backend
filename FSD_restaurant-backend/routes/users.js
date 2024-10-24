const express = require('express');
const router = express.Router();
const Users = require('../models/users');

// User Registration
app.post('/register', async (req, res) => {
    try{
      const { username, password, phone } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new Users({ username, password: hashedPassword, phone });
      
      await user.save();
      res.json({ message: 'User registered successfully!' });
    }catch(error){
      res.status(500).json({ message: 'Error registering', error });
    }
  });
  
// User Login
app.post('/login', async (req, res) => {
    try{
    const { username, password } = req.body;
    const user = await Users.findOne({ username });
    
    if(!user) {
        return res.status(404).json({ message: 'User not found!' });
    }

    if (user && await bcrypt.compare(password, user.password)) {
        res.json({ message: 'Login successful!' });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
    }catch(error){
    res.status(500).json({ message: 'Error login', error });

    }
});

module.exports = router;
