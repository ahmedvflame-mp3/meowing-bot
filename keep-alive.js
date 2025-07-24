// keep-alive.js
const express = require('express');
const app = express();

// Root endpoint just responds with a simple message
app.get('/', (req, res) => {
  res.send('Bot is alive!');
});

// Listen on port 3000
app.listen(3000, () => {
  console.log('Keep-alive server running on port 3000');
});
