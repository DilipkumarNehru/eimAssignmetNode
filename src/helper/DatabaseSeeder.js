const Database = require('../config/database');
const PurchaseOrderModel = require('../models/PurchaseOrderModel');
const InvoiceModel = require('../models/InvoiceModel');
const LoggerHelper = require('./LoggerHelper');

class DatabaseSeeder {
    constructor() {
        this.logger = new LoggerHelper();
        this.purchaseOrderModel = new PurchaseOrderModel();
        this.invoiceModel = new InvoiceModel();
    }

    async seedDatabase() {
        try {
            this.logger.info('Starting database seeding...');

            // Connect to database
            await Database.connect();

            // Clear existing data
            await this.clearCollections();

            // Seed sample data
            const vendors = await this.createVendors();
            const purchaseOrders = await this.seedPurchaseOrders(vendors);
            await this.seedInvoices(purchaseOrders, vendors);

            this.logger.info('Database seeding completed successfully');

        } catch (err) {
            this.logger.error('Error seeding database:', err);
            throw err;
        }
    }

    async clearCollections() {
        try {
            await this.purchaseOrderModel.getModel().deleteMany({});
            await this.invoiceModel.getModel().deleteMany({});
            this.logger.info('Cleared existing collections');
        } catch (err) {
            this.logger.error('Error clearing collections:', err);
            throw err;
        }
    }

    createVendors() {
        return [
            { id: 'VENDOR_001', name: 'TechCorp Solutions Inc' },
            { id: 'VENDOR_002', name: 'Office Supplies Pro' },
            { id: 'VENDOR_003', name: 'Industrial Equipment LLC' },
            { id: 'VENDOR_004', name: 'Software Solutions Group' },
            { id: 'VENDOR_005', name: 'Global Manufacturing Co' },
            { id: 'VENDOR_006', name: 'Professional Services Ltd' },
            { id: 'VENDOR_007', name: 'Hardware Specialists Inc' },
            { id: 'VENDOR_008', name: 'Consulting Partners LLC' }
        ];
    }

    async seedPurchaseOrders(vendors) {
        try {
            const departments = ['IT', 'Finance', 'Operations', 'HR', 'Marketing', 'Sales'];
            const categories = ['Software', 'Hardware', 'Office Supplies', 'Consulting', 'Equipment', 'Services'];
            const statuses = ['approved', 'sent', 'received', 'completed'];
            const purchaseOrders = [];

            for (let i = 1; i <= 50; i++) {
                const vendor = vendors[Math.floor(Math.random() * vendors.length)];
                const department = departments[Math.floor(Math.random() * departments.length)];
                const category = categories[Math.floor(Math.random() * categories.length)];
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                
                const baseAmount = Math.floor(Math.random() * 50000) + 1000; // $1,000 to $51,000
                const itemCount = Math.floor(Math.random() * 5) + 1; // 1-5 items
                
                const items = [];
                let totalAmount = 0;

                for (let j = 1; j <= itemCount; j++) {
                    const quantity = Math.floor(Math.random() * 10) + 1;
                    const unitPrice = Math.floor(Math.random() * 1000) + 50;
                    const itemTotal = quantity * unitPrice;
                    
                    items.push({
                        itemId: `ITEM_${i}_${j}`,
                        description: `${category} Item ${j}`,
                        quantity: quantity,
                        unitPrice: unitPrice,
                        totalPrice: itemTotal
                    });
                    
                    totalAmount += itemTotal;
                }

                const createdDate = new Date();
                createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 365)); // Within last year

                const po = {
                    poNumber: `PO-${String(i).padStart(4, '0')}`,
                    vendorId: vendor.id,
                    vendorName: vendor.name,
                    department: department,
                    category: category,
                    totalAmount: totalAmount,
                    currency: 'USD',
                    status: status,
                    createdDate: createdDate,
                    expectedDelivery: new Date(createdDate.getTime() + (30 * 24 * 60 * 60 * 1000)), // 30 days later
                    items: items,
                    approvedBy: `Manager_${department}`,
                    notes: `Purchase order for ${category} items`
                };

                purchaseOrders.push(po);
            }

