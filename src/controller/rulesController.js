const { rulesModel } = require('../model');
const ResponseHelper = require('../helper/ResponseHelper');
const ValidationHelper = require('../helper/ValidationHelper');
const LoggerHelper = require('../helper/LoggerHelper');

class RulesController {
    constructor() {
        this.rulesModel = rulesModel;  // Use shared instance
        this.responseHelper = new ResponseHelper();
        this.validationHelper = new ValidationHelper();
        this.logger = new LoggerHelper();
    }

    // ... rest of your methods remain the same
    async loadRules(req, res) {
        try {
            this.logger.info('Loading new business rules configuration');
            
            // Validate the rules configuration
            const validationResult = this.validationHelper.validateRulesSchema(req.body);
            
            if (!validationResult.isValid) {
                this.logger.error('Rules validation failed:', validationResult.errors);
                return this.responseHelper.badRequest(res, 
                    'Invalid rules configuration', 
                    validationResult.errors
                );
            }
            
            // Store the validated rules
            const result = await this.rulesModel.saveRules(validationResult.data);
            
            this.logger.info(`Successfully loaded ${result.rulesCount} business rules`);
            
            return this.responseHelper.success(res, {
                message: 'Business rules loaded successfully',
                summary: result.summary
            });
            
        } catch (err) {
            this.logger.error('Error loading rules:', err);
            return this.responseHelper.serverError(res, 
                'Failed to load business rules', 
                err.message
            );
        }
    }

    async getRules(req, res) {
        try {
            const rules = await this.rulesModel.getRules();
            
            if (!rules || rules.length === 0) {
                return this.responseHelper.notFound(res, 
                    'No business rules configuration found',
                    'Use POST /api/rules/load to load rules configuration'
                );
            }
            
            const summary = this.rulesModel.getRulesSummary(rules);
            
            return this.responseHelper.success(res, summary);
            
        } catch (err) {
            this.logger.error('Error retrieving rules:', err);
            return this.responseHelper.serverError(res, 
                'Failed to retrieve business rules', 
                err.message
            );
        }
    }

    async getRuleById(req, res) {
        try {
            const ruleId = req.params.id;
            const rule = await this.rulesModel.getRuleById(ruleId);
            
            if (!rule) {
                return this.responseHelper.notFound(res, 
                    `Rule with ID '${ruleId}' not found`
                );
            }
            
            return this.responseHelper.success(res, rule);
            
        } catch (err) {
            this.logger.error('Error retrieving rule:', err);
            return this.responseHelper.serverError(res, 
                'Failed to retrieve rule', 
                err.message
            );
        }
    }

    async updateRule(req, res) {
        try {
            const ruleId = req.params.id;
            const updateData = req.body;
            
            // Validate update data
            const validationResult = this.validationHelper.validateRuleUpdate(updateData);
            
            if (!validationResult.isValid) {
                return this.responseHelper.badRequest(res, 
                    'Invalid rule update data', 
                    validationResult.errors
                );
            }
            
            const result = await this.rulesModel.updateRule(ruleId, validationResult.data);
            
            if (!result) {
                return this.responseHelper.notFound(res, 
                    `Rule with ID '${ruleId}' not found`
                );
            }
            
            this.logger.info(`Rule ${ruleId} updated successfully`);
            return this.responseHelper.success(res, {
                message: 'Rule updated successfully',
                rule: result
            });
            
        } catch (err) {
            this.logger.error('Error updating rule:', err);
            return this.responseHelper.serverError(res, 
                'Failed to update rule', 
                err.message
            );
        }
    }

    async deleteRule(req, res) {
        try {
            const ruleId = req.params.id;
            const result = await this.rulesModel.deleteRule(ruleId);
            
            if (!result) {
                return this.responseHelper.notFound(res, 
                    `Rule with ID '${ruleId}' not found`
                );
            }
            
            this.logger.info(`Rule ${ruleId} deleted successfully`);
            return this.responseHelper.success(res, {
                message: 'Rule deleted successfully'
            });
            
        } catch (err) {
            this.logger.error('Error deleting rule:', err);
            return this.responseHelper.serverError(res, 
                'Failed to delete rule', 
                err.message
            );
        }
    }
}

module.exports = new RulesController();
