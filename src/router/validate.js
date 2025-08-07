const express = require('express');
const validateController = require('../controller/validateController');

const router = express.Router();

// POST /api/validate - Validate procurement data against rules
router.post('/', (req, res) => {
    validateController.validateData(req, res);
});

// POST /api/validate/batch - Validate multiple procurement records
router.post('/batch', (req, res) => {
    validateController.validateBatch(req, res);
});

// GET /api/validate/history - Get validation history
router.get('/history', (req, res) => {
    validateController.getValidationHistory(req, res);
});

module.exports = router;