            const createdOrders = await this.purchaseOrderModel.getModel().insertMany(purchaseOrders);
            this.logger.info(`Created ${createdOrders.length} purchase orders`);
            
            return createdOrders;

        } catch (err) {
            this.logger.error('Error seeding purchase orders:', err);
            throw err;
        }
    }

    async seedInvoices(purchaseOrders, vendors) {
        try {
            const invoiceStatuses = ['received', 'paid', 'partially_paid'];
            const paymentTerms = ['Net 30', 'Net 60', '2/10 Net 30', 'Due on Receipt'];
            const paymentMethods = ['Bank Transfer', 'Check', 'Credit Card', 'ACH'];
            const invoices = [];

            // Create invoices for 70% of purchase orders
            const ordersToInvoice = purchaseOrders.slice(0, Math.floor(purchaseOrders.length * 0.7));

            for (let i = 0; i < ordersToInvoice.length; i++) {
                const po = ordersToInvoice[i];
                const status = invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)];
                
                const invoiceDate = new Date(po.createdDate);
                invoiceDate.setDate(invoiceDate.getDate() + Math.floor(Math.random() * 45) + 5); // 5-50 days after PO

                const dueDate = new Date(invoiceDate);
                dueDate.setDate(dueDate.getDate() + 30); // 30 days after invoice

                const totalAmount = po.totalAmount + (Math.floor(Math.random() * 1000) - 500); // Small variance
                const taxAmount = Math.floor(totalAmount * 0.08); // 8% tax
                const discountAmount = Math.random() > 0.8 ? Math.floor(totalAmount * 0.05) : 0; // 5% discount 20% of time

                let paidAmount = 0;
                const paymentHistory = [];

                if (status === 'paid') {
                    paidAmount = totalAmount;
                    paymentHistory.push({
                        paymentDate: new Date(invoiceDate.getTime() + (Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000)),
                        amountPaid: totalAmount,
                        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                        reference: `PAY_${String(i + 1).padStart(4, '0')}`
                    });
                } else if (status === 'partially_paid') {
                    paidAmount = Math.floor(totalAmount * (0.3 + Math.random() * 0.4)); // 30-70% paid
                    paymentHistory.push({
                        paymentDate: new Date(invoiceDate.getTime() + (Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)),
                        amountPaid: paidAmount,
                        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                        reference: `PAY_${String(i + 1).padStart(4, '0')}_PARTIAL`
                    });
                }

                const invoice = {
                    invoiceNumber: `INV-${String(i + 1).padStart(4, '0')}`,
                    poNumber: po.poNumber,
                    vendorId: po.vendorId,
                    vendorName: po.vendorName,
                    invoiceDate: invoiceDate,
                    dueDate: dueDate,
                    totalAmount: totalAmount,
                    paidAmount: paidAmount,
                    outstandingAmount: totalAmount - paidAmount,
                    currency: po.currency,
                    status: status,
                    paymentTerms: paymentTerms[Math.floor(Math.random() * paymentTerms.length)],
                    department: po.department,
                    category: po.category,
                    taxAmount: taxAmount,
                    discountAmount: discountAmount,
                    items: po.items.map(item => ({
                        ...item,
                        unitPrice: item.unitPrice + (Math.floor(Math.random() * 20) - 10), // Small price variance
                        totalPrice: item.quantity * (item.unitPrice + (Math.floor(Math.random() * 20) - 10))
                    })),
                    paymentHistory: paymentHistory,
                    notes: `Invoice for ${po.poNumber}`
                };

                invoices.push(invoice);
            }

            const createdInvoices = await this.invoiceModel.getModel().insertMany(invoices);
            this.logger.info(`Created ${createdInvoices.length} invoices`);

        } catch (err) {
            this.logger.error('Error seeding invoices:', err);
            throw err;
        }
    }
}

// Self-executing function to seed database when file is run directly
if (require.main === module) {
    const seeder = new DatabaseSeeder();
    seeder.seedDatabase()
        .then(() => {
            console.log('Database seeding completed successfully!');
            process.exit(0);
        })
        .catch((err) => {
            console.error('Database seeding failed:', err);
            process.exit(1);
        });
}

module.exports = DatabaseSeeder;
