const express = require('express');
const router = express.Router();
const Reservations = require('../models/reservations');

// Create Reservation
router.post('/reservations', async (req, res) => {
    const { date, time, partySize, userId } = req.body;
    const reservation = new Reservations({ date, time, partySize, userId });
    
    await reservation.save();
    res.json({ message: 'Reservation successful!', reservation });
  });

module.exports = router;