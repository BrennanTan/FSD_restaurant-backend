const express = require('express');
const router = express.Router();
const MenuItems = require('../models/menuItems');

// Get Menu
router.get('/getMenu', async (req, res) => {
    try{
      const menuItems = await MenuItems.find();
  
      if(!menuItems) {
        return res.status(404).json({ message: 'Menu Items not found!' });
      }
    
      res.json(menuItems);
    }catch(error){
      res.status(500).json({ message: 'Error get menu', error });
    }
  
  });
  
  // New menu item
  router.post('/newMenuItem', async (req, res) => {
    try{
      const { name, category, description, price, quantity, image } = req.body;
      const newMenuItem = new MenuItems({ name, category, description, price, quantity, image });
      
      await newMenuItem.save();
      res.json({ message: 'Menu Item added successfully!' });
    }catch(error){
      res.status(500).json({ message: 'Error adding menu item', error });
    }
  
  });
  
  // Update menu item
  router.put('/updateMenuItem', async (req, res) => {
    try {
      const { itemId, name, category, description, price, quantity, image } = req.body;
      
      const updateMenuItem = await MenuItems.findByIdAndUpdate(
        itemId,
        { name, category, description, price, quantity, image },
      );
      
      if (!updateMenuItem) {
        return res.status(404).json({ message: 'Menu Item not found!' });
      }
  
      res.json({ message: 'Menu Item updated successfully!' });
    } catch (error) {
      res.status(500).json({ message: 'Error updating menu item', error });
    }
  });
  
  // Delete menu item
  router.delete('/deleteMenuItem', async (req, res) => {
    try {
      const { itemId } = req.body;
      
      const deleteMenuItem = await MenuItems.findByIdAndDelete(itemId);
      
      if (!deleteMenuItem) {
        return res.status(404).json({ message: 'Menu Item not found!' });
      }
  
      res.json({ message: 'Menu Item deleted successfully!' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting menu item', error });
    }
  
  });

module.exports = router;
