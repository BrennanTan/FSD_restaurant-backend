const request = require('supertest');
const express = require('express');

jest.mock('../models/orders', () => ({
  find: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

const Orders = require('../models/orders');
const createRouter = require('../routes/orders');

describe('Order Routes', () => {
    let app;
    let mockWsServer;
  
    beforeAll(() => {
      app = express();
      app.use(express.json());
  
      mockWsServer = {
        notifyRoles: jest.fn(),
        notifyUsers: jest.fn()
      };
  
      app.use('/orders', createRouter(mockWsServer));
    });
  
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('GET /getAllActiveOrders', () => {
        it('should return 404 when no active orders are found', async () => {
        Orders.find.mockResolvedValue([]);

        const response = await request(app).get('/orders/getAllActiveOrders');
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('No active orders found');
        expect(Orders.find).toHaveBeenCalled();
        });

        it('should return all active orders if they exist', async () => {
            const mockOrders = [
                {
                items: [
                    {
                    itemId: '64a1b23c45d67e8901f23456',
                    quantity: 2
                    },
                    {
                    itemId: '64a1b23c45d67e8901f23457',
                    quantity: 1
                    }
                ],
                status: 'Pending',
                userId: '64a1b23c45d67e8901f23458'
                }
            ];

        Orders.find.mockResolvedValue(mockOrders);

        const response = await request(app).get('/orders/getAllActiveOrders');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockOrders);
        expect(Orders.find).toHaveBeenCalled();
        });

        it('should handle errors', async () => {
        Orders.find.mockRejectedValue(new Error('Database error'));

        const response = await request(app).get('/orders/getAllActiveOrders');
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Error retrieving active orders');
        });
    });

    describe('GET /getActiveOrder/:userId', () => {
        it('should return active order for a user', async () => {
            const mockUserId = 'mock-user-id-123';
            const mockActiveOrder = {
                _id: 'mock-order-id-123',
                items: [
                {
                    itemId: '64a1b23c45d67e8901f23456',
                    quantity: 2,
                },
                ],
                status: 'Pending',
                userId: mockUserId,
            };
            
            Orders.findOne.mockResolvedValue(mockActiveOrder);
            
            const response = await request(app)
                .get(`/orders/getActiveOrder/${mockUserId}`)
                .catch((error) => {
                console.error('Request error:', error);
                throw error;
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toEqual(expect.objectContaining(mockActiveOrder));
        });
            
        it('should return 404 when no active order found for the user', async () => {
            const mockUserId = 'mock-user-id-123';
            
            Orders.findOne.mockResolvedValue(null);
            
            const response = await request(app)
                .get(`/orders/getActiveOrder/${mockUserId}`)
                .catch((error) => {
                console.error('Request error:', error);
                throw error;
                });
            
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('No active orders for this user found');
        });
            
        it('should handle database errors', async () => {
            const mockUserId = 'mock-user-id-123';
            
            Orders.findOne.mockRejectedValue(new Error('Database error'));
            
            const response = await request(app)
                .get(`/orders/getActiveOrder/${mockUserId}`)
                .catch((error) => {
                console.error('Request error:', error);
                throw error;
                });
            
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error retrieving active orders for this user');
        });          
    });

    describe('POST /newOrder', () => {
        it('should create a new order with valid data', async () => {
            const mockOrders =
                {
                items: [
                    {
                    itemId: '64a1b23c45d67e8901f23456',
                    quantity: 2
                    },
                    {
                    itemId: '64a1b23c45d67e8901f23457',
                    quantity: 1
                    }
                ],
                status: 'Pending',
                userId: '64a1b23c45d67e8901f23458'
                };
          
            const mockCreatedItem = { ...mockOrders, _id: 'mock-id-123' };
            Orders.create.mockResolvedValue(mockCreatedItem);
          
            const response = await request(app)
              .post('/orders/newOrder')
              .send(mockOrders)
              .catch(error => {
                console.error('Request error:', error);
                throw error;
              });
            
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Order placed successfully!');
            expect(Orders.create).toHaveBeenCalledWith(expect.objectContaining(mockOrders));
          });
    
        it('should return 400 if items are empty', async () => {
            const emptyItems = [
                {
                items: [],
                status: 'Pending',
                userId: '64a1b23c45d67e8901f23458'
                }
            ];

          const response = await request(app)
            .post('/orders/newOrder')
            .send(emptyItems)
            .catch(error => {
                console.error('Request error:', error);
                throw error;
              });
    
          expect(response.status).toBe(400);
          expect(response.body.message).toBe('Items cannot be empty');
          expect(Orders.create).not.toHaveBeenCalled();
        });

        it('should return 400 if no user ID', async () => {
            const noUserID = [
                {
                items: [
                    {
                    itemId: '64a1b23c45d67e8901f23456',
                    quantity: 2
                    },
                    {
                    itemId: '64a1b23c45d67e8901f23457',
                    quantity: 1
                    }
                ],
                status: 'Pending'
                }
            ];

          const response = await request(app)
            .post('/orders/newOrder')
            .send(noUserID)
            .catch(error => {
                console.error('Request error:', error);
                throw error;
              });
    
          expect(response.status).toBe(400);
          expect(response.body.message).toBe('Items cannot be empty');
          expect(Orders.create).not.toHaveBeenCalled();
        });
    
        it('should handle database errors', async () => {
            const mockOrders =
                {
                items: [
                    {
                    itemId: '64a1b23c45d67e8901f23456',
                    quantity: 2
                    },
                    {
                    itemId: '64a1b23c45d67e8901f23457',
                    quantity: 1
                    }
                ],
                status: 'Pending',
                userId: '64a1b23c45d67e8901f23458'
                };
    
          Orders.create.mockRejectedValue(new Error('Database error'));
    
          const response = await request(app)
            .post('/orders/newOrder')
            .send(mockOrders)
            .catch(error => {
                console.error('Request error:', error);
                throw error;
              });
    
          expect(response.status).toBe(500);
          expect(response.body.message).toBe('Error creating order');
        });
      });

      describe('PUT /updateOrderStatus', () => {    
        it('should reject invalid order status', async () => {

            const invalidStatus = {
                orderId: 'mock_123', 
                status: 'INVALID!!!'
            };
    
          const response = await request(app)
            .put('/orders/updateOrderStatus')
            .send(invalidStatus)
            .catch(error => {
                console.error('Request error:', error);
                throw error;
            });
    
          expect(response.status).toBe(400);
          expect(response.body.message).toBe('Invalid order status');
          expect(Orders.findByIdAndUpdate).not.toHaveBeenCalled();
        });
    
        it('should return 404 when order not found', async () => {
            const mockId = 'mock-id-123'
          Orders.findByIdAndUpdate.mockResolvedValue(null);
          const payload = { orderId: mockId, status: 'Preparing' };

          const response = await request(app)
            .put('/orders/updateOrderStatus')
            .send(payload)
            .catch(error => {
                console.error('Request error:', error);
                throw error;
              });
    
          expect(response.status).toBe(404);
          expect(response.body.message).toBe('Order not found!');
        });
    
        it('should update order status', async () => {
            const mockId = 'mock-id-123'
            const mockOrder = {
                _id: mockId,
                items: [
                  {
                    itemId: '64a1b23c45d67e8901f23456',
                    quantity: 2,
                  },
                  {
                    itemId: '64a1b23c45d67e8901f23457',
                    quantity: 1,
                  },
                ],
                status: 'Pending',
                userId: '64a1b23c45d67e8901f23458',
              };

            const updatedOrder = { ...mockOrder, status: 'Preparing' };
            Orders.findByIdAndUpdate.mockResolvedValue(updatedOrder);
            const payload = { orderId: mockId, status: 'Preparing' };

            const response = await request(app)
            .put('/orders/updateOrderStatus')
            .send(payload)
            .catch(error => {
                console.error('Request error:', error);
                throw error;
                });
        
            expect(response.status).toBe(200);
            expect(response.body.message).toBe(`Order status updated to Preparing successfully!`);           
            expect(mockWsServer.notifyUsers).toHaveBeenCalledWith(
                updatedOrder.userId, 
                'Order Status Updated',
                expect.any(Object)
            );
        });
    });
});