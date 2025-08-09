'use strict';

const PurchaseOrder = require('../model/purchaseOrder.model');
const Invoice = require('../model/invoice.model');
const output = require('../helper/api');

class ReportsController {
    constructor() {
        // Initialize any required properties
    }

    // Aggregate total purchase amounts per vendor
    async getVendorPurchaseAmounts(req, res) {
        try {
            const { startDate, endDate, department, status } = req.query;
            
            // Build match conditions
            const matchConditions = {};
            if (startDate && endDate) {
                matchConditions.orderDate = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }
            if (department) matchConditions.department = department;
            if (status) matchConditions.status = status;

            const aggregationPipeline = [
                { $match: matchConditions },
                {
                    $group: {
                        _id: {
                            vendorId: "$vendorId",
                            vendorName: "$vendorName"
                        },
                        totalPurchaseAmount: { $sum: "$totalAmount" },
                        totalOrders: { $sum: 1 },
                        averageOrderAmount: { $avg: "$totalAmount" },
                        categories: { $addToSet: "$category" },
                        departments: { $addToSet: "$department" },
                        lastOrderDate: { $max: "$orderDate" },
                        firstOrderDate: { $min: "$orderDate" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        vendorId: "$_id.vendorId",
                        vendorName: "$_id.vendorName",
                        totalPurchaseAmount: { $round: ["$totalPurchaseAmount", 2] },
                        totalOrders: 1,
                        averageOrderAmount: { $round: ["$averageOrderAmount", 2] },
                        categories: 1,
                        departments: 1,
                        lastOrderDate: 1,
                        firstOrderDate: 1
                    }
                },
                { $sort: { totalPurchaseAmount: -1 } }
            ];

            const results = await PurchaseOrder.aggregate(aggregationPipeline);

            const response = {
                summary: {
                    totalVendors: results.length,
                    totalPurchaseAmount: results.reduce((sum, vendor) => sum + vendor.totalPurchaseAmount, 0),
                    reportGeneratedAt: new Date().toISOString()
                },
                vendors: results
            };

            return output.ok(req, res, response, "Vendor purchase amounts aggregated successfully", 0);

        } catch (error) {
            console.error('Error aggregating vendor purchase amounts:', error);
            return output.serverError(req, res, error);
        }
    }

    // Aggregate invoice paid amounts per vendor
    async getVendorInvoiceAmounts(req, res) {
        try {
            const { startDate, endDate, department, status } = req.query;
            
            // Build match conditions
            const matchConditions = {};
            if (startDate && endDate) {
                matchConditions.invoiceDate = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }
            if (department) matchConditions.department = department;
            if (status) matchConditions.status = status;

            const aggregationPipeline = [
                { $match: matchConditions },
                {
                    $group: {
                        _id: {
                            vendorId: "$vendorId",
                            vendorName: "$vendorName"
                        },
                        totalInvoiceAmount: { $sum: "$totalAmount" },
                        totalPaidAmount: { $sum: "$paidAmount" },
                        totalOutstandingAmount: { $sum: "$outstandingAmount" },
                        totalInvoices: { $sum: 1 },
                        paidInvoices: {
                            $sum: { $cond: [{ $eq: ["$status", "Paid"] }, 1, 0] }
                        },
                        pendingInvoices: {
                            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] }
                        },
                        overdueInvoices: {
                            $sum: { $cond: [{ $eq: ["$status", "Overdue"] }, 1, 0] }
                        },
                        averageInvoiceAmount: { $avg: "$totalAmount" },
                        categories: { $addToSet: "$category" },
                        departments: { $addToSet: "$department" },
                        lastInvoiceDate: { $max: "$invoiceDate" },
                        firstInvoiceDate: { $min: "$invoiceDate" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        vendorId: "$_id.vendorId",
                        vendorName: "$_id.vendorName",
                        totalInvoiceAmount: { $round: ["$totalInvoiceAmount", 2] },
                        totalPaidAmount: { $round: ["$totalPaidAmount", 2] },
                        totalOutstandingAmount: { $round: ["$totalOutstandingAmount", 2] },
                        totalInvoices: 1,
                        paidInvoices: 1,
                        pendingInvoices: 1,
                        overdueInvoices: 1,
                        averageInvoiceAmount: { $round: ["$averageInvoiceAmount", 2] },
                        paymentPercentage: {
                            $round: [
                                {
                                    $cond: [
                                        { $eq: ["$totalInvoiceAmount", 0] },
                                        0,
                                        { $multiply: [{ $divide: ["$totalPaidAmount", "$totalInvoiceAmount"] }, 100] }
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
                { $sort: { totalInvoiceAmount: -1 } }
            ];

            const results = await Invoice.aggregate(aggregationPipeline);

            const response = {
                summary: {
                    totalVendors: results.length,
                    totalInvoiceAmount: results.reduce((sum, vendor) => sum + vendor.totalInvoiceAmount, 0),
                    totalPaidAmount: results.reduce((sum, vendor) => sum + vendor.totalPaidAmount, 0),
                    totalOutstandingAmount: results.reduce((sum, vendor) => sum + vendor.totalOutstandingAmount, 0),
                    reportGeneratedAt: new Date().toISOString()
                },
                vendors: results
            };

            return output.ok(req, res, response, "Vendor invoice amounts aggregated successfully", 0);

        } catch (error) {
            console.error('Error aggregating vendor invoice amounts:', error);
            return output.serverError(req, res, error);
        }
    }

    // Vendor-wise report showing PO and Invoice totals
    async getVendorComparison(req, res) {
        try {
            const { startDate, endDate, department } = req.query;
            
            // Build match conditions for both collections
            const matchConditions = {};
            if (startDate && endDate) {
                matchConditions.date = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }
            if (department) matchConditions.department = department;

            // Aggregate Purchase Orders
            const poAggregation = [
                { 
                    $match: { 
                        ...matchConditions,
                        ...(matchConditions.date && { orderDate: matchConditions.date })
                    }
                },
                {
                    $group: {
                        _id: "$vendorId",
                        vendorName: { $first: "$vendorName" },
                        totalPOAmount: { $sum: "$totalAmount" },
                        totalPOs: { $sum: 1 },
                        avgPOAmount: { $avg: "$totalAmount" }
                    }
                }
            ];

            // Aggregate Invoices
            const invoiceAggregation = [
                { 
                    $match: { 
                        ...matchConditions,
                        ...(matchConditions.date && { invoiceDate: matchConditions.date })
                    }
                },
                {
                    $group: {
                        _id: "$vendorId",
                        vendorName: { $first: "$vendorName" },
                        totalInvoiceAmount: { $sum: "$totalAmount" },
                        totalPaidAmount: { $sum: "$paidAmount" },
                        totalOutstanding: { $sum: "$outstandingAmount" },
                        totalInvoices: { $sum: 1 }
                    }
                }
            ];

            const [poResults, invoiceResults] = await Promise.all([
                PurchaseOrder.aggregate(poAggregation),
                Invoice.aggregate(invoiceAggregation)
            ]);

            // Combine results
            const vendorMap = new Map();

            // Process PO results
            poResults.forEach(po => {
                vendorMap.set(po._id, {
                    vendorId: po._id,
                    vendorName: po.vendorName,
                    purchaseOrders: {
                        totalAmount: Math.round(po.totalPOAmount * 100) / 100,
                        totalOrders: po.totalPOs,
                        averageAmount: Math.round(po.avgPOAmount * 100) / 100
                    },
                    invoices: {
                        totalAmount: 0,
                        totalPaidAmount: 0,
                        totalOutstanding: 0,
                        totalInvoices: 0
                    }
                });
            });

            // Process Invoice results
            invoiceResults.forEach(invoice => {
                const vendor = vendorMap.get(invoice._id) || {
                    vendorId: invoice._id,
                    vendorName: invoice.vendorName,
                    purchaseOrders: {
                        totalAmount: 0,
                        totalOrders: 0,
                        averageAmount: 0
                    },
                    invoices: {
                        totalAmount: 0,
                        totalPaidAmount: 0,
                        totalOutstanding: 0,
                        totalInvoices: 0
                    }
                };

                vendor.invoices = {
                    totalAmount: Math.round(invoice.totalInvoiceAmount * 100) / 100,
                    totalPaidAmount: Math.round(invoice.totalPaidAmount * 100) / 100,
                    totalOutstanding: Math.round(invoice.totalOutstanding * 100) / 100,
                    totalInvoices: invoice.totalInvoices
                };

                vendorMap.set(invoice._id, vendor);
            });

            // Convert to array and add variance calculations
            const results = Array.from(vendorMap.values()).map(vendor => {
                const poTotal = vendor.purchaseOrders.totalAmount;
                const invoiceTotal = vendor.invoices.totalAmount;
                const variance = poTotal - invoiceTotal;
                const variancePercentage = poTotal > 0 ? Math.round((variance / poTotal) * 100 * 100) / 100 : 0;

                return {
                    ...vendor,
                    variance: {
                        amount: Math.round(variance * 100) / 100,
                        percentage: variancePercentage
                    },
                    metrics: {
                        invoiceToPoRatio: poTotal > 0 ? Math.round((invoiceTotal / poTotal) * 100 * 100) / 100 : 0,
                        paymentPercentage: invoiceTotal > 0 ? Math.round((vendor.invoices.totalPaidAmount / invoiceTotal) * 100 * 100) / 100 : 0
                    }
                };
            }).sort((a, b) => b.purchaseOrders.totalAmount - a.purchaseOrders.totalAmount);

            const response = {
                summary: {
                    totalVendors: results.length,
                    totalPOAmount: results.reduce((sum, v) => sum + v.purchaseOrders.totalAmount, 0),
                    totalInvoiceAmount: results.reduce((sum, v) => sum + v.invoices.totalAmount, 0),
                    totalPaidAmount: results.reduce((sum, v) => sum + v.invoices.totalPaidAmount, 0),
                    totalOutstanding: results.reduce((sum, v) => sum + v.invoices.totalOutstanding, 0),
                    reportGeneratedAt: new Date().toISOString()
                },
                vendors: results
            };

            return output.ok(req, res, response, "Vendor comparison report generated successfully", 0);

        } catch (error) {
            console.error('Error generating vendor comparison report:', error);
            return output.serverError(req, res, error);
        }
    }

    // Create sample data for testing
    
    async createSampleData(req, res) {
        try {
        let samplePOs = [];
        let sampleInvoices = [];

        // Check if request body exists and has data
        if (req.body && Object.keys(req.body).length > 0 && 
            (req.body.purchaseOrders || req.body.invoices)) {
            
            // Use data from request body
            samplePOs = req.body.purchaseOrders || [];
            sampleInvoices = req.body.invoices || [];
            
            console.log('Using sample data from request body');
            
        } else {
            
            // Use hardcoded sample data if no body or empty body
            samplePOs = [
                {
                    poNumber: "PO-2024-001",
                    vendorId: "VENDOR_001",
                    vendorName: "TechCorp Solutions",
                    department: "IT",
                    category: "Software",
                    totalAmount: 25000,
                    status: "Approved",
                    orderDate: new Date("2024-01-15"),
                    expectedDelivery: new Date("2024-02-15"),
                    items: [
                        { itemId: "ITEM_001", description: "Software License", quantity: 10, unitPrice: 2000, totalPrice: 20000 },
                        { itemId: "ITEM_002", description: "Support Package", quantity: 1, unitPrice: 5000, totalPrice: 5000 }
                    ]
                },
                {
                    poNumber: "PO-2024-002",
                    vendorId: "VENDOR_002",
                    vendorName: "Office Supplies Pro",
                    department: "Operations",
                    category: "Office Supplies",
                    totalAmount: 3500,
                    status: "Delivered",
                    orderDate: new Date("2024-01-20"),
                    expectedDelivery: new Date("2024-02-05"),
                    items: [
                        { itemId: "ITEM_003", description: "Office Chairs", quantity: 15, unitPrice: 150, totalPrice: 2250 },
                        { itemId: "ITEM_004", description: "Desk Accessories", quantity: 25, unitPrice: 50, totalPrice: 1250 }
                    ]
                },
                {
                    poNumber: "PO-2024-003",
                    vendorId: "VENDOR_003",
                    vendorName: "Industrial Equipment LLC",
                    department: "Manufacturing",
                    category: "Equipment",
                    totalAmount: 85000,
                    status: "Approved",
                    orderDate: new Date("2024-02-01"),
                    expectedDelivery: new Date("2024-03-15"),
                    items: [
                        { itemId: "ITEM_005", description: "Industrial Printer", quantity: 2, unitPrice: 35000, totalPrice: 70000 },
                        { itemId: "ITEM_006", description: "Maintenance Kit", quantity: 3, unitPrice: 5000, totalPrice: 15000 }
                    ]
                }
            ];

            sampleInvoices = [
                {
                    invoiceNumber: "INV-2024-001",
                    poNumber: "PO-2024-001",
                    vendorId: "VENDOR_001",
                    vendorName: "TechCorp Solutions",
                    invoiceDate: new Date("2024-02-01"),
                    dueDate: new Date("2024-03-02"),
                    totalAmount: 25000,
                    paidAmount: 25000,
                    outstandingAmount: 0,
                    status: "Paid",
                    department: "IT",
                    category: "Software",
                    paymentDate: new Date("2024-02-28")
                },
                {
                    invoiceNumber: "INV-2024-002",
                    poNumber: "PO-2024-002",
                    vendorId: "VENDOR_002",
                    vendorName: "Office Supplies Pro",
                    invoiceDate: new Date("2024-02-10"),
                    dueDate: new Date("2024-03-12"),
                    totalAmount: 3500,
                    paidAmount: 1750,
                    outstandingAmount: 1750,
                    status: "Pending",
                    department: "Operations",
                    category: "Office Supplies"
                },
                {
                    invoiceNumber: "INV-2024-003",
                    poNumber: "PO-2024-003",
                    vendorId: "VENDOR_003",
                    vendorName: "Industrial Equipment LLC",
                    invoiceDate: new Date("2024-03-20"),
                    dueDate: new Date("2024-04-19"),
                    totalAmount: 85000,
                    paidAmount: 0,
                    outstandingAmount: 85000,
                    status: "Pending",
                    department: "Manufacturing",
                    category: "Equipment"
                }
            ];
            
            console.log('Using hardcoded sample data');
        }

        // Validate data before insertion
        if (!Array.isArray(samplePOs) || !Array.isArray(sampleInvoices)) {
            return output.invalid(req, res, 'Purchase orders and invoices must be arrays');
        }

        // Clear existing data and insert new sample data
        // await PurchaseOrder.deleteMany({});
        // await Invoice.deleteMany({});

        // Insert sample data
        const insertedPOs = await PurchaseOrder.insertMany(samplePOs);
        const insertedInvoices = await Invoice.insertMany(sampleInvoices);

        // Calculate totals for response
        const totalPOAmount = samplePOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
        const totalInvoiceAmount = sampleInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
        const totalPaidAmount = sampleInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
        const totalOutstandingAmount = sampleInvoices.reduce((sum, inv) => sum + (inv.outstandingAmount || 0), 0);

        const response = {
            message: "Sample data created successfully",
            dataSource: req.body && Object.keys(req.body).length > 0 ? "request_body" : "hardcoded",
            statistics: {
                purchaseOrders: insertedPOs.length,
                invoices: insertedInvoices.length,
                totalPOAmount: Math.round(totalPOAmount * 100) / 100,
                totalInvoiceAmount: Math.round(totalInvoiceAmount * 100) / 100,
                totalPaidAmount: Math.round(totalPaidAmount * 100) / 100,
                totalOutstandingAmount: Math.round(totalOutstandingAmount * 100) / 100
            },
            vendors: [...new Set([
                ...samplePOs.map(po => `${po.vendorId}: ${po.vendorName}`),
                ...sampleInvoices.map(inv => `${inv.vendorId}: ${inv.vendorName}`)
            ])],
            insertedData: {
                purchaseOrderIds: insertedPOs.map(po => po._id),
                invoiceIds: insertedInvoices.map(inv => inv._id)
            }
        };

        return output.created(req, res, response, "Sample data created successfully");

    } catch (error) {
        console.error('Error creating sample data:', error);
        return output.serverError(req, res, error);
    }
}

}

module.exports = new ReportsController();
