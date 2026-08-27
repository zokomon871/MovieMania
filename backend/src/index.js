require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const channelRoutes = require('./routes/channelRoutes');
const { startCronJobs } = require('./cron');
const { collectAndSyncData } = require('./services/dataCollector');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/channels', require('./routes/channelRoutes'));
app.use('/api/movies', require('./routes/movieRoutes'));

// Database connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/streamhub';
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('[MongoDB] Connected successfully');
    
    // Start Cron Jobs after DB connection is established
    startCronJobs();

    // Optionally trigger a manual sync on startup if needed (uncomment for first run testing)
    // collectAndSyncData();
  })
  .catch(err => {
    console.error('[MongoDB] Connection error:', err);
  });

// Start Server
app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
});
