const express = require('express');
const router = express.Router();
const Orders = require('../models/orders');

const allowedStatuses = ['Preparing', 'Rejected', 'Waiting Delivery', 'Delivering', 'Successfully Delivered'];

module.exports = (wsServer) => {

// Get all pending orders 
router.get('/getAllPendingOrders', async (req, res) => {
  try {
    const pendingOrder = await Orders.find({status: 'Pending'});

    if (pendingOrder.length > 0) {
      return res.status(200).json(pendingOrder);
    } else {
      return res.status(404).json({ message: 'No pending orders found' });
    }

  } catch (error) {
    return res.status(500).json({ 
      message: 'Error retrieving pending orders',
      error: error.message  
    });
  }
});

// Get all active orders 
router.get('/getAllActiveOrders', async (req, res) => {
  try {
    const allOrder = await Orders.find({
      status: { $nin: ['Pending', 'Rejected', 'Successfully Delivered'] }
    });

    if (allOrder.length > 0) {
      return res.status(200).json(allOrder);
    } else {
      return res.status(404).json({ message: 'No active orders found' });
    }

  } catch (error) {
    return res.status(500).json({ 
      message: 'Error retrieving active orders',
      error: error.message  
    });
  }
});

// Find active Order for a user (Restrict users to 1 active order)
router.get('/getActiveOrder/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const activeOrder = await Orders.findOne({
      userId,
      status: { $nin: ['Pending', 'Rejected', 'Successfully Delivered'] }
    });

    if (activeOrder) {
      return res.status(200).json(activeOrder);
    } else {
      return res.status(404).json({ message: 'No active orders for this user found' });
    }

  } catch (error) {
    return res.status(500).json({ 
      message: 'Error retrieving active orders for this user', 
      error: error.message 
    });
  }
});

// Find pending Order for a user (Restrict users to 1 active order)
router.get('/getPendingOrder/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const pendingOrder = await Orders.findOne({
      userId,
      status: 'Pending'
    });

    if (pendingOrder) {
      return res.status(200).json(pendingOrder);
    } else {
      return res.status(404).json({ message: 'No pending orders for this user found' });
    }

  } catch (error) {
    return res.status(500).json({ 
      message: 'Error retrieving pending orders for this user', 
      error: error.message 
    });
  }
});

// Find users' orders
router.get('/getOrderHistory/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const orderHistory = await Orders.find({userId});

    if (orderHistory.length > 0) {
      return res.status(200).json(orderHistory);
    } else {
      return res.status(404).json({ message: 'No orders for this user found' });
    }

  } catch (error) {
    return res.status(500).json({ 
      message: 'Error retrieving orders for this user', 
      error: error.message 
    });
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

    await Orders.create(req.body);

    wsServer.notifyRoles('ADMIN', 'New Order Created', {
      message: 'New Order Received'
    });

    return res.status(201).json({ message: 'Order placed successfully!'});
  } catch (error) {
    return res.status(500).json({ 
      message: 'Error creating order',
      error: error.message  
    });
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

    // Notify about status update
    wsServer.notifyUsers(updatedOrder.userId, 'Order Status Updated', {
      orderId: orderId,
      status: status,
      message: `Your order status has been updated to ${status}`
    });

    return res.status(200).json({ message: `Order status updated to ${status} successfully!`});
  } catch (error) {
    return res.status(500).json({ 
      message: 'Error updating order status',  
      error: error.message 
    });
  }
});

return router;
};
