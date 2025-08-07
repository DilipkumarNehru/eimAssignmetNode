const express = require('express');
const rulesRouter = require('./rules');
const validateRouter = require('./validate');
const reportsRouter = require('./reports');

const router = express.Router();

// API Routes
router.use('/api/rules', rulesRouter);
router.use('/api/validate', validateRouter);
router.use('/api/reports', reportsRouter);

// Root endpoint
router.get('/', (req, res) => {
    res.json({
        message: 'Procurement Business Rules API - MVC Architecture with MongoDB',
        version: '2.0.0',
        architecture: 'MVC with Class-based Controllers and MongoDB Aggregation',
        endpoints: {
            // Rules endpoints
            'POST /api/rules/load': 'Load business rules configuration',
            'GET /api/rules': 'Get current rules configuration',
            'GET /api/rules/:id': 'Get specific rule by ID',
            'PUT /api/rules/:id': 'Update specific rule',
            'DELETE /api/rules/:id': 'Delete specific rule',
            
            // Validation endpoints
            'POST /api/validate': 'Validate procurement data against rules',
            'POST /api/validate/batch': 'Batch validate procurement data',
            'GET /api/validate/history': 'Get validation history',
            
            // Reports endpoints (NEW)
            'GET /api/reports/vendor-purchase-amounts': 'Aggregate total purchase amounts per vendor',
            'GET /api/reports/vendor-invoice-amounts': 'Aggregate invoice paid amounts per vendor',
            'GET /api/reports/vendor-comparison': 'Vendor-wise report showing PO and Invoice totals',
            'GET /api/reports/spend-summary': 'Overall spend analytics summary',
            'GET /api/reports/dashboard': 'Dashboard with key metrics',
            
            // System endpoints
            'GET /health': 'Health check endpoint'
        },
        database: 'MongoDB',
        features: [
            'Business Rules Engine',
            'Data Validation',
            'MongoDB Aggregation Reports',
            'Vendor Spend Analysis',
            'Invoice Payment Tracking',
            'Purchase Order Management'
        ]
    });
});

module.exports = router;
