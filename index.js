const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Buffer to store user IDs
let userIdBuffer = [];

// Function to send messages to users
async function sendMessage(
  messageText, 
  accessToken // Removed unused parameters for simplicity
) {
  try {
    const response = await axios.post(
      'https://api.line.me/v2/bot/message/broadcast',
      {
        messages: [
          {
            type: 'text',
            text: messageText,
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 20000,
      }
    );

    console.log('Message sent successfully', response.data);
  } catch (error) {
    console.error('Failed to send message', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      config: error.config,
    });
    throw error;
  }
}

// POST API endpoint for sending messages
app.post('/sendMessage', async (req, res) => {
  const { messageText, accessToken } = req.body;

  if (!messageText || !accessToken) {
    return res.status(400).json({ error: 'messageText and accessToken are required' });
  }

  try {
    await sendMessage(messageText, accessToken);
    res.status(200).json({ success: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});

// Webhook GET endpoint - returns user IDs in buffer
app.get('/webhook', (req, res) => {
  console.log("Returning stored user IDs:", userIdBuffer);
  res.json(userIdBuffer); // Send the buffer as JSON response
});

app.post('/webhook', (req, res) => {
  res.sendStatus(200); // Respond early to LINE
  const events = req.body.events;
  events.forEach(async (event) => {
    if (event.type === 'message' && event.source.type === 'user') {
      const userId = event.source.userId;
      console.log('LINE User ID:', userId);
      if (!userIdBuffer.includes(userId)) {
        userIdBuffer.push(userId);
      }
      const accessToken = process.env.LINE_ACCESS_TOKEN; 
      await sendMessage(`Hello, user ${userId}!`, accessToken);
    }
  });
});

// Simple route for testing
app.get("/home", (req, res) => {
  console.log("Hi");
  res.send("Welcome");
});

app.get("/sendMessage", (req, res) => {
  console.log("Msg");
  res.send("Welcome");
});

// Start the HTTP server
const port = process.env.PORT || 3000; // Use PORT environment variable
app.listen(port, () => {
  console.log(`Listening on port ${port} with HTTP`);
});
