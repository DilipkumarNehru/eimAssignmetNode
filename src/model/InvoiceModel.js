const mongoose = require('mongoose');
const LoggerHelper = require('../helper/LoggerHelper');

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    poNumber: {
        type: String,
        required: true,
        trim: true
    },
    vendorId: {
        type: String,
        required: true,
        trim: true
    },
    vendorName: {
        type: String,
        required: true,
        trim: true
    },
    invoiceDate: {
        type: Date,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paidAmount: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    outstandingAmount: {
        type: Number,
        required: true,
        min: 0,
        default: function() {
            return this.totalAmount - this.paidAmount;
        }
    },
    currency: {
        type: String,
        required: true,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']
    },
    status: {
        type: String,
        required: true,
        enum: ['draft', 'sent', 'received', 'paid', 'partially_paid', 'overdue', 'cancelled'],
        default: 'draft'
    },
    paymentTerms: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    taxAmount: {
        type: Number,
        min: 0,
        default: 0
    },
    discountAmount: {
        type: Number,
        min: 0,
        default: 0
    },
    items: [{
        itemId: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    paymentHistory: [{
        paymentDate: {
            type: Date,
            required: true
        },
        amountPaid: {
            type: Number,
            required: true,
            min: 0
        },
        paymentMethod: {
            type: String,
            required: true,
            trim: true
        },
        reference: {
            type: String,
            trim: true
        }
    }],
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    collection: 'invoices'
});

// Pre-save middleware to calculate outstanding amount
invoiceSchema.pre('save', function(next) {
    this.outstandingAmount = this.totalAmount - this.paidAmount;
    
    // Update status based on payment
    if (this.paidAmount === 0) {
        this.status = this.status === 'cancelled' ? 'cancelled' : 'received';
    } else if (this.paidAmount >= this.totalAmount) {
        this.status = 'paid';
        this.outstandingAmount = 0;
    } else {
        this.status = 'partially_paid';
    }
    
    next();
});

// Indexes for better query performance
invoiceSchema.index({ vendorId: 1, invoiceDate: -1 });
invoiceSchema.index({ status: 1, dueDate: -1 });
invoiceSchema.index({ poNumber: 1, invoiceDate: -1 });
invoiceSchema.index({ department: 1, invoiceDate: -1 });
invoiceSchema.index({ category: 1, invoiceDate: -1 });

class InvoiceModel {
    constructor() {
        this.logger = new LoggerHelper();
        this.model = mongoose.model('Invoice', invoiceSchema);
    }

    async createInvoice(invoiceData) {
        try {
            const invoice = new this.model(invoiceData);
            const savedInvoice = await invoice.save();
            this.logger.info(`Invoice created: ${savedInvoice.invoiceNumber}`);
            return savedInvoice;
        } catch (err) {
            this.logger.error('Error creating invoice:', err);
            throw err;
        }
    }

    async getInvoices(filters = {}, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const invoices = await this.model
                .find(filters)
                .sort({ invoiceDate: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await this.model.countDocuments(filters);

            return {
                data: invoices,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (err) {
            this.logger.error('Error fetching invoices:', err);
            throw err;
        }
    }

    async getInvoiceById(id) {
        try {
            const invoice = await this.model.findById(id).lean();
            return invoice;
        } catch (err) {
            this.logger.error('Error fetching invoice by ID:', err);
            throw err;
        }
    }

    async updateInvoice(id, updateData) {
        try {
            const updatedInvoice = await this.model
                .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
                .lean();
            
            if (updatedInvoice) {
                this.logger.info(`Invoice updated: ${updatedInvoice.invoiceNumber}`);
            }
            
            return updatedInvoice;
        } catch (err) {
            this.logger.error('Error updating invoice:', err);
            throw err;
        }
    }

    async addPayment(invoiceId, paymentData) {
        try {
            const invoice = await this.model.findById(invoiceId);
            
            if (!invoice) {
                throw new Error('Invoice not found');
            }

            invoice.paymentHistory.push(paymentData);
            invoice.paidAmount += paymentData.amountPaid;
            
            const updatedInvoice = await invoice.save();
            this.logger.info(`Payment added to invoice: ${updatedInvoice.invoiceNumber}`);
            
            return updatedInvoice;
        } catch (err) {
            this.logger.error('Error adding payment to invoice:', err);
            throw err;
        }
    }

    async deleteInvoice(id) {
        try {
            const deletedInvoice = await this.model.findByIdAndDelete(id).lean();
            
            if (deletedInvoice) {
                this.logger.info(`Invoice deleted: ${deletedInvoice.invoiceNumber}`);
            }
            
            return deletedInvoice;
        } catch (err) {
            this.logger.error('Error deleting invoice:', err);
            throw err;
        }
    }

    getModel() {
        return this.model;
    }
}

module.exports = InvoiceModel;
