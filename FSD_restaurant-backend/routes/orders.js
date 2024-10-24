const express = require('express');
const router = express.Router();
const Orders = require('../models/orders');

const allowedStatuses = ['Preparing', 'Rejected', 'Waiting Delivery', 'Delivering', 'Successfully Delivered'];

// Find active Order for a user (Restrict users to 1 active order)
router.get('/getActiveOrder/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const activeOrder = await Orders.findOne({
      userId,
      status: { $nin: ['Rejected', 'Successfully Delivered'] }
    });

    if (activeOrder) {
      return res.json(activeOrder);
    } else {
      return res.json({ message: 'No active order found' });
    }

  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving active orders', error });
  }
});

// Create new Order
router.post('/newOrder', async (req, res) => {
  try {
    const { items, userId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Items cannot be empty' });
    }
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const order = new Orders({ items, userId });
    
    await order.save();
    return res.status(201).json({ message: 'Order placed successfully!', order });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating order', error });
  }
});

// Update Order Status
router.put('/updateOrderStatus', async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const updatedOrder = await Orders.findByIdAndUpdate(orderId, { status }, { new: true });

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found!' });
    }

    return res.json({ message: `Order status updated to ${status} successfully!`, updatedOrder });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating order status', error });
  }
});

module.exports = router;
