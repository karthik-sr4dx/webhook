const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const https = require('https');
const path = require('path');

// Load SSL certificates
const privateKey = fs.readFileSync(path.resolve(__dirname, 'server.key'), 'utf8');
const certificate = fs.readFileSync(path.resolve(__dirname, 'server.cert'), 'utf8');
const credentials = { key: privateKey, cert: certificate };

const app = express();
app.use(bodyParser.json());

// Buffer to store user IDs
let userIdBuffer = [];

// Webhook GET endpoint - returns user IDs in buffer
app.get('/webhook', (req, res) => {
  console.log("Returning stored user IDs:", userIdBuffer);
  res.json(userIdBuffer); // Send the buffer as JSON response
});

// Webhook POST endpoint
app.post('/webhook', (req, res) => {
  const events = req.body.events;

  events.forEach(event => {
    if (event.type === 'message' && event.source.type === 'user') {
      const userId = event.source.userId;
      console.log('LINE User ID:', userId);

      // Add the userId to the buffer
      if (!userIdBuffer.includes(userId)) {
        userIdBuffer.push(userId);
      }
    }
  });

  res.sendStatus(200);
});

// Start the HTTPS server
const httpsPort = process.env.PORT || 3000; // Use PORT environment variable
const httpsServer = https.createServer(credentials, app);
httpsServer.listen(httpsPort, () => {
  console.log(`Listening on port ${httpsPort} with HTTPS`);
});
