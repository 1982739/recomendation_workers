const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { createJob, getJob, heartbeat } = require('./controllers/jobController');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.get('/heartbeat', heartbeat);
app.post('/job', createJob);
app.get('/job/:id', getJob);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
JobsMaster API running on port ${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
Endpoints:
   - POST   /job
   - GET    /job/:id
   - GET    /heartbeat
  `);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  process.exit(0);
});