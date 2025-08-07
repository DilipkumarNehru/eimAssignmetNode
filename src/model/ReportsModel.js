const PurchaseOrderModel = require('./PurchaseOrderModel');
const InvoiceModel = require('./InvoiceModel');
const LoggerHelper = require('../helper/LoggerHelper');

class ReportsModel {
    constructor() {
        this.logger = new LoggerHelper();
        this.purchaseOrderModel = new PurchaseOrderModel();
        this.invoiceModel = new InvoiceModel();
    }

    async getVendorPurchaseAmounts(filters = {}) {
        try {
            const pipeline = [
                {
                    $match: {
                        status: { $in: ['approved', 'sent', 'received', 'completed'] },
                        ...filters
                    }
                },
                {
                    $group: {
                        _id: {
                            vendorId: '$vendorId',
                            vendorName: '$vendorName'
                        },
                        totalPurchaseAmount: { $sum: '$totalAmount' },
                        totalPurchaseOrders: { $sum: 1 },
                        averagePurchaseAmount: { $avg: '$totalAmount' },
                        categories: { $addToSet: '$category' },
                        departments: { $addToSet: '$department' },
                        lastPurchaseDate: { $max: '$createdDate' },
                        firstPurchaseDate: { $min: '$createdDate' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        vendorId: '$_id.vendorId',
                        vendorName: '$_id.vendorName',
                        totalPurchaseAmount: 1,
                        totalPurchaseOrders: 1,
                        averagePurchaseAmount: { $round: ['$averagePurchaseAmount', 2] },
                        categories: 1,
                        departments: 1,
                        lastPurchaseDate: 1,
                        firstPurchaseDate: 1
                    }
                },
                {
                    $sort: { totalPurchaseAmount: -1 }
                }
            ];

            const results = await this.purchaseOrderModel.getModel().aggregate(pipeline);
            this.logger.info(`Retrieved vendor purchase amounts for ${results.length} vendors`);
            
            return results;
        } catch (err) {
            this.logger.error('Error aggregating vendor purchase amounts:', err);
            throw err;
        }
    }

    async getVendorInvoiceAmounts(filters = {}) {
        try {
            const pipeline = [
                {
                    $match: {
                        status: { $in: ['received', 'paid', 'partially_paid'] },
                        ...filters
                    }
                },
                {
                    $group: {
                        _id: {
                            vendorId: '$vendorId',
                            vendorName: '$vendorName'
                        },
                        totalInvoiceAmount: { $sum: '$totalAmount' },
                        totalPaidAmount: { $sum: '$paidAmount' },
                        totalOutstandingAmount: { $sum: '$outstandingAmount' },
                        totalInvoices: { $sum: 1 },
                        paidInvoices: {
                            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
                        },
                        partiallyPaidInvoices: {
                            $sum: { $cond: [{ $eq: ['$status', 'partially_paid'] }, 1, 0] }
                        },
                        unpaidInvoices: {
                            $sum: { $cond: [{ $eq: ['$status', 'received'] }, 1, 0] }
                        },
                        averageInvoiceAmount: { $avg: '$totalAmount' },
                        categories: { $addToSet: '$category' },
                        departments: { $addToSet: '$department' },
                        lastInvoiceDate: { $max: '$invoiceDate' },
                        firstInvoiceDate: { $min: '$invoiceDate' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        vendorId: '$_id.vendorId',
                        vendorName: '$_id.vendorName',
                        totalInvoiceAmount: 1,
                        totalPaidAmount: 1,
                        totalOutstandingAmount: 1,
                        totalInvoices: 1,
                        paidInvoices: 1,
                        partiallyPaidInvoices: 1,
                        unpaidInvoices: 1,
                        averageInvoiceAmount: { $round: ['$averageInvoiceAmount', 2] },
                        paymentRate: {
                            $round: [
                                {
                                    $cond: [
                                        { $eq: ['$totalInvoiceAmount', 0] },
                                        0,
                                        { $multiply: [{ $divide: ['$totalPaidAmount', '$totalInvoiceAmount'] }, 100] }
                                    ]
                                },
                                2
                            ]
                        },
                        categories: 1,
                        departments: 1,
                        lastInvoiceDate: 1,
                        firstInvoiceDate: 1
                    }
                },
                {
                    $sort: { totalInvoiceAmount: -1 }
                }
            ];

            const results = await this.invoiceModel.getModel().aggregate(pipeline);
            this.logger.info(`Retrieved vendor invoice amounts for ${results.length} vendors`);
            
            return results;
        } catch (err) {
            this.logger.error('Error aggregating vendor invoice amounts:', err);
            throw err;
        }
    }

    async getVendorComparisonReport(filters = {}) {
        try {
            // Get purchase order data
            const purchaseData = await this.getVendorPurchaseAmounts(filters);
            
            // Get invoice data
            const invoiceData = await this.getVendorInvoiceAmounts(filters);

            // Create a comprehensive vendor report
            const vendorMap = new Map();

            // Process purchase data
            purchaseData.forEach(vendor => {
                vendorMap.set(vendor.vendorId, {
                    vendorId: vendor.vendorId,
                    vendorName: vendor.vendorName,
                    purchaseOrders: {
                        totalAmount: vendor.totalPurchaseAmount,
                        totalOrders: vendor.totalPurchaseOrders,
                        averageAmount: vendor.averagePurchaseAmount,
                        categories: vendor.categories,
                        departments: vendor.departments,
                        lastDate: vendor.lastPurchaseDate,
                        firstDate: vendor.firstPurchaseDate
                    },
                    invoices: {
                        totalAmount: 0,
                        totalPaidAmount: 0,
                        totalOutstandingAmount: 0,
                        totalInvoices: 0,
                        paidInvoices: 0,
                        partiallyPaidInvoices: 0,
                        unpaidInvoices: 0,
                        averageAmount: 0,
                        paymentRate: 0,
                        categories: [],
                        departments: [],
                        lastDate: null,
                        firstDate: null
                    }
                });
            });

            // Process invoice data
            invoiceData.forEach(vendor => {
                if (vendorMap.has(vendor.vendorId)) {
                    vendorMap.get(vendor.vendorId).invoices = {
                        totalAmount: vendor.totalInvoiceAmount,
                        totalPaidAmount: vendor.totalPaidAmount,
                        totalOutstandingAmount: vendor.totalOutstandingAmount,
                        totalInvoices: vendor.totalInvoices,
                        paidInvoices: vendor.paidInvoices,
                        partiallyPaidInvoices: vendor.partiallyPaidInvoices,
                        unpaidInvoices: vendor.unpaidInvoices,
                        averageAmount: vendor.averageInvoiceAmount,
                        paymentRate: vendor.paymentRate,
                        categories: vendor.categories,
                        departments: vendor.departments,
                        lastDate: vendor.lastInvoiceDate,
                        firstDate: vendor.firstInvoiceDate
                    };
                } else {
                    vendorMap.set(vendor.vendorId, {
                        vendorId: vendor.vendorId,
                        vendorName: vendor.vendorName,
                        purchaseOrders: {
                            totalAmount: 0,
                            totalOrders: 0,
                            averageAmount: 0,
                            categories: [],
                            departments: [],
                            lastDate: null,
                            firstDate: null
                        },
                        invoices: {
                            totalAmount: vendor.totalInvoiceAmount,
                            totalPaidAmount: vendor.totalPaidAmount,
                            totalOutstandingAmount: vendor.totalOutstandingAmount,
                            totalInvoices: vendor.totalInvoices,
                            paidInvoices: vendor.paidInvoices,
                            partiallyPaidInvoices: vendor.partiallyPaidInvoices,
                            unpaidInvoices: vendor.unpaidInvoices,
                            averageAmount: vendor.averageInvoiceAmount,
                            paymentRate: vendor.paymentRate,
                            categories: vendor.categories,
                            departments: vendor.departments,
                            lastDate: vendor.lastInvoiceDate,
                            firstDate: vendor.firstInvoiceDate
                        }
                    });
                }
            });

            // Convert map to array and add calculated fields
            const vendorReport = Array.from(vendorMap.values()).map(vendor => {
                const poTotal = vendor.purchaseOrders.totalAmount;
                const invoiceTotal = vendor.invoices.totalAmount;
                
                return {
                    ...vendor,
                    summary: {
                        totalSpend: poTotal,
                        totalBilled: invoiceTotal,
                        totalPaid: vendor.invoices.totalPaidAmount,
                        totalOutstanding: vendor.invoices.totalOutstandingAmount,
                        billingRate: poTotal > 0 ? Math.round((invoiceTotal / poTotal) * 100 * 100) / 100 : 0,
                        paymentRate: vendor.invoices.paymentRate,
                        variance: Math.round((poTotal - invoiceTotal) * 100) / 100,
                        variancePercentage: poTotal > 0 ? Math.round(((poTotal - invoiceTotal) / poTotal) * 100 * 100) / 100 : 0
                    }
                };
            });

            // Sort by total spend descending
            vendorReport.sort((a, b) => b.summary.totalSpend - a.summary.totalSpend);

            this.logger.info(`Generated vendor comparison report for ${vendorReport.length} vendors`);
            
            return vendorReport;
        } catch (err) {
            this.logger.error('Error generating vendor comparison report:', err);
            throw err;
        }
    }

    async getSpendAnalyticsSummary(filters = {}) {
        try {
            const [purchaseStats, invoiceStats] = await Promise.all([
                this.getPurchaseOrderStats(filters),
                this.getInvoiceStats(filters)
            ]);

            const summary = {
                purchaseOrders: purchaseStats,
                invoices: invoiceStats,
                summary: {
                    totalCommittedSpend: purchaseStats.totalAmount,
                    totalInvoicedAmount: invoiceStats.totalAmount,
                    totalPaidAmount: invoiceStats.totalPaidAmount,
                    totalOutstandingAmount: invoiceStats.totalOutstandingAmount,
                    overallPaymentRate: invoiceStats.paymentRate,
                    billingEfficiency: purchaseStats.totalAmount > 0 ? 
                        Math.round((invoiceStats.totalAmount / purchaseStats.totalAmount) * 100 * 100) / 100 : 0
                },
                generatedAt: new Date()
            };

            return summary;
        } catch (err) {
            this.logger.error('Error generating spend analytics summary:', err);
            throw err;
        }
    }

    async getPurchaseOrderStats(filters = {}) {
        try {
            const pipeline = [
                { $match: { ...filters } },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$totalAmount' },
                        totalOrders: { $sum: 1 },
                        averageAmount: { $avg: '$totalAmount' },
                        uniqueVendors: { $addToSet: '$vendorId' },
                        statusBreakdown: {
                            $push: {
                                status: '$status',
                                amount: '$totalAmount'
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalAmount: 1,
                        totalOrders: 1,
                        averageAmount: { $round: ['$averageAmount', 2] },
                        uniqueVendors: { $size: '$uniqueVendors' },
                        statusBreakdown: 1
                    }
                }
            ];

            const result = await this.purchaseOrderModel.getModel().aggregate(pipeline);
            return result[0] || {
                totalAmount: 0,
                totalOrders: 0,
                averageAmount: 0,
                uniqueVendors: 0,
                statusBreakdown: []
            };
        } catch (err) {
            this.logger.error('Error getting purchase order stats:', err);
            throw err;
        }
    }

    async getInvoiceStats(filters = {}) {
        try {
            const pipeline = [
                { $match: { ...filters } },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$totalAmount' },
                        totalPaidAmount: { $sum: '$paidAmount' },
                        totalOutstandingAmount: { $sum: '$outstandingAmount' },
                        totalInvoices: { $sum: 1 },
                        averageAmount: { $avg: '$totalAmount' },
                        uniqueVendors: { $addToSet: '$vendorId' },
                        statusBreakdown: {
                            $push: {
                                status: '$status',
                                amount: '$totalAmount'
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalAmount: 1,
                        totalPaidAmount: 1,
                        totalOutstandingAmount: 1,
                        totalInvoices: 1,
                        averageAmount: { $round: ['$averageAmount', 2] },
                        uniqueVendors: { $size: '$uniqueVendors' },
                        paymentRate: {
                            $round: [
                                {
                                    $cond: [
                                        { $eq: ['$totalAmount', 0] },
                                        0,
                                        { $multiply: [{ $divide: ['$totalPaidAmount', '$totalAmount'] }, 100] }
                                    ]
                                },
                                2
                            ]
                        },
                        statusBreakdown: 1
                    }
                }
            ];

            const result = await this.invoiceModel.getModel().aggregate(pipeline);
            return result[0] || {
                totalAmount: 0,
                totalPaidAmount: 0,
                totalOutstandingAmount: 0,
                totalInvoices: 0,
                averageAmount: 0,
                uniqueVendors: 0,
                paymentRate: 0,
                statusBreakdown: []
            };
        } catch (err) {
            this.logger.error('Error getting invoice stats:', err);
            throw err;
        }
    }
}

module.exports = ReportsModel;
