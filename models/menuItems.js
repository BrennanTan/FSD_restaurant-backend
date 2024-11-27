const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  available: { type: Boolean, required: true, default: true},
  image: {type: String, required: true}
});

module.exports = mongoose.model('menuItems', menuItemSchema);