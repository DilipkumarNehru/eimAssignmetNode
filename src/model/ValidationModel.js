const LoggerHelper = require('../helper/LoggerHelper');

class ValidationModel {
    constructor() {
        this.logger = new LoggerHelper();
        // In-memory storage (in production, use database)
        this.validationHistory = [];
    }

    async saveValidationResult(validationResult) {
        try {
            const record = {
                id: this.generateId(),
                ...validationResult,
                createdAt: new Date().toISOString()
            };
            
            this.validationHistory.push(record);
            
            // Keep only last 1000 records
            if (this.validationHistory.length > 1000) {
                this.validationHistory = this.validationHistory.slice(-1000);
            }
            
            return record;
        } catch (err) {
            this.logger.error('Error saving validation result:', err);
            throw err;
        }
    }

    async saveBatchValidationResult(batchSummary, batchResults) {
        try {
            const record = {
                id: this.generateId(),
                type: 'batch',
                batchSummary,
                batchResults,
                createdAt: new Date().toISOString()
            };
            
            this.validationHistory.push(record);
            
            return record;
        } catch (err) {
            this.logger.error('Error saving batch validation result:', err);
            throw err;
        }
    }

    async getValidationHistory(page = 1, limit = 10, status = null) {
        try {
            let filteredHistory = [...this.validationHistory];
            
            if (status) {
                filteredHistory = filteredHistory.filter(record => {
                    if (record.summary && record.summary.overallStatus) {
                        return record.summary.overallStatus.toLowerCase() === status.toLowerCase();
                    }
                    if (record.batchSummary && record.batchSummary.overallStatus) {
                        return record.batchSummary.overallStatus.toLowerCase() === status.toLowerCase();
                    }
                    return false;
                });
            }
            
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedResults = filteredHistory
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(startIndex, endIndex);
            
            return {
                data: paginatedResults,
                pagination: {
                    page,
                    limit,
                    total: filteredHistory.length,
                    pages: Math.ceil(filteredHistory.length / limit)
                }
            };
        } catch (err) {
            this.logger.error('Error getting validation history:', err);
            throw err;
        }
    }

    async getValidationStats() {
        try {
            const total = this.validationHistory.length;
            const passed = this.validationHistory.filter(record => {
                if (record.summary && record.summary.overallStatus === 'PASSED') return true;
                if (record.batchSummary && record.batchSummary.overallStatus === 'PASSED') return true;
                return false;
            }).length;
            
            return {
                totalValidations: total,
                passedValidations: passed,
                failedValidations: total - passed,
                successRate: total > 0 ? ((passed / total) * 100).toFixed(2) : 0,
                lastValidation: total > 0 ? this.validationHistory[total - 1].createdAt : null
            };
        } catch (err) {
            this.logger.error('Error getting validation stats:', err);
            throw err;
        }
    }

    generateId() {
        return `VAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

module.exports = ValidationModel;
