require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Import helpers and middleware
const Database = require('./src/config/database');
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
app.get('/health', async (req, res) => {
  try {
    const dbHealth = Database.isHealthy();
    res.json({ 
      status: 'OK',
      database: dbHealth ? 'Connected' : 'Disconnected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime() 
    });
  } catch (err) {
    res.status(500).json({
      status: 'ERROR',
      database: 'Error',
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
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
const startServer = async () => {
  try {
    // Connect to database
    await Database.connect();
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Procurement API server running on port ${PORT}`);
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Reports: http://localhost:${PORT}/api/reports/dashboard`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

module.exports = app;
