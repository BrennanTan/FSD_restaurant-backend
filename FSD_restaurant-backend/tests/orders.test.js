const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const sinon = require('sinon');
const mongoose = require('mongoose');
const Orders = require('../models/orders');

chai.use(chaiHttp);

// Mock WebSocket server
const mockWsServer = {
  notifyRoles: sinon.spy(),
  notifyUsers: sinon.spy()
};

// Create Express app for testing
const express = require('express');
const app = express();
app.use(express.json());
const orderRoutes = require('../routes/orders')(mockWsServer);
app.use(orderRoutes);

// Sample test data
const sampleOrder = {
  userId: '123456789',
  items: [
    { itemId: '1', quantity: 2, name: 'Burger' },
    { itemId: '2', quantity: 1, name: 'Fries' }
  ],
  status: 'Preparing'
};

describe('Order Routes', () => {
  beforeEach(async () => {
    // Clear mocks and database before each test
    sinon.restore();
    await Orders.deleteMany({});
  });

  describe('GET /getAllOrders', () => {
    it('should return 404 when no active orders exist', async () => {
      const response = await chai.request(app).get('/getAllOrders');
      expect(response).to.have.status(404);
      expect(response.body).to.have.property('message', 'No orders found');
    });

    it('should return only active orders', async () => {
      // Create test orders with different statuses
      await Orders.create([
        { ...sampleOrder, status: 'Preparing' },
        { ...sampleOrder, status: 'Rejected' },
        { ...sampleOrder, status: 'Delivering' },
        { ...sampleOrder, status: 'Successfully Delivered' }
      ]);

      const response = await chai.request(app).get('/getAllOrders');
      
      expect(response).to.have.status(200);
      expect(response.body).to.be.an('array');
      expect(response.body).to.have.lengthOf(2); // Only Preparing and Delivering
      expect(response.body.every(order => 
        !['Rejected', 'Successfully Delivered'].includes(order.status)
      )).to.be.true;
    });
  });

  describe('GET /getActiveOrder/:userId', () => {
    it('should return active order for user', async () => {
      const order = await Orders.create(sampleOrder);
      
      const response = await chai.request(app)
        .get(`/getActiveOrder/${sampleOrder.userId}`);
      
      expect(response).to.have.status(200);
      expect(response.body).to.have.property('_id', order._id.toString());
      expect(response.body).to.have.property('status', 'Preparing');
    });

    it('should return 404 when user has no active orders', async () => {
      const response = await chai.request(app)
        .get('/getActiveOrder/nonexistentuser');
      
      expect(response).to.have.status(404);
      expect(response.body).to.have.property('message', 'No active order found');
    });

    it('should not return completed or rejected orders', async () => {
      await Orders.create({
        ...sampleOrder,
        status: 'Successfully Delivered'
      });

      const response = await chai.request(app)
        .get(`/getActiveOrder/${sampleOrder.userId}`);
      
      expect(response).to.have.status(404);
      expect(response.body).to.have.property('message', 'No active order found');
    });
  });

  describe('POST /newOrder', () => {
    it('should create a new order with valid data', async () => {
      const response = await chai.request(app)
        .post('/newOrder')
        .send({
          userId: sampleOrder.userId,
          items: sampleOrder.items
        });
      
      expect(response).to.have.status(201);
      expect(response.body).to.have.property('message', 'Order placed successfully!');
      expect(response.body.order).to.have.property('userId', sampleOrder.userId);
      expect(mockWsServer.notifyRoles.calledWith(
        'ADMIN',
        'New Order Created',
        sinon.match.object
      )).to.be.true;
    });

    it('should return 400 when items array is empty', async () => {
      const response = await chai.request(app)
        .post('/newOrder')
        .send({
          userId: sampleOrder.userId,
          items: []
        });
      
      expect(response).to.have.status(400);
      expect(response.body).to.have.property('message', 'Items cannot be empty');
    });

    it('should return 400 when userId is missing', async () => {
      const response = await chai.request(app)
        .post('/newOrder')
        .send({
          items: sampleOrder.items
        });
      
      expect(response).to.have.status(400);
      expect(response.body).to.have.property('message', 'User ID is required');
    });
  });

  describe('PUT /updateOrderStatus', () => {
    let orderId;

    beforeEach(async () => {
      const order = await Orders.create(sampleOrder);
      orderId = order._id.toString();
    });

    it('should update order status with valid status', async () => {
      const newStatus = 'Delivering';
      
      const response = await chai.request(app)
        .put('/updateOrderStatus')
        .send({
          orderId,
          status: newStatus
        });
      
      expect(response).to.have.status(200);
      expect(response.body).to.have.property('message', `Order status updated to ${newStatus} successfully!`);
      expect(response.body.updatedOrder).to.have.property('status', newStatus);
      expect(mockWsServer.notifyUsers.calledWith(
        sampleOrder.userId,
        'Order Status Updated',
        sinon.match.object
      )).to.be.true;
    });

    it('should return 400 for invalid status', async () => {
      const response = await chai.request(app)
        .put('/updateOrderStatus')
        .send({
          orderId,
          status: 'InvalidStatus'
        });
      
      expect(response).to.have.status(400);
      expect(response.body).to.have.property('message', 'Invalid order status');
    });

    it('should return 404 when order not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await chai.request(app)
        .put('/updateOrderStatus')
        .send({
          orderId: nonExistentId,
          status: 'Delivering'
        });
      
      expect(response).to.have.status(404);
      expect(response.body).to.have.property('message', 'Order not found!');
    });
  });
});