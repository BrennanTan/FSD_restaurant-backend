const express = require('express');
const cors = require('cors');
const http = require('http');
const setupWebSocket = require('./websocket');

const connectDB = require('./db');
const usersRouter = require('./routes/users');
const menuRouter = require('./routes/menu');
const ordersRouter = require('./routes/orders');
const reservationsRouter = require('./routes/reservations');

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
  
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});