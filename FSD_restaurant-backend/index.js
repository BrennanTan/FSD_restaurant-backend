import express from 'express';
import cors from 'cors';
import http from 'http';
import setupWebSocket from './websocket.js';
import connectDB from './db.js';
import usersRouter from './routes/users.js';
import menuRouter from './routes/menu.js';
import ordersRouter from './routes/orders.js';
import reservationsRouter from './routes/reservations.js';

const app = express();
app.use(cors());
app.use(express.json());
connectDB();

// Create HTTP server and WebSocket server
const server = http.createServer(app);
const wsServer = setupWebSocket(server);

// Routers
app.use('/users', usersRouter);
app.use('/menu', menuRouter(wsServer)); 
app.use('/orders', ordersRouter(wsServer));
app.use('/reservations', reservationsRouter(wsServer));

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
