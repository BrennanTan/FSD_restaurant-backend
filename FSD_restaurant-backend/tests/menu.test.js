const chai = require('chai');
const chaiHttp = require('chai-http');
const express = require('express');
const { expect } = chai;
const sinon = require('sinon');
const mongoose = require('mongoose');
const MenuItems = require('../models/menuItems');

chai.use(chaiHttp);

// Mock the WebSocket server
const mockWsServer = {
  notifyRoles: sinon.spy()
};

// Create Express app for testing
const app = express();
app.use(express.json());
const menuRoutes = require('../routes/menu')(mockWsServer);
app.use(menuRoutes);

// Mock data
const sampleMenuItem = {
  name: 'Test Item',
  category: 'Test Category',
  description: 'Test Description',
  price: 9.99,
  image: 'test-image.jpg',
  available: true
};

describe('Menu Routes', () => {
  beforeEach(async () => {
    // Clear mocks and database before each test
    sinon.restore();
    await MenuItems.deleteMany({});
  });

  describe('GET /getMenu', () => {
    it('should return 404 when no menu items exist', async () => {
      const response = await chai.request(app).get('/getMenu');
      expect(response).to.have.status(404);
      expect(response.body).to.have.property('message', 'No menu items found!');
    });

    it('should return menu items when they exist', async () => {
      await MenuItems.create(sampleMenuItem);
      const response = await chai.request(app).get('/getMenu');
      
      expect(response).to.have.status(200);
      expect(response.body).to.be.an('array');
      expect(response.body).to.have.lengthOf(1);
      expect(response.body[0]).to.have.property('name', sampleMenuItem.name);
    });
  });

  describe('POST /newMenuItem', () => {
    it('should create a new menu item with valid data', async () => {
      const response = await chai.request(app)
        .post('/newMenuItem')
        .send(sampleMenuItem);
      
      expect(response).to.have.status(201);
      expect(response.body).to.have.property('message', 'Menu item added successfully!');
      expect(response.body.newMenuItem).to.have.property('name', sampleMenuItem.name);
    });

    it('should return 400 when required fields are missing', async () => {
      const invalidMenuItem = {
        name: 'Test Item',
        // missing required fields
      };

      const response = await chai.request(app)
        .post('/newMenuItem')
        .send(invalidMenuItem);
      
      expect(response).to.have.status(400);
      expect(response.body).to.have.property('message', 'Missing required fields');
    });
  });

  describe('PUT /updateMenuItem', () => {
    let existingItemId;

    beforeEach(async () => {
      const item = await MenuItems.create(sampleMenuItem);
      existingItemId = item._id.toString();
    });

    it('should update an existing menu item', async () => {
      const updates = {
        ...sampleMenuItem,
        itemId: existingItemId,
        name: 'Updated Name'
      };

      const response = await chai.request(app)
        .put('/updateMenuItem')
        .send(updates);
      
      expect(response).to.have.status(200);
      expect(response.body).to.have.property('message', 'Menu item updated successfully!');
      expect(response.body.updatedMenuItem).to.have.property('name', 'Updated Name');
    });

    it('should send WebSocket notification when item becomes unavailable', async () => {
      const updates = {
        ...sampleMenuItem,
        itemId: existingItemId,
        available: false
      };

      const response = await chai.request(app)
        .put('/updateMenuItem')
        .send(updates);
      
      expect(response).to.have.status(200);
      expect(mockWsServer.notifyRoles.calledWith(
        'USER',
        'Item unavailable',
        sinon.match.object
      )).to.be.true;
    });

    it('should return 404 when item does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updates = {
        ...sampleMenuItem,
        itemId: nonExistentId
      };

      const response = await chai.request(app)
        .put('/updateMenuItem')
        .send(updates);
      
      expect(response).to.have.status(404);
      expect(response.body).to.have.property('message', 'Menu item not found!');
    });
  });

  describe('DELETE /deleteMenuItem', () => {
    let existingItemId;

    beforeEach(async () => {
      const item = await MenuItems.create(sampleMenuItem);
      existingItemId = item._id.toString();
    });

    it('should delete an existing menu item', async () => {
      const response = await chai.request(app)
        .delete('/deleteMenuItem')
        .send({ itemId: existingItemId });
      
      expect(response).to.have.status(200);
      expect(response.body).to.have.property('message', 'Menu item deleted successfully!');
    });

    it('should return 404 when trying to delete non-existent item', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await chai.request(app)
        .delete('/deleteMenuItem')
        .send({ itemId: nonExistentId });
      
      expect(response).to.have.status(404);
      expect(response.body).to.have.property('message', 'Menu item not found!');
    });

    it('should return 400 when itemId is missing', async () => {
      const response = await chai.request(app)
        .delete('/deleteMenuItem')
        .send({});
      
      expect(response).to.have.status(400);
      expect(response.body).to.have.property('message', 'Missing item ID');
    });
  });
});