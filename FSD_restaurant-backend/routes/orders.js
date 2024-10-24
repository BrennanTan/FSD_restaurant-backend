const express = require('express');
const router = express.Router();
const Orders = require('../models/orders'); // Adjust the path as needed

// Create Order
router.post('/newOrder', async (req, res) => {
    try{
      const { items, userId } = req.body;
      const order = new Orders({ items, userId });
      
      await order.save();
      res.json({ message: 'Order placed successfully!', order });
    }catch(error){
      res.status(500).json({ message: 'Error creating order', error });
    }
  
  });
  
// Accept Order
router.post('/acceptOrder', async (req, res) => {
  try{
    const { orderId } = req.body;
    const acceptOrder = await Orders.findByIdAndUpdate(orderId, {status: 'Preparing'})

    if (!acceptOrder) {
      return res.status(404).json({ message: 'Order not found!' });
    }
    
    res.json({ message: 'Order accepted successfully!'});
  }catch(error){
    res.status(500).json({ message: 'Error accepting order', error });
  }

});

// Reject Order
router.post('/rejectOrder', async (req, res) => {
  try{
    const { orderId } = req.body;
    const rejectOrder = await Orders.findByIdAndUpdate(orderId, {status: 'Rejected'})

    if (!rejectOrder) {
      return res.status(404).json({ message: 'Order not found!' });
    }
    
    res.json({ message: 'Order rejected successfully!'});
  }catch(error){
    res.status(500).json({ message: 'Error rejecting order', error });
  }

});

// Order waiting delivery
router.post('/waitDeliveryOrder', async (req, res) => {
  try{
    const { orderId } = req.body;
    const waitDeliveryOrder = await Orders.findByIdAndUpdate(orderId, {status: 'Waiting Delivery'})

    if (!waitDeliveryOrder) {
      return res.status(404).json({ message: 'Order not found!' });
    }
    
    res.json({ message: 'Order status updated to waiting delivery successfully!'});
  }catch(error){
    res.status(500).json({ message: 'Error updating order to waiting delivery', error });
  }

});

// Order out for delivery
router.post('/deliveringOrder', async (req, res) => {
  try{
    const { orderId } = req.body;
    const deliveringOrder = await Orders.findByIdAndUpdate(orderId, {status: 'Delivering'})

    if (!deliveringOrder) {
      return res.status(404).json({ message: 'Order not found!' });
    }
    
    res.json({ message: 'Order status updated to delivering successfully!'});
  }catch(error){
    res.status(500).json({ message: 'Error updating order to delivering', error });
  }

});

// Order Successfully Delivered
router.post('/deliveredOrder', async (req, res) => {
  try{
    const { orderId } = req.body;
    const deliveredOrder = await Orders.findByIdAndUpdate(orderId, {status: 'Successfully Delivered'})

    if (!deliveredOrder) {
      return res.status(404).json({ message: 'Order not found!' });
    }
    
    res.json({ message: 'Order status updated to successfully delivered successfully!'});
  }catch(error){
    res.status(500).json({ message: 'Error updating order to successfully delivered', error });
  }

});

module.exports = router;
