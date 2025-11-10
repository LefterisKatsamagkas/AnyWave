const express = require('express');
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const weatherRoutes = require('./routes/weather');
const authRoutes = require('./routes/auth');
const beachRoutes = require('./routes/beach');

app.use('/api', weatherRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/beaches', beachRoutes);

// Start server
app.listen(port, () => {
  if (port === 5000) {
    console.log(`Server running on http://localhost:${port}!`);
  } else {
    console.log(`Server running on https://anywave.onrender.com/`)
  }
});