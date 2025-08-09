'use strict';

const { reportsDB } = require('../config/database');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const purchaseOrderSchema = new Schema({
    "poNumber": { type: String, required: true, unique: true },
    "vendorId": { type: String, required: true },
    "vendorName": { type: String, required: true },
    "department": { type: String, required: true },
    "category": { type: String, required: true },
    "totalAmount": { type: Number, required: true },
    "currency": { type: String, default: "USD" },
    "status": { type: String, required: true },
    "orderDate": { type: Date, default: Date.now },
    "expectedDelivery": { type: Date, required: true },
    "items": [{
        "itemId": { type: String, required: true },
        "description": { type: String, required: true },
        "quantity": { type: Number, required: true },
        "unitPrice": { type: Number, required: true },
        "totalPrice": { type: Number, required: true }
    }],
    "createdAt": { type: Date, default: Date.now },
    "updatedAt": { type: Date, default: Date.now }
});

purchaseOrderSchema.index({ vendorId: 1, orderDate: -1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ department: 1 });

module.exports = reportsDB.model('purchaseorder', purchaseOrderSchema);
