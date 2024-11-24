const WebSocket = require('ws');

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });
  
  // Store client connections with their userId/role
  const clients = new Map();

  wss.on('connection', (ws) => {
    console.log('New client connected');

    // Handle client authentication/registration
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'register') {
          // Store client info
          clients.set(ws, {
            userId: data.userId,
            role: data.role
          });
          console.log(`Client registered - userId: ${data.userId}, role: ${data.role}`);
        }
      } catch (error) {
        console.error('WebSocket error:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected');
    });
  });

return {
  // Send to specific user(s)
  notifyUsers: (userIds, type, data) => {
    if (!Array.isArray(userIds)) {
      userIds = [userIds]; // Convert single userId to array
    }
    
    for (const [client, info] of clients.entries()) {
      if (userIds.includes(info.userId)) {
        client.send(JSON.stringify({
          type,
          ...data
        }));
      }
    }
  },

  // Send to users with specific role(s)
  notifyRoles: (roles, type, data) => {
    if (!Array.isArray(roles)) {
      roles = [roles]; // Convert single role to array
    }

    for (const [client, info] of clients.entries()) {
      if (roles.includes(info.role)) {
        client.send(JSON.stringify({
          type,
          ...data
        }));
      }
    }
  },

  // Broadcast to all connected clients
  broadcast: (type, data) => {
    for (const [client] of clients.entries()) {
        client.send(JSON.stringify({
          type,
          ...data
        }));
    }
  }
};
}

module.exports = setupWebSocket;