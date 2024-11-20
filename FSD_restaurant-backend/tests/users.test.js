const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const bcrypt = require('bcrypt');
const { expect } = chai;
const Users = require('../models/users');

chai.use(chaiHttp);

describe('User Routes', () => {
  let app;

  // Sample user data
  const sampleUser = {
    username: 'testuser',
    password: 'password123'
  };

  const sampleAdmin = {
    username: 'adminuser',
    password: 'adminpass123',
    role: 'ADMIN'
  };

  beforeEach(() => {
    // Reset the express app
    const express = require('express');
    app = express();
    app.use(express.json());
    const usersRouter = require('../routes/users');
    app.use('/api/users', usersRouter);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      // Stub bcrypt hash
      const hashStub = sinon.stub(bcrypt, 'hash').resolves('hashedpassword');
      
      // Stub User.findOne to return null (no existing user)
      sinon.stub(Users, 'findOne').resolves(null);
      
      // Stub user.save
      const saveStub = sinon.stub().resolves();
      sinon.stub(Users.prototype, 'save').callsFake(saveStub);

      const res = await chai
        .request(app)
        .post('/api/users/register')
        .send(sampleUser);

      expect(res).to.have.status(201);
      expect(res.body.message).to.equal('User registered successfully!');
      expect(hashStub.calledOnce).to.be.true;
      expect(saveStub.calledOnce).to.be.true;
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await chai
        .request(app)
        .post('/api/users/register')
        .send({ username: 'testuser' });

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal('Missing required fields');
    });

    it('should return 409 when username already exists', async () => {
      sinon.stub(Users, 'findOne').resolves({ username: 'testuser' });

      const res = await chai
        .request(app)
        .post('/api/users/register')
        .send(sampleUser);

      expect(res).to.have.status(409);
      expect(res.body.message).to.equal('Username already taken');
    });
  });

  describe('POST /login', () => {
    it('should login user successfully with correct credentials', async () => {
      // Stub User.findOne to return a user
      sinon.stub(Users, 'findOne').resolves({
        username: sampleUser.username,
        password: 'hashedpassword',
        role: 'USER'
      });

      // Stub bcrypt compare to return true
      sinon.stub(bcrypt, 'compare').resolves(true);

      const res = await chai
        .request(app)
        .post('/api/users/login')
        .send(sampleUser);

      expect(res).to.have.status(200);
      expect(res.body.message).to.equal('Login successful!');
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await chai
        .request(app)
        .post('/api/users/login')
        .send({ username: 'testuser' });

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal('Missing required fields');
    });

    it('should return 404 when user is not found', async () => {
      sinon.stub(Users, 'findOne').resolves(null);

      const res = await chai
        .request(app)
        .post('/api/users/login')
        .send(sampleUser);

      expect(res).to.have.status(404);
      expect(res.body.message).to.equal('User not found!');
    });

    it('should return 401 when password is incorrect', async () => {
      sinon.stub(Users, 'findOne').resolves({
        username: sampleUser.username,
        password: 'hashedpassword',
        role: 'USER'
      });

      sinon.stub(bcrypt, 'compare').resolves(false);

      const res = await chai
        .request(app)
        .post('/api/users/login')
        .send(sampleUser);

      expect(res).to.have.status(401);
      expect(res.body.message).to.equal('Invalid credentials');
    });
  });

  describe('POST /admin-login', () => {
    it('should login admin successfully with correct credentials', async () => {
      // Stub User.findOne to return an admin user
      sinon.stub(Users, 'findOne').resolves({
        username: sampleAdmin.username,
        password: 'hashedpassword',
        role: 'ADMIN'
      });

      // Stub bcrypt compare to return true
      sinon.stub(bcrypt, 'compare').resolves(true);

      const res = await chai
        .request(app)
        .post('/api/users/admin-login')
        .send(sampleAdmin);

      expect(res).to.have.status(200);
      expect(res.body.message).to.equal('Login successful!');
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await chai
        .request(app)
        .post('/api/users/admin-login')
        .send({ username: 'adminuser' });

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal('Missing required fields');
    });

    it('should return 404 when admin user is not found', async () => {
      sinon.stub(Users, 'findOne').resolves(null);

      const res = await chai
        .request(app)
        .post('/api/users/admin-login')
        .send(sampleAdmin);

      expect(res).to.have.status(404);
      expect(res.body.message).to.equal('User not found!');
    });

    it('should return 401 when admin password is incorrect', async () => {
      sinon.stub(Users, 'findOne').resolves({
        username: sampleAdmin.username,
        password: 'hashedpassword',
        role: 'ADMIN'
      });

      sinon.stub(bcrypt, 'compare').resolves(false);

      const res = await chai
        .request(app)
        .post('/api/users/admin-login')
        .send(sampleAdmin);

      expect(res).to.have.status(401);
      expect(res.body.message).to.equal('Invalid credentials');
    });
  });
});