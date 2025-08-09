'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

// Import routers
const prRouter = require('./src/router/pr.router');
const reportsRouter = require('./src/router/reports.router');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/pr', prRouter);
app.use('/api/reports', reportsRouter);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Procurement API - Business Rules & Reporting',
        version: '1.0.0',
        endpoints: {
            'POST /api/pr/processPR': 'Process Purchase Request with business rules',
            'GET /api/pr/getPR/:id': 'Get Purchase Request by ID',
            'GET /api/pr/getAllPRs': 'Get all Purchase Requests with filters',
            'PUT /api/pr/updatePR/:id': 'Update Purchase Request',
            'DELETE /api/pr/deletePR/:id': 'Delete Purchase Request',
            'GET /api/reports/vendor-purchase-amounts': 'Aggregate vendor purchase amounts',
            'GET /api/reports/vendor-invoice-amounts': 'Aggregate vendor invoice amounts',
            'GET /api/reports/vendor-comparison': 'Vendor comparison report (PO vs Invoice)',
            'POST /api/reports/create-sample-data': 'Create sample data for testing'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Procurement API server running on port ${PORT}`);
    console.log(`Assignment 1: http://localhost:${PORT}/api/pr`);
    console.log(`Assignment 2: http://localhost:${PORT}/api/reports`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
