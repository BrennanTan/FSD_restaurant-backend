const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');

const connectDB = require('./db');

const usersRouter = require('./routes/users');
const adminsRouter = require('./routes/admins');
const menuRouter = require('./routes/menu');
const ordersRouter = require('./routes/orders');
const reservationsRouter = require('./routes/reservations');

const app = express();
app.use(cors());
connectDB();

// Routers
app.use('/users', usersRouter);
app.use('/admins', adminsRouter);
app.use('/menu', menuRouter);
app.use('/orders', ordersRouter);
app.use('/reservations', reservationsRouter);

// Track Order
app.get('/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  const order = await Orders.findById(orderId);
  
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});
  
// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});