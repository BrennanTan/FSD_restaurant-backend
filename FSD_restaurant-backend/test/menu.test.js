const request = require('supertest');
const express = require('express');

jest.mock('../models/menuItems', () => ({
  find: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  deleteMany: jest.fn()
}));

const MenuItems = require('../models/menuItems');
const createRouter = require('../routes/menu');

describe('Menu Routes', () => {
  let app;
  let mockWsServer;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    mockWsServer = {
      notifyRoles: jest.fn()
    };

    app.use('/menu', createRouter(mockWsServer));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /getMenu', () => {
    it('should return 404 when no menu items exist', async () => {
      MenuItems.find.mockResolvedValue([]);

      const response = await request(app).get('/menu/getMenu');
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('No menu items found!');
      expect(MenuItems.find).toHaveBeenCalled();
    });

    it('should return menu items when they exist', async () => {
      const mockMenuItems = [{
        name: 'Test Item',
        category: 'Test Category',
        description: 'Test Description',
        price: 9.99,
        image: 'test.jpg'
      }];

      MenuItems.find.mockResolvedValue(mockMenuItems);

      const response = await request(app).get('/menu/getMenu');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMenuItems);
      expect(MenuItems.find).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      MenuItems.find.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/menu/getMenu');
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error retrieving menu items');
    });
  });

  describe('POST /newMenuItem', () => {
    it('should create a new menu item with valid data', async () => {
        const menuData = {
          name: 'New Item',
          category: 'New Category',
          description: 'New Description',
          price: 12.99,
          image: 'new.jpg'
        };

        const response = await request(app)
          .post('/menu/newMenuItem')
          .send(menuData)
          .catch(error => {
            console.error('Request error:', error);
            throw error;
          });
        
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Menu item added successfully!');
        expect(MenuItems.create).toHaveBeenCalledWith(expect.objectContaining(menuData));
      });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/menu/newMenuItem')
        .send({ name: 'Incomplete Item' })
        .catch(error => {
            console.error('Request error:', error);
            throw error;
          });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Missing required fields');
      expect(MenuItems.create).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const menuData = {
        name: 'New Item',
        category: 'New Category',
        description: 'New Description',
        price: 12.99,
        image: 'new.jpg'
      };

      MenuItems.create.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/menu/newMenuItem')
        .send(menuData)
        .catch(error => {
            console.error('Request error:', error);
            throw error;
          });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error adding menu item');
    });
  });

  describe('PUT /updateMenuItem', () => {
    const mockId = 'mock-id-123';
    const updateData = {
      itemId: mockId,
      name: 'Updated Item',
      category: 'Updated Category',
      description: 'Updated Description',
      price: 14.99,
      image: 'updated.jpg',
      available: false
    };

    it('should update an existing menu item', async () => {
      MenuItems.findById.mockResolvedValue({ _id: mockId });
      MenuItems.findByIdAndUpdate.mockResolvedValue({ ...updateData, _id: mockId });

      const response = await request(app)
        .put('/menu/updateMenuItem')
        .send(updateData)
        .catch(error => {
            console.error('Request error:', error);
            throw error;
          });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Menu item updated successfully!');
      expect(mockWsServer.notifyRoles).toHaveBeenCalledWith(
        'USER',
        'Item unavailable',
        expect.any(Object)
      );
    });

    it('should return 404 when item does not exist', async () => {
      MenuItems.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/menu/updateMenuItem')
        .send({ itemId: 'nonexistent-id' })
        .catch(error => {
            console.error('Request error:', error);
            throw error;
          });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Menu item not found!');
    });

    it('should return 400 when itemId is missing', async () => {
      const response = await request(app)
        .put('/menu/updateMenuItem')
        .send({ name: 'No ID Item' })
        .catch(error => {
            console.error('Request error:', error);
            throw error;
          });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Missing item ID');
      expect(MenuItems.findById).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /deleteMenuItem', () => {
    const mockId = 'mock-id-123';

    it('should delete an existing menu item', async () => {
      MenuItems.findByIdAndDelete.mockResolvedValue({ _id: mockId });

      const response = await request(app)
        .delete('/menu/deleteMenuItem')
        .send({ itemId: mockId })
        .catch(error => {
            console.error('Request error:', error);
            throw error;
          });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Menu item deleted successfully!');
      expect(MenuItems.findByIdAndDelete).toHaveBeenCalledWith(mockId);
    });

    it('should return 404 when item does not exist', async () => {
      MenuItems.findByIdAndDelete.mockResolvedValue(null);

      const response = await request(app)
        .delete('/menu/deleteMenuItem')
        .send({ itemId: 'nonexistent-id' })
        .catch(error => {
            console.error('Request error:', error);
            throw error;
          });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Menu item not found!');
    });

    it('should return 400 when itemId is missing', async () => {
      const response = await request(app)
        .delete('/menu/deleteMenuItem')
        .send({})
        .catch(error => {
            console.error('Request error:', error);
            throw error;
          });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Missing item ID');
      expect(MenuItems.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      MenuItems.findByIdAndDelete.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/menu/deleteMenuItem')
        .send({ itemId: mockId })
        .catch(error => {
            console.error('Request error:', error);
            throw error;
          });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error deleting menu item');
    });
  });
});