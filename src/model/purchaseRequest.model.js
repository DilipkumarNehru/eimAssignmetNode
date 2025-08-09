'use strict';

const { procurementDB } = require('../config/database');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const purchaseRequestSchema = new Schema({
    "prNumber": { type: String, required: true, unique: true },
    "requesterName": { type: String, required: true },
    "requesterId": { type: String, required: true },
    "department": { type: String, required: true },
    "category": { type: String, required: true },
    "totalAmount": { type: Number, required: true },
    "currency": { type: String, default: "USD" },
    "status": { type: String, default: "Draft" },
    "urgency": { type: String, default: "Medium" },
    "approvalType": { type: String },
    "approvalRequired": { type: Boolean, default: false },
    "requiredDeliveryDate": { type: Date, required: true },
    "deliveryDays": { type: Number },
    "items": [{
        "itemId": { type: String, required: true },
        "description": { type: String, required: true },
        "quantity": { type: Number, required: true },
        "unitPrice": { type: Number, required: true },
        "totalPrice": { type: Number, required: true }
    }],
    "businessJustification": { type: String, required: true },
    "processedAt": { type: Date },
    "approvedAt": { type: Date },
    "urgencySetAt": { type: Date },
    "rulesApplied": { type: Number, default: 0 },
    "createdAt": { type: Date, default: Date.now },
    "updatedAt": { type: Date, default: Date.now }
});

// purchaseRequestSchema.index({ prNumber: 1 });
purchaseRequestSchema.index({ status: 1 });
purchaseRequestSchema.index({ department: 1 });
purchaseRequestSchema.index({ totalAmount: 1 });

module.exports = procurementDB.model('purchaserequest', purchaseRequestSchema);
