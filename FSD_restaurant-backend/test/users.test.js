const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const Users = require('../models/users');
const createRouter = require('../routes/users');

jest.mock('../models/users');

describe('User Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.use('/users', createRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    it('should successfully register a new user', async () => {
      Users.findOne.mockResolvedValue(null);
      
      Users.create.mockResolvedValue({
        username: 'testuser',
        password: await bcrypt.hash('password123', 10)
      });

      const response = await request(app)
        .post('/users/register')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.message).toBe('User registered successfully!');
      expect(Users.findOne).toHaveBeenCalledWith({ username: 'testuser' });
    });

    it('should return 400 if username or password is missing', async () => {
      const response = await request(app)
        .post('/users/register')
        .send({username: 'testuser'});

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Missing required fields');
    });

    it('should return 409 if username already exists', async () => {
      Users.findOne.mockResolvedValue({
        username: 'existinguser',
        password: 'hashedpassword'
      });

      const response = await request(app)
        .post('/users/register')
        .send({
          username: 'existinguser',
          password: 'password123'
        });

      expect(response.statusCode).toBe(409);
      expect(response.body.message).toBe('Username already taken');
    });


    it('should handle database error', async () => {
      Users.findOne.mockRejectedValue(new Error('Database connection error'));

      const response = await request(app)
        .post('/users/register')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Error registering user');
    });
  });

  describe('POST /login', () => {
    it('should successfully login a user with correct info', async () => {
      const mockUser = {
        username: 'testuser',
        password: await bcrypt.hash('password123', 10),
        role: 'USER'
      };

      console.log(mockUser);
      Users.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/users/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('Login successful!');
    });

    it('should return 400 if username or password is missing', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({username: 'testuser'});

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Missing required fields');
    });

    it('should return 404 if user is not found', async () => {
      Users.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/users/login')
        .send({
          username: 'nonexistentuser',
          password: 'password123'
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('User not found!');
    });

    it('should return 401 if password is incorrect', async () => {
      const mockUser = {
        username: 'testuser',
        password: await bcrypt.hash('correctpassword', 10),
        role: 'USER'
      };
      Users.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/users/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should handle database error', async () => {
      Users.findOne.mockRejectedValue(new Error('Database connection error'));

      const response = await request(app)
        .post('/users/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Error during login');
    });
  });

  describe('POST /admin-login', () => {
    it('should successfully login an admin with correct info', async () => {
      const mockAdmin = {
        username: 'admin',
        password: await bcrypt.hash('adminpassword', 10),
        role: 'ADMIN'
      };
      Users.findOne.mockResolvedValue(mockAdmin);

      const response = await request(app)
        .post('/users/admin-login')
        .send({
          username: 'admin',
          password: 'adminpassword'
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('Login successful!');
    });

    it('should return 404 if admin user is not found', async () => {
      Users.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/users/admin-login')
        .send({
          username: 'admin',
          password: 'adminpassword'
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('User not found!');
    });

    it('should return 401 if password is incorrect', async () => {
      const mockAdmin = {
        username: 'admin',
        password: await bcrypt.hash('adminpassword', 10),
        role: 'ADMIN'
      };
      Users.findOne.mockResolvedValue(mockAdmin);

      const response = await request(app)
        .post('/users/admin-login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should handle database error', async () => {
      Users.findOne.mockRejectedValue(new Error('Database connection error'));

      const response = await request(app)
        .post('/users/admin-login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Error during login');
    });

  });
});    