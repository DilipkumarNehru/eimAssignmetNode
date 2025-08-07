const mongoose = require('mongoose');
const LoggerHelper = require('../helper/LoggerHelper');

class Database {
    constructor() {
        this.logger = new LoggerHelper();
        this.isConnected = false;
    }

    async connect() {
        try {
            if (this.isConnected) {
                this.logger.info('Already connected to MongoDB');
                return;
            }

            const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/procurement_db';
            
            const options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            };

            await mongoose.connect(mongoUri, options);
            
            this.isConnected = true;
            this.logger.info(`MongoDB connected successfully to: ${mongoUri}`);

            // Handle connection events
            mongoose.connection.on('error', (err) => {
                this.logger.error('MongoDB connection error:', err);
            });

            mongoose.connection.on('disconnected', () => {
                this.logger.warn('MongoDB disconnected');
                this.isConnected = false;
            });

        } catch (err) {
            this.logger.error('Failed to connect to MongoDB:', err);
            throw err;
        }
    }

    async disconnect() {
        try {
            if (!this.isConnected) {
                return;
            }

            await mongoose.disconnect();
            this.isConnected = false;
            this.logger.info('MongoDB disconnected successfully');
        } catch (err) {
            this.logger.error('Error disconnecting from MongoDB:', err);
            throw err;
        }
    }

    getConnection() {
        return mongoose.connection;
    }

    isHealthy() {
        return this.isConnected && mongoose.connection.readyState === 1;
    }
}

module.exports = new Database();
