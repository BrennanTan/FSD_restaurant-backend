const request = require('supertest');
const express = require('express');

jest.mock('../models/reservations', () => ({
  find: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  deleteMany: jest.fn()
}));

const Reservations = require('../models/reservations');
const createRouter = require('../routes/reservations');

describe('Reservation Routes', () => {
    let app;
    let mockWsServer;

    beforeAll(() => {
    app = express();
    app.use(express.json());

    mockWsServer = {
        notifyRoles: jest.fn()
    };

    app.use('/reservations', createRouter(mockWsServer));
    });

    beforeEach(() => {
    jest.clearAllMocks();
    });

    const mockUserId = 'mock-user-id-123';
    const mockReservation = {
        date: '2024-12-01T00:00:00.000Z', 
        time: '19:00',               
        size: 4,                     
        status: 'Pending',          
        userId: '64f6e2f4e29b3c1a3a5d7f8c'
    };

    describe('GET /getUserReservations/:userId', () => {
        it('should return 404 when no reservations found for the user', async () => {     
            Reservations.find.mockResolvedValue([]);
            
            const response = await request(app)
                .get(`/reservations/getUserReservations/${mockUserId}`)
                .catch((error) => {
                console.error('Request error:', error);
                throw error;
                });
            
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('No reservations found for this user');
        });

        it('should return a user reservations', async () => {          
            Reservations.find.mockResolvedValue([mockReservation]);
            
            const response = await request(app)
                .get(`/reservations/getUserReservations/${mockUserId}`)
                .catch((error) => {
                console.error('Request error:', error);
                throw error;
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toEqual([expect.objectContaining(mockReservation)]);
        });

        it('should handle errors', async () => {
            Reservations.find.mockRejectedValue(new Error('Database error'));

            const response = await request(app).get(`/reservations/getUserReservations/${mockUserId}`);
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error retrieving user reservations');
        });
    });

    describe('GET /getPendingReservations', () => {
        it('should return 404 when no pending reservations are found', async () => {
        Reservations.find.mockResolvedValue([]);

        const response = await request(app).get('/reservations/getPendingReservations');
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('No pending reservations found!');
        expect(Reservations.find).toHaveBeenCalled();
        });

        it('should return pending reservations if they exist', async () => {
        Reservations.find.mockResolvedValue(mockReservation);

        const response = await request(app).get('/reservations/getPendingReservations');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockReservation);
        expect(Reservations.find).toHaveBeenCalled();
        });

        it('should handle errors', async () => {
        Reservations.find.mockRejectedValue(new Error('Database error'));

        const response = await request(app).get('/reservations/getPendingReservations');
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Error retrieving reservations');
        });
    });

    describe('GET /getReservations', () => {
        it('should return 404 when no reservations are found', async () => {
        Reservations.find.mockResolvedValue([]);

        const response = await request(app).get('/reservations/getReservations');
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('No reservations found!');
        expect(Reservations.find).toHaveBeenCalled();
        });

        it('should return reservations if they exist', async () => {
        Reservations.find.mockResolvedValue(mockReservation);

        const response = await request(app).get('/reservations/getReservations');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockReservation);
        expect(Reservations.find).toHaveBeenCalled();
        });

        it('should handle errors', async () => {
        Reservations.find.mockRejectedValue(new Error('Database error'));

        const response = await request(app).get('/reservations/getReservations');
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Error retrieving reservations');
        });
    });
  
    describe('POST /newReservations', () => {
        it('should create a new reservation', async () => {
            const mockCreatedItem = { ...mockReservation, _id: 'mock-id-123' };
            Reservations.create.mockResolvedValue(mockCreatedItem);
          
            const response = await request(app)
              .post('/reservations/newReservations')
              .send(mockReservation)
              .catch(error => {
                console.error('Request error:', error);
                throw error;
              });
            
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Reservation created successfully!');
            expect(Reservations.create).toHaveBeenCalledWith(expect.objectContaining(mockReservation));
            expect(mockWsServer.notifyRoles).toHaveBeenCalledWith(
                'ADMIN',
                'New Reservation Created',
                expect.any(Object)
            );
          });
    
        it('should return 400 if missing required fields', async () => {
            const missingFields = {              
                size: 4,                     
                status: 'Pending',          
                userId: '64f6e2f4e29b3c1a3a5d7f8c'
            };

          const response = await request(app)
            .post('/reservations/newReservations')
            .send(missingFields)
            .catch(error => {
                console.error('Request error:', error);
                throw error;
              });
    
          expect(response.status).toBe(400);
          expect(response.body.message).toBe('Missing required fields');
          expect(Reservations.create).not.toHaveBeenCalled();
        });
    
        it('should handle database errors', async () => {
          Reservations.create.mockRejectedValue(new Error('Database error'));
    
          const response = await request(app)
            .post('/reservations/newReservations')
            .send(mockReservation)
            .catch(error => {
                console.error('Request error:', error);
                throw error;
              });
    
          expect(response.status).toBe(500);
          expect(response.body.message).toBe('Error creating reservation');
        });
    });

    describe('PUT /updateReservationStatus', () => {
        const mockId = 'mock-id-123'
        it('should reject invalid reservation status', async () => {
            const invalidStatus = {
                reservationId: 'mock_123', 
                status: 'INVALID!!!'
            };
    
          const response = await request(app)
            .put('/reservations/updateReservationStatus')
            .send(invalidStatus)
            .catch(error => {
                console.error('Request error:', error);
                throw error;
            });
    
          expect(response.status).toBe(400);
          expect(response.body.message).toBe('Invalid reservation status');
          expect(Reservations.findByIdAndUpdate).not.toHaveBeenCalled();
        });

        it('should return 404 when reservation not found', async () => {
            Reservations.findByIdAndUpdate.mockResolvedValue(null);
            const payload = { reservationId: mockId, status: 'Accepted' };

            const response = await request(app)
            .put('/reservations/updateReservationStatus')
            .send(payload)
            .catch(error => {
                console.error('Request error:', error);
                throw error;
                });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Reservation not found!');
        });

        it('should update reservation status', async () => {
            const updateReservation = { ...mockReservation, status: 'Accepted' };
            Reservations.findByIdAndUpdate.mockResolvedValue(updateReservation);
            const payload = { reservationId: mockId, status: 'Accepted' };

            const response = await request(app)
            .put('/reservations/updateReservationStatus')
            .send(payload)
            .catch(error => {
                console.error('Request error:', error);
                throw error;
                });
        
            expect(response.status).toBe(200);
            expect(response.body.message).toBe(`Reservation status updated to Accepted successfully!`);           
            expect(mockWsServer.notifyRoles).toHaveBeenCalled();
        });
    });

    describe('PUT /updateReservation', () => {
        const mockId = 'mock-id-123';
        const updatedData = {
            reservationId: mockId,
            date: '2025-20-01T00:00:00.000Z', 
            time: '11:00',               
            size: 2,                     
            status: 'Accepted',          
            userId: '64f6e2f4e29b3c1a3a5d7f8c'
        };
    
        it('should update an existing reservation', async () => {
            Reservations.findByIdAndUpdate.mockResolvedValue({ ...updatedData, _id: mockId });

            const response = await request(app)
            .put('/reservations/updateReservation')
            .send(updatedData)
            .catch(error => {
                console.error('Request error:', error);
                throw error;
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Reservation updated successfully!');
            expect(mockWsServer.notifyRoles).toHaveBeenCalledWith(
            'USER',
            'Reservations Details Updated',
            expect.any(Object)
            );
        });

        it('should return 400 if missing required fields', async () => {
            const missingFields = {              
                size: 4,                     
                status: 'Accepted',          
                userId: '64f6e2f4e29b3c1a3a5d7f8c'
            };

          const response = await request(app)
            .put('/reservations/updateReservation')
            .send(missingFields)
            .catch(error => {
                console.error('Request error:', error);
                throw error;
              });
    
          expect(response.status).toBe(400);
          expect(response.body.message).toBe('Missing required fields');
          expect(Reservations.findByIdAndUpdate).not.toHaveBeenCalled();
        });

        it('should reject invalid reservation status', async () => {
            const invalidStatus = {
                reservationId: '123',
                date: '2025-12-01T00:00:00.000Z', 
                time: '12:00',               
                size: 3,                     
                status: 'INVALID!!!',          
                userId: '64f6e2f4e29b3c1a3a5d7f8c'
            };
    
            const response = await request(app)
            .put('/reservations/updateReservation')
            .send(invalidStatus)
            .catch(error => {
                console.error('Request error:', error);
                throw error;
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid reservation status');
            expect(Reservations.findByIdAndUpdate).not.toHaveBeenCalled();
        });
    
        it('should return 404 when reservation not found', async () => {
            Reservations.findByIdAndUpdate.mockResolvedValue(null);

            const response = await request(app)
            .put('/reservations/updateReservationStatus')
            .send(updatedData)
            .catch(error => {
                console.error('Request error:', error);
                throw error;
                });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Reservation not found!');
        });

      });

});