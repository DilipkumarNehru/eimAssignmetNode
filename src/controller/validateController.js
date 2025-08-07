const { validationModel, rulesModel } = require('../model');
const RuleEngineService = require('../services/RuleEngineService');
const ResponseHelper = require('../helper/ResponseHelper');
const ValidationHelper = require('../helper/ValidationHelper');
const LoggerHelper = require('../helper/LoggerHelper');

class ValidateController {
    constructor() {
        this.validationModel = validationModel;  // Use shared instance
        this.rulesModel = rulesModel;            // Use shared instance
        this.ruleEngineService = new RuleEngineService();
        this.responseHelper = new ResponseHelper();
        this.validationHelper = new ValidationHelper();
        this.logger = new LoggerHelper();
    }

    // ... rest of your methods remain the same
    async validateData(req, res) {
        try {
            this.logger.info('Starting procurement data validation');
            
            // Validate input data
            const validationResult = this.validationHelper.validateInputData(req.body);
            if (!validationResult.isValid) {
                return this.responseHelper.badRequest(res, 
                    'Invalid input data', 
                    validationResult.errors
                );
            }
            
            // Get current business rules - this will now work!
            const businessRules = await this.rulesModel.getActiveRules();
            
            if (!businessRules || businessRules.length === 0) {
                return this.responseHelper.badRequest(res, 
                    'No business rules configured',
                    'Please load business rules configuration first using POST /api/rules/load'
                );
            }
            
            // Initialize rule engine and evaluate
            this.ruleEngineService.setRules(businessRules);
            const validationResults = await this.ruleEngineService.evaluate(
                validationResult.data.procurement_data, 
                validationResult.data.options
            );
            
            // Save validation result
            await this.validationModel.saveValidationResult(validationResults);
            
            this.logger.info(`Validation completed: ${validationResults.summary.overallStatus}`);
            
            return this.responseHelper.success(res, validationResults);
            
        } catch (err) {
            this.logger.error('Error during validation:', err);
            return this.responseHelper.serverError(res, 
                'Validation failed', 
                err.message
            );
        }
    }

    async validateBatch(req, res) {
        try {
            this.logger.info('Starting batch procurement data validation');
            
            const validationResult = this.validationHelper.validateBatchData(req.body);
            if (!validationResult.isValid) {
                return this.responseHelper.badRequest(res, 
                    'Invalid batch input data', 
                    validationResult.errors
                );
            }
            
            const businessRules = await this.rulesModel.getActiveRules();
            
            if (!businessRules || businessRules.length === 0) {
                return this.responseHelper.badRequest(res, 
                    'No business rules configured'
                );
            }
            
            // Process each record
            this.ruleEngineService.setRules(businessRules);
            const batchResults = [];
            let overallStatus = 'PASSED';
            
            for (let i = 0; i < validationResult.data.procurement_records.length; i++) {
                const record = validationResult.data.procurement_records[i];
                const result = await this.ruleEngineService.evaluate(record, validationResult.data.options);
                
                batchResults.push({
                    recordIndex: i,
                    recordId: record.id || `record_${i}`,
                    ...result
                });
                
                if (result.summary.overallStatus === 'FAILED') {
                    overallStatus = 'FAILED';
                }
            }
            
            const batchSummary = {
                totalRecords: validationResult.data.procurement_records.length,
                passedRecords: batchResults.filter(r => r.summary.overallStatus === 'PASSED').length,
                failedRecords: batchResults.filter(r => r.summary.overallStatus === 'FAILED').length,
                overallStatus,
                processingTimestamp: new Date().toISOString()
            };
            
            // Save batch validation results
            await this.validationModel.saveBatchValidationResult(batchSummary, batchResults);
            
            this.logger.info(`Batch validation completed: ${batchSummary.overallStatus}`);
            
            return this.responseHelper.success(res, {
                batchSummary,
                results: batchResults
            });
            
        } catch (err) {
            this.logger.error('Error during batch validation:', err);
            return this.responseHelper.serverError(res, 
                'Batch validation failed', 
                err.message
            );
        }
    }

    async getValidationHistory(req, res) {
        try {
            const { page = 1, limit = 10, status } = req.query;
            const history = await this.validationModel.getValidationHistory(
                parseInt(page), 
                parseInt(limit), 
                status
            );
            
            return this.responseHelper.success(res, history);
            
        } catch (err) {
            this.logger.error('Error retrieving validation history:', err);
            return this.responseHelper.serverError(res, 
                'Failed to retrieve validation history', 
                err.message
            );
        }
    }
}

module.exports = new ValidateController();

