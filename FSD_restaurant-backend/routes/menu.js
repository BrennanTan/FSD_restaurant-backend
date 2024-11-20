const express = require('express');
const router = express.Router();
const MenuItems = require('../models/menuItems');

module.exports = (wsServer) => {
// Get Menu
router.get('/getMenu', async (req, res) => {
  try {
    const menuItems = await MenuItems.find().lean();

    if (!menuItems || menuItems.length === 0) {
      return res.status(404).json({ message: 'No menu items found!' });
    }

    res.status(200).json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving menu items', error });
  }
});

// Add New Menu Item
router.post('/newMenuItem', async (req, res) => {
  try {
    const { name, category, description, price, image } = req.body;

    if (!name || !category || !description || !price || !image) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newMenuItem = new MenuItems({ name, category, description, price, image });

    await newMenuItem.save();
    res.status(201).json({ message: 'Menu item added successfully!', newMenuItem });
  } catch (error) {
    res.status(500).json({ message: 'Error adding menu item', error });
  }
});

// Update Menu Item
router.put('/updateMenuItem', async (req, res) => {
  try {
    const { itemId, name, category, description, price, available, image } = req.body;

    if (!itemId) {
      return res.status(400).json({ message: 'Missing item ID' });
    }

    const checkItem = await MenuItems.findById(itemId);
    if (!checkItem) {
      return res.status(404).json({ message: 'Menu item not found!' });
    }

    const updatedMenuItem = await MenuItems.findByIdAndUpdate(
      itemId,
      { name, category, description, price, available, image },
      { new: true }
    );

    // If item updated to unavailable, send ws notif
    if (updatedMenuItem.available === false) {
      wsServer.notifyRoles('USER', 'Item unavailable', {
        itemId: updatedMenuItem._id,
        status: 'Item unavailable'
      });
    }

    res.status(200).json({ message: 'Menu item updated successfully!', updatedMenuItem });
  } catch (error) {
    res.status(500).json({ message: 'Error updating menu item', error });
  }
});

// Delete Menu Item
router.delete('/deleteMenuItem', async (req, res) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ message: 'Missing item ID' });
    }

    const deletedMenuItem = await MenuItems.findByIdAndDelete(itemId);

    if (!deletedMenuItem) {
      return res.status(404).json({ message: 'Menu item not found!' });
    }

    res.status(200).json({ message: 'Menu item deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting menu item', error });
  }
});

return router;
};