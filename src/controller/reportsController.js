const ReportsModel = require('../model/ReportsModel');
const ResponseHelper = require('../helper/ResponseHelper');
const LoggerHelper = require('../helper/LoggerHelper');

class ReportsController {
    constructor() {
        this.reportsModel = new ReportsModel();
        this.responseHelper = new ResponseHelper();
        this.logger = new LoggerHelper();
    }

    async getVendorPurchaseAmounts(req, res) {
        try {
            this.logger.info('Fetching vendor purchase amounts report');

            // Extract filters from query parameters
            const filters = this.buildFilters(req.query);
            
            const results = await this.reportsModel.getVendorPurchaseAmounts(filters);

            return this.responseHelper.success(res, {
                report: 'vendor_purchase_amounts',
                totalVendors: results.length,
                data: results,
                filters: filters,
                generatedAt: new Date()
            });

        } catch (err) {
            this.logger.error('Error fetching vendor purchase amounts:', err);
            return this.responseHelper.serverError(res, 
                'Failed to generate vendor purchase amounts report', 
                err.message
            );
        }
    }

    async getVendorInvoiceAmounts(req, res) {
        try {
            this.logger.info('Fetching vendor invoice amounts report');

            const filters = this.buildFilters(req.query);
            
            const results = await this.reportsModel.getVendorInvoiceAmounts(filters);

            return this.responseHelper.success(res, {
                report: 'vendor_invoice_amounts',
                totalVendors: results.length,
                data: results,
                filters: filters,
                generatedAt: new Date()
            });

        } catch (err) {
            this.logger.error('Error fetching vendor invoice amounts:', err);
            return this.responseHelper.serverError(res, 
                'Failed to generate vendor invoice amounts report', 
                err.message
            );
        }
    }

    async getVendorComparisonReport(req, res) {
        try {
            this.logger.info('Generating vendor comparison report');

            const filters = this.buildFilters(req.query);
            
            const results = await this.reportsModel.getVendorComparisonReport(filters);

            // Calculate summary statistics
            const totalVendors = results.length;
            const totalSpend = results.reduce((sum, vendor) => sum + vendor.summary.totalSpend, 0);
            const totalBilled = results.reduce((sum, vendor) => sum + vendor.summary.totalBilled, 0);
            const totalPaid = results.reduce((sum, vendor) => sum + vendor.summary.totalPaid, 0);
            const totalOutstanding = results.reduce((sum, vendor) => sum + vendor.summary.totalOutstanding, 0);

            const reportSummary = {
                totalVendors,
                totalSpend: Math.round(totalSpend * 100) / 100,
                totalBilled: Math.round(totalBilled * 100) / 100,
                totalPaid: Math.round(totalPaid * 100) / 100,
                totalOutstanding: Math.round(totalOutstanding * 100) / 100,
                overallBillingRate: totalSpend > 0 ? Math.round((totalBilled / totalSpend) * 100 * 100) / 100 : 0,
                overallPaymentRate: totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100 * 100) / 100 : 0
            };

            return this.responseHelper.success(res, {
                report: 'vendor_comparison_report',
                summary: reportSummary,
                data: results,
                filters: filters,
                generatedAt: new Date()
            });

        } catch (err) {
            this.logger.error('Error generating vendor comparison report:', err);
            return this.responseHelper.serverError(res, 
                'Failed to generate vendor comparison report', 
                err.message
            );
        }
    }

    async getSpendAnalyticsSummary(req, res) {
        try {
            this.logger.info('Generating spend analytics summary');

            const filters = this.buildFilters(req.query);
            
            const results = await this.reportsModel.getSpendAnalyticsSummary(filters);

            return this.responseHelper.success(res, {
                report: 'spend_analytics_summary',
                data: results,
                filters: filters
            });

        } catch (err) {
            this.logger.error('Error generating spend analytics summary:', err);
            return this.responseHelper.serverError(res, 
                'Failed to generate spend analytics summary', 
                err.message
            );
        }
    }

    async getDashboard(req, res) {
        try {
            this.logger.info('Generating dashboard data');

            const filters = this.buildFilters(req.query);
            
            const [vendorComparison, spendSummary] = await Promise.all([
                this.reportsModel.getVendorComparisonReport(filters),
                this.reportsModel.getSpendAnalyticsSummary(filters)
            ]);

            // Get top 10 vendors by spend
            const topVendors = vendorComparison.slice(0, 10);

            const dashboard = {
                summary: spendSummary.summary,
                topVendors: topVendors.map(vendor => ({
                    vendorId: vendor.vendorId,
                    vendorName: vendor.vendorName,
                    totalSpend: vendor.summary.totalSpend,
                    paymentRate: vendor.summary.paymentRate,
                    outstandingAmount: vendor.summary.totalOutstanding
                })),
                metrics: {
                    totalVendors: vendorComparison.length,
                    vendorsWithOutstanding: vendorComparison.filter(v => v.summary.totalOutstanding > 0).length,
                    highestSpendVendor: vendorComparison[0] || null,
                    averagePaymentRate: vendorComparison.length > 0 ? 
                        Math.round(vendorComparison.reduce((sum, v) => sum + v.summary.paymentRate, 0) / vendorComparison.length * 100) / 100 : 0
                },
                filters: filters,
                generatedAt: new Date()
            };

            return this.responseHelper.success(res, dashboard);

        } catch (err) {
            this.logger.error('Error generating dashboard data:', err);
            return this.responseHelper.serverError(res, 
                'Failed to generate dashboard data', 
                err.message
            );
        }
    }

    buildFilters(queryParams) {
        const filters = {};

        // Date range filters
        if (queryParams.startDate || queryParams.endDate) {
            const dateFilter = {};
            if (queryParams.startDate) {
                dateFilter.$gte = new Date(queryParams.startDate);
            }
            if (queryParams.endDate) {
                dateFilter.$lte = new Date(queryParams.endDate);
            }
            filters.createdDate = dateFilter;
        }

        // Vendor filter
        if (queryParams.vendorId) {
            filters.vendorId = queryParams.vendorId;
        }

        // Department filter
        if (queryParams.department) {
            filters.department = queryParams.department;
        }

        // Category filter
        if (queryParams.category) {
            filters.category = queryParams.category;
        }

        // Status filter
        if (queryParams.status) {
            filters.status = queryParams.status;
        }

        // Amount range filters
        if (queryParams.minAmount || queryParams.maxAmount) {
            const amountFilter = {};
            if (queryParams.minAmount) {
                amountFilter.$gte = parseFloat(queryParams.minAmount);
            }
            if (queryParams.maxAmount) {
                amountFilter.$lte = parseFloat(queryParams.maxAmount);
            }
            filters.totalAmount = amountFilter;
        }

        return filters;
    }
}

module.exports = new ReportsController();
