const express = require('express');
const router = express.Router();
const Reservations = require('../models/reservations');

// Get all reservations
router.get('/getReservations', async (req, res) => {
  try {
    const reservations = await Reservations.find();

    if (reservations.length === 0) {
      return res.status(404).json({ message: 'No reservations found!' });
    }

    return res.json(reservations);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving reservations', error });
  }
});

// Create a new reservation
router.post('/newReservations', async (req, res) => {
  try {
    const { date, time, size, userId } = req.body;

    if (!date || !time || !size || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const reservation = new Reservations({ date, time, size, userId });
    
    await reservation.save();
    return res.status(201).json({ message: 'Reservation created successfully!', reservation });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating reservation', error });
  }
});

// Update reservation status
router.put('/updateReservationStatus', async (req, res) => {
  try {
    const { reservationId, status } = req.body;
    const allowedStatuses = ['Accepted', 'Rejected', 'Cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid reservation status' });
    }

    const updatedReservation = await Reservations.findByIdAndUpdate(reservationId, { status }, { new: true });

    if (!updatedReservation) {
      return res.status(404).json({ message: 'Reservation not found!' });
    }

    return res.json({ message: `Reservation status updated to ${status} successfully!`, updatedReservation });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating reservation status', error });
  }
});

// Update reservation details
router.put('/updateReservation', async (req, res) => {
  try {
    const { reservationId, date, time, size, status } = req.body;

    if (!reservationId || !date || !time || !size) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const updatedReservation = await Reservations.findByIdAndUpdate(
      reservationId,
      { date, time, size, status },
      { new: true }
    );

    if (!updatedReservation) {
      return res.status(404).json({ message: 'Reservation not found!' });
    }

    return res.json({ message: 'Reservation updated successfully!', updatedReservation });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating reservation', error });
  }
});

module.exports = router;
