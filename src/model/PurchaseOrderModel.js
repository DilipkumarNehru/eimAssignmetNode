const mongoose = require('mongoose');
const LoggerHelper = require('../helper/LoggerHelper');

const purchaseOrderSchema = new mongoose.Schema({
    poNumber: {
        type: String,
        required: true,
        unique: true,
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
    totalAmount: {
        type: Number,
        required: true,
        min: 0
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
        enum: ['draft', 'approved', 'sent', 'received', 'completed', 'cancelled'],
        default: 'draft'
    },
    createdDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    expectedDelivery: {
        type: Date,
        required: true
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
    approvedBy: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    collection: 'purchase_orders'
});

// Indexes for better query performance
purchaseOrderSchema.index({ vendorId: 1, createdDate: -1 });
purchaseOrderSchema.index({ status: 1, createdDate: -1 });
purchaseOrderSchema.index({ department: 1, createdDate: -1 });
purchaseOrderSchema.index({ category: 1, createdDate: -1 });

class PurchaseOrderModel {
    constructor() {
        this.logger = new LoggerHelper();
        this.model = mongoose.model('PurchaseOrder', purchaseOrderSchema);
    }

    async createPurchaseOrder(orderData) {
        try {
            const purchaseOrder = new this.model(orderData);
            const savedOrder = await purchaseOrder.save();
            this.logger.info(`Purchase order created: ${savedOrder.poNumber}`);
            return savedOrder;
        } catch (err) {
            this.logger.error('Error creating purchase order:', err);
            throw err;
        }
    }

    async getPurchaseOrders(filters = {}, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const orders = await this.model
                .find(filters)
                .sort({ createdDate: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await this.model.countDocuments(filters);

            return {
                data: orders,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (err) {
            this.logger.error('Error fetching purchase orders:', err);
            throw err;
        }
    }

    async getPurchaseOrderById(id) {
        try {
            const order = await this.model.findById(id).lean();
            return order;
        } catch (err) {
            this.logger.error('Error fetching purchase order by ID:', err);
            throw err;
        }
    }

    async updatePurchaseOrder(id, updateData) {
        try {
            const updatedOrder = await this.model
                .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
                .lean();
            
            if (updatedOrder) {
                this.logger.info(`Purchase order updated: ${updatedOrder.poNumber}`);
            }
            
            return updatedOrder;
        } catch (err) {
            this.logger.error('Error updating purchase order:', err);
            throw err;
        }
    }

    async deletePurchaseOrder(id) {
        try {
            const deletedOrder = await this.model.findByIdAndDelete(id).lean();
            
            if (deletedOrder) {
                this.logger.info(`Purchase order deleted: ${deletedOrder.poNumber}`);
            }
            
            return deletedOrder;
        } catch (err) {
            this.logger.error('Error deleting purchase order:', err);
            throw err;
        }
    }

    getModel() {
        return this.model;
    }
}

module.exports = PurchaseOrderModel;
