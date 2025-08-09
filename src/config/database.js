'use strict';

const mongoose = require('mongoose');

mongoose.set("strictQuery", true);

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 20,
    minPoolSize: 5,
    socketTimeoutMS: 60000,
    connectTimeoutMS: 30000,
    serverSelectionTimeoutMS: 30000,
    waitQueueTimeoutMS: 5000,
};

// Get connection strings with proper fallbacks
const procurementDBUri = process.env.PROCUREMENT_DB || 'mongodb://localhost:27017/procurement_db';
const reportsDBUri = process.env.REPORTS_DB || 'mongodb://localhost:27017/reports_db';

// Validate connection strings
if (!procurementDBUri.startsWith('mongodb://') && !procurementDBUri.startsWith('mongodb+srv://')) {
    console.error('Invalid PROCUREMENT_DB connection string format');
    process.exit(1);
}

if (!reportsDBUri.startsWith('mongodb://') && !reportsDBUri.startsWith('mongodb+srv://')) {
    console.error('Invalid REPORTS_DB connection string format');
    process.exit(1);
}

// Create connections
const procurementDB = mongoose.createConnection(procurementDBUri, options);
const reportsDB = mongoose.createConnection(reportsDBUri, options);

// Event handlers
procurementDB.on('error', (err) => {
    console.error('Procurement DB connection error:', err.message);
});

reportsDB.on('error', (err) => {
    console.error('Reports DB connection error:', err.message);
});

procurementDB.once('open', () => {
    console.log('Connected to Procurement DB');
});

reportsDB.once('open', () => {
    console.log('Connected to Reports DB');
});

module.exports = { procurementDB, reportsDB };
