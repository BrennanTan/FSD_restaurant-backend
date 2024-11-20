import chai from 'chai';
import chaiHttp from 'chai-http';
import { expect } from 'chai';
import sinon from 'sinon';
import mongoose from 'mongoose';
import Reservations from '../models/reservations.js';
import reservationsRouter from '../routes/reservations.js';
import express from 'express';

chai.use(chaiHttp);

describe('Reservation Routes', () => {
  let app;
  let wsServerStub;

  // Mock data
  const sampleReservation = {
    _id: new mongoose.Types.ObjectId(),
    date: '2024-11-20',
    time: '18:00',
    size: 4,
    userId: new mongoose.Types.ObjectId(),
    status: 'Pending'
  };

  beforeEach(() => {
    // Create a stub for the WebSocket server
    wsServerStub = {
      notifyRoles: sinon.stub()
    };

    // Reset the express app with the stubbed WebSocket server
    app = express();
    app.use(express.json());
    app.use(reservationsRouter(mockWsServer));
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('GET /getUserReservations/:userId', () => {
    it('should return user reservations when they exist', async () => {
      const findStub = sinon.stub(Reservations, 'find');
      findStub.returns({
        lean: sinon.stub().returns([sampleReservation])
      });

      const res = await chai
        .request(app)
        .get(`/api/reservations/getUserReservations/${sampleReservation.userId}`);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
      expect(res.body[0]).to.deep.equal(sampleReservation);
    });

    it('should return 404 when no reservations found', async () => {
      const findStub = sinon.stub(Reservations, 'find');
      findStub.returns({
        lean: sinon.stub().returns([])
      });

      const res = await chai
        .request(app)
        .get(`/api/reservations/getUserReservations/${sampleReservation.userId}`);

      expect(res).to.have.status(404);
      expect(res.body.message).to.equal('No reservations found for this user');
    });
  });

  describe('GET /getPendingReservations', () => {
    it('should return pending reservations', async () => {
      sinon.stub(Reservations, 'find').resolves([sampleReservation]);

      const res = await chai
        .request(app)
        .get('/api/reservations/getPendingReservations');

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
      expect(res.body[0]).to.deep.equal(sampleReservation);
    });

    it('should return 404 when no pending reservations', async () => {
      sinon.stub(Reservations, 'find').resolves([]);

      const res = await chai
        .request(app)
        .get('/api/reservations/getPendingReservations');

      expect(res).to.have.status(404);
      expect(res.body.message).to.equal('No pending reservations found!');
    });
  });

  describe('POST /newReservations', () => {
    it('should create a new reservation successfully', async () => {
      const newReservation = {
        date: '2024-11-20',
        time: '19:00',
        size: 2,
        userId: new mongoose.Types.ObjectId()
      };

      const saveStub = sinon.stub().resolves({
        ...newReservation,
        _id: new mongoose.Types.ObjectId()
      });

      sinon.stub(Reservations.prototype, 'save').callsFake(saveStub);

      const res = await chai
        .request(app)
        .post('/api/reservations/newReservations')
        .send(newReservation);

      expect(res).to.have.status(201);
      expect(res.body.message).to.equal('Reservation created successfully!');
      expect(wsServerStub.notifyRoles.calledOnce).to.be.true;
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await chai
        .request(app)
        .post('/api/reservations/newReservations')
        .send({ date: '2024-11-20' });

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal('Missing required fields');
    });
  });

  describe('PUT /updateReservationStatus', () => {
    it('should update reservation status successfully', async () => {
      const updatedReservation = { ...sampleReservation, status: 'Accepted' };
      sinon.stub(Reservations, 'findByIdAndUpdate').resolves(updatedReservation);

      const res = await chai
        .request(app)
        .put('/api/reservations/updateReservationStatus')
        .send({
          reservationId: sampleReservation._id,
          status: 'Accepted'
        });

      expect(res).to.have.status(200);
      expect(res.body.updatedReservation).to.deep.equal(updatedReservation);
      expect(wsServerStub.notifyRoles.calledOnce).to.be.true;
    });

    it('should return 400 for invalid status', async () => {
      const res = await chai
        .request(app)
        .put('/api/reservations/updateReservationStatus')
        .send({
          reservationId: sampleReservation._id,
          status: 'InvalidStatus'
        });

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal('Invalid reservation status');
    });
  });

  describe('PUT /updateReservation', () => {
    it('should update reservation details successfully', async () => {
      const updateData = {
        reservationId: sampleReservation._id,
        date: '2024-11-21',
        time: '20:00',
        size: 6,
        status: 'Accepted'
      };

      const updatedReservation = { ...sampleReservation, ...updateData };
      sinon.stub(Reservations, 'findByIdAndUpdate').resolves(updatedReservation);

      const res = await chai
        .request(app)
        .put('/api/reservations/updateReservation')
        .send(updateData);

      expect(res).to.have.status(200);
      expect(res.body.updatedReservation).to.deep.equal(updatedReservation);
      expect(wsServerStub.notifyRoles.calledOnce).to.be.true;
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await chai
        .request(app)
        .put('/api/reservations/updateReservation')
        .send({
          reservationId: sampleReservation._id,
          date: '2024-11-21'
        });

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal('Missing required fields');
    });
  });
});