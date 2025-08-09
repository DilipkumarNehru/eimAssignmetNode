'use strict';

const express = require('express');
const reportsController = require('../controller/reportsController');
const reportsRouter = express.Router();

reportsRouter
    .get('/vendor-purchase-amounts', reportsController.getVendorPurchaseAmounts.bind(reportsController))
    .get('/vendor-invoice-amounts', reportsController.getVendorInvoiceAmounts.bind(reportsController))
    .get('/vendor-comparison', reportsController.getVendorComparison.bind(reportsController))
    .post('/create-sample-data', reportsController.createSampleData.bind(reportsController));

module.exports = reportsRouter;
