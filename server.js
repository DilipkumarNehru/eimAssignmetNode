const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Import helpers and middleware
const LoggerHelper = require('./src/helper/LoggerHelper');
const errorHandler = require('./src/middleware/errorHandler');

// Import routes
const routes = require('./src/router');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize logger
const logger = new LoggerHelper();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { 
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Routes
app.use('/', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime() 
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Procurement Rules API server running on port ${PORT}`);
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
