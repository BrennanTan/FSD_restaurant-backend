const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  time: { type: String, required: true },
  size: { type: Number, required: true },
  status: { type: String, required: true, default: 'Pending' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
});

module.exports = mongoose.model('reservations', reservationSchema);