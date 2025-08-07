const express = require('express');
const rulesController = require('../controller/rulesController');

const router = express.Router();

// POST /api/rules/load - Load business rules configuration
router.post('/load', (req, res) => {
    rulesController.loadRules(req, res);
});

// GET /api/rules - Get current rules configuration
router.get('/', (req, res) => {
    rulesController.getRules(req, res);
});

// GET /api/rules/:id - Get specific rule by ID
router.get('/:id', (req, res) => {
    rulesController.getRuleById(req, res);
});

// PUT /api/rules/:id - Update specific rule
router.put('/:id', (req, res) => {
    rulesController.updateRule(req, res);
});

// DELETE /api/rules/:id - Delete specific rule
router.delete('/:id', (req, res) => {
    rulesController.deleteRule(req, res);
});

module.exports = router;
