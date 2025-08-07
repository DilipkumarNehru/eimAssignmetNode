const Joi = require('joi');
const LoggerHelper = require('./LoggerHelper');

class ValidationHelper {
    constructor() {
        this.logger = new LoggerHelper();
        this.setupSchemas();
    }

    setupSchemas() {
        // Rules configuration schema
        this.rulesSchema = Joi.object({
            version: Joi.string().required(),
            metadata: Joi.object({
                name: Joi.string().required(),
                description: Joi.string(),
                created_by: Joi.string(),
                created_date: Joi.string()
            }).required(),
            rules: Joi.array().items(
                Joi.object({
                    id: Joi.string().required(),
                    name: Joi.string().required(),
                    description: Joi.string(),
                    type: Joi.string().valid('validation', 'approval', 'calculation', 'notification').required(),
                    priority: Joi.number().integer().min(1).max(10).default(5),
                    active: Joi.boolean().default(true),
                    conditions: Joi.array().items(
                        Joi.object({
                            field: Joi.string().required(),
                            operator: Joi.string().valid('equals', 'not_equals', 'greater_than', 'less_than', 
                                                          'greater_equal', 'less_equal', 'contains', 'not_contains',
                                                          'in', 'not_in', 'exists', 'not_exists').required(),
                            value: Joi.alternatives().try(
                                Joi.string(),
                                Joi.number(),
                                Joi.boolean(),
                                Joi.array(),
                                Joi.object()
                            ).required(),
                            logical_operator: Joi.string().valid('AND', 'OR').default('AND')
                        })
                    ).required(),
                    actions: Joi.array().items(
                        Joi.object({
                            type: Joi.string().valid('approve', 'reject', 'flag', 'calculate', 'notify', 'modify').required(),
                            parameters: Joi.object().default({})
                        })
                    ).required()
                })
            ).required()
        });

        // Input data validation schema
        this.inputDataSchema = Joi.object({
            procurement_data: Joi.object().required(),
            options: Joi.object({
                strict_mode: Joi.boolean().default(false),
                stop_on_first_failure: Joi.boolean().default(false),
                include_rule_details: Joi.boolean().default(true)
            }).default({})
        });

        // Batch data validation schema
        this.batchDataSchema = Joi.object({
            procurement_records: Joi.array().items(Joi.object().required()).required(),
            options: Joi.object({
                strict_mode: Joi.boolean().default(false),
                stop_on_first_failure: Joi.boolean().default(false),
                include_rule_details: Joi.boolean().default(false)
            }).default({})
        });

        // Rule update schema
        this.ruleUpdateSchema = Joi.object({
            name: Joi.string(),
            description: Joi.string(),
            type: Joi.string().valid('validation', 'approval', 'calculation', 'notification'),
            priority: Joi.number().integer().min(1).max(10),
            active: Joi.boolean(),
            conditions: Joi.array().items(
                Joi.object({
                    field: Joi.string().required(),
                    operator: Joi.string().valid('equals', 'not_equals', 'greater_than', 'less_than', 
                                                  'greater_equal', 'less_equal', 'contains', 'not_contains',
                                                  'in', 'not_in', 'exists', 'not_exists').required(),
                    value: Joi.alternatives().try(
                        Joi.string(),
                        Joi.number(),
                        Joi.boolean(),
                        Joi.array(),
                        Joi.object()
                    ).required(),
                    logical_operator: Joi.string().valid('AND', 'OR').default('AND')
                })
            ),
            actions: Joi.array().items(
                Joi.object({
                    type: Joi.string().valid('approve', 'reject', 'flag', 'calculate', 'notify', 'modify').required(),
                    parameters: Joi.object().default({})
                })
            )
        }).min(1);
    }

    validateRulesSchema(data) {
        const { error, value } = this.rulesSchema.validate(data, { allowUnknown: false });
        
        if (error) {
            return {
                isValid: false,
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            };
        }
        
        return {
            isValid: true,
            data: value
        };
    }

    validateInputData(data) {
        const { error, value } = this.inputDataSchema.validate(data);
        
        if (error) {
            return {
                isValid: false,
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            };
        }
        
        return {
            isValid: true,
            data: value
        };
    }

    validateBatchData(data) {
        const { error, value } = this.batchDataSchema.validate(data);
        
        if (error) {
            return {
                isValid: false,
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            };
        }
        
        return {
            isValid: true,
            data: value
        };
    }

    validateRuleUpdate(data) {
        const { error, value } = this.ruleUpdateSchema.validate(data);
        
        if (error) {
            return {
                isValid: false,
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            };
        }
        
        return {
            isValid: true,
            data: value
        };
    }

    validateEmail(email) {
        const emailSchema = Joi.string().email();
        const { error } = emailSchema.validate(email);
        return !error;
    }

    validateId(id) {
        const idSchema = Joi.string().alphanum().min(3).max(50);
        const { error } = idSchema.validate(id);
        return !error;
    }
}

module.exports = ValidationHelper;
