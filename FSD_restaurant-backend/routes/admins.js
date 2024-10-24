const express = require('express');
const router = express.Router();
const Admins = require('../models/admins');
  
// User Login
app.post('/login', async (req, res) => {
    try{
    const { username, password } = req.body;
    const admin = await Admins.findOne({ username });
    
    if(!admin) {
        return res.status(404).json({ message: 'User not found!' });
    }

    if (admin && await bcrypt.compare(password, admin.password)) {
        res.json({ message: 'Login successful!' });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
    }catch(error){
    res.status(500).json({ message: 'Error login', error });

    }
});

module.exports = router;
