'use strict';

const { reportsDB } = require('../config/database');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const invoiceSchema = new Schema({
    "invoiceNumber": { type: String, required: true, unique: true },
    "poNumber": { type: String, required: true },
    "vendorId": { type: String, required: true },
    "vendorName": { type: String, required: true },
    "invoiceDate": { type: Date, required: true },
    "dueDate": { type: Date, required: true },
    "totalAmount": { type: Number, required: true },
    "paidAmount": { type: Number, default: 0 },
    "outstandingAmount": { type: Number, required: true },
    "currency": { type: String, default: "USD" },
    "status": { type: String, required: true },
    "department": { type: String, required: true },
    "category": { type: String, required: true },
    "paymentDate": { type: Date },
    "createdAt": { type: Date, default: Date.now },
    "updatedAt": { type: Date, default: Date.now }
});

invoiceSchema.index({ vendorId: 1, invoiceDate: -1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ department: 1 });

module.exports = reportsDB.model('invoice', invoiceSchema);
