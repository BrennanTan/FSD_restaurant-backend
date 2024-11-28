const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  items: [{ 
    itemName: { type: String }, 
    quantity: Number 
  }],
  status: { type: String, default: 'Pending' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
});

module.exports = mongoose.model('orders', orderSchema);