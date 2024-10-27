const express = require('express');
const router = express.Router();
const Reservations = require('../models/reservations');

module.exports = (wsServer) => {
// Get user's reservation
router.get('/getUserReservations/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const userReservations = await Reservations.find({ userId }).lean();

    if (userReservations.length > 0) {
      return res.status(200).json(userReservations);
    } else {
      return res.status(404).json({ message: 'No reservations found for this user' });
    }

  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving user reservations', error });
  }
});

// Get pending reservations
router.get('/getPendingReservations', async (req, res) => {
  try {
    const reservations = await Reservations.find({ status: 'Pending' });

    if (reservations.length === 0) {
      return res.status(404).json({ message: 'No pending reservations found!' });
    }

    return res.status(200).json(reservations);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving reservations', error });
  }
});


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

    wsServer.notifyRoles('ADMIN', 'New Reservation Created', {
      reservationId: reservation._id,
      message: 'New Reservation Received'
    });

    return res.status(201).json({ message: 'Reservation created successfully!', reservation });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating reservation', error });
  }
});

// Update reservation status
router.put('/updateReservationStatus', async (req, res) => {
  try {
    const { reservationId, status } = req.body;
    const allowedStatuses = ['Accepted', 'Declined', 'Cancelled'];

    if (!reservationId) {
      return res.status(400).json({ message: 'Missing reservation ID' });
    }    

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid reservation status' });
    }

    const updatedReservation = await Reservations.findByIdAndUpdate(reservationId, { status }, { new: true });

    if (!updatedReservation) {
      return res.status(404).json({ message: 'Reservation not found!' });
    }

    switch (status) {
      case 'Accepted':
        wsServer.notifyRoles('USER', 'Reservation Accepted', {
          reservationId: updatedReservation._id,
          message: 'Reservation Accepted'
        });
        break;

      case 'Declined':
        wsServer.notifyRoles('USER', 'Reservation Declined', {
          reservationId: updatedReservation._id,
          message: 'Reservation Declined'
        });
        break;
      
      case 'Cancelled':
        wsServer.notifyRoles('ADMIN', 'User Cancelled Reservation', {
          reservationId: updatedReservation._id,
          userId: updatedReservation.userId,
          message: 'User cancelled reservation'
        });
        break;  
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

    const allowedStatuses = ['Accepted', 'Declined'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid reservation status' });
    }

    const updatedReservation = await Reservations.findByIdAndUpdate(
      reservationId,
      { date, time, size, status },
      { new: true }
    );

    if (!updatedReservation) {
      return res.status(404).json({ message: 'Reservation not found!' });
    }

    wsServer.notifyRoles('USER', 'Reservations Details Updated', {
      reservationId: updatedReservation._id,
      message: 'Reservations Details Updated by Staff'
    });

    return res.json({ message: 'Reservation updated successfully!', updatedReservation });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating reservation', error });
  }
});

return router;
}