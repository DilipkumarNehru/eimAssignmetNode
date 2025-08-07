const express = require('express');
const reportsController = require('../controller/reportsController');

const router = express.Router();

// GET /api/reports/vendor-purchase-amounts - Aggregate total purchase amounts per vendor
router.get('/vendor-purchase-amounts', (req, res) => {
    reportsController.getVendorPurchaseAmounts(req, res);
});

// GET /api/reports/vendor-invoice-amounts - Aggregate invoice paid amounts per vendor  
router.get('/vendor-invoice-amounts', (req, res) => {
    reportsController.getVendorInvoiceAmounts(req, res);
});

// GET /api/reports/vendor-comparison - Vendor-wise report showing PO and Invoice totals
router.get('/vendor-comparison', (req, res) => {
    reportsController.getVendorComparisonReport(req, res);
});

// GET /api/reports/spend-summary - Overall spend analytics summary
router.get('/spend-summary', (req, res) => {
    reportsController.getSpendAnalyticsSummary(req, res);
});

// GET /api/reports/dashboard - Dashboard with key metrics
router.get('/dashboard', (req, res) => {
    reportsController.getDashboard(req, res);
});

module.exports = router;
