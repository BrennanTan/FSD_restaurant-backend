const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/restaurantApp');
    console.log('MongoDB connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
