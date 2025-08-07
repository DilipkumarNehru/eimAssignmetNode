const express = require('express');
const rulesRouter = require('./rules');
const validateRouter = require('./validate');

const router = express.Router();

// API Routes
router.use('/api/rules', rulesRouter);
router.use('/api/validate', validateRouter);

// Root endpoint
router.get('/', (req, res) => {
    res.json({
        message: 'Procurement Business Rules API - MVC Architecture',
        version: '2.0.0',
        architecture: 'MVC with Class-based Controllers',
        endpoints: {
            'POST /api/rules/load': 'Load business rules configuration',
            'GET /api/rules': 'Get current rules configuration',
            'GET /api/rules/:id': 'Get specific rule by ID',
            'PUT /api/rules/:id': 'Update specific rule',
            'DELETE /api/rules/:id': 'Delete specific rule',
            'POST /api/validate': 'Validate procurement data against rules',
            'POST /api/validate/batch': 'Batch validate procurement data',
            'GET /api/validate/history': 'Get validation history',
            'GET /health': 'Health check endpoint'
        }
    });
});

module.exports = router;
