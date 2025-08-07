const LoggerHelper = require('../helper/LoggerHelper');

class RuleEngineService {
    constructor() {
        this.logger = new LoggerHelper();
        this.rules = [];
        this.results = [];
    }

    setRules(rules) {
        this.rules = rules.filter(rule => rule.active);
        this.logger.info(`Rule engine loaded with ${this.rules.length} active rules`);
    }

    async evaluate(data, options = {}) {
        try {
            this.results = [];
            
            for (const rule of this.rules) {
                const result = await this.evaluateRule(rule, data, options);
                this.results.push(result);
                
                if (options.stop_on_first_failure && !result.passed) {
                    break;
                }
            }
            
            return this.getEvaluationSummary(options);
        } catch (err) {
            this.logger.error('Error during rule evaluation:', err);
            throw err;
        }
    }

    async evaluateRule(rule, data, options) {
        try {
            this.logger.info(`Evaluating rule: ${rule.id}`);
            
            const conditionResults = await Promise.all(
                rule.conditions.map(condition => this.evaluateCondition(condition, data))
            );
            
            // Apply logical operators
            let passed = this.applyLogicalOperators(rule.conditions, conditionResults);
            
            const result = {
                ruleId: rule.id,
                ruleName: rule.name,
                ruleType: rule.type,
                priority: rule.priority,
                passed,
                conditionResults,
                actions: passed ? rule.actions : [],
                message: passed ? 'Rule passed successfully' : 'Rule validation failed',
                timestamp: new Date().toISOString()
            };
            
            if (!options.include_rule_details) {
                delete result.conditionResults;
            }
            
            return result;
        } catch (err) {
            this.logger.error(`Error evaluating rule ${rule.id}:`, err);
            return {
                ruleId: rule.id,
                ruleName: rule.name,
                passed: false,
                error: err.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async evaluateCondition(condition, data) {
        try {
            const fieldValue = this.getNestedValue(data, condition.field);
            const expectedValue = condition.value;
            const operator = condition.operator;
            
            let passed = false;
            
            switch (operator) {
                case 'equals':
                    passed = fieldValue === expectedValue;
                    break;
                case 'not_equals':
                    passed = fieldValue !== expectedValue;
                    break;
                case 'greater_than':
                    passed = Number(fieldValue) > Number(expectedValue);
                    break;
                case 'less_than':
                    passed = Number(fieldValue) < Number(expectedValue);
                    break;
                case 'greater_equal':
                    passed = Number(fieldValue) >= Number(expectedValue);
                    break;
                case 'less_equal':
                    passed = Number(fieldValue) <= Number(expectedValue);
                    break;
                case 'contains':
                    passed = String(fieldValue).includes(String(expectedValue));
                    break;
                case 'not_contains':
                    passed = !String(fieldValue).includes(String(expectedValue));
                    break;
                case 'in':
                    passed = Array.isArray(expectedValue) && expectedValue.includes(fieldValue);
                    break;
                case 'not_in':
                    passed = Array.isArray(expectedValue) && !expectedValue.includes(fieldValue);
                    break;
                case 'exists':
                    passed = fieldValue !== undefined && fieldValue !== null;
                    break;
                case 'not_exists':
                    passed = fieldValue === undefined || fieldValue === null;
                    break;
                default:
                    throw new Error(`Unknown operator: ${operator}`);
            }
            
            return {
                field: condition.field,
                operator: condition.operator,
                expectedValue: expectedValue,
                actualValue: fieldValue,
                passed,
                message: passed ? 'Condition satisfied' : 'Condition not satisfied'
            };
        } catch (err) {
            return {
                field: condition.field,
                operator: condition.operator,
                passed: false,
                error: err.message
            };
        }
    }

    applyLogicalOperators(conditions, conditionResults) {
        if (conditions.length === 1) {
            return conditionResults[0].passed;
        }
        
        // For simplicity, implementing basic AND/OR logic
        // In production, you'd implement a proper expression parser
        let result = conditionResults[0].passed;
        
        for (let i = 1; i < conditions.length; i++) {
            const logicalOp = conditions[i-1].logical_operator || 'AND';
            
            if (logicalOp === 'AND') {
                result = result && conditionResults[i].passed;
            } else if (logicalOp === 'OR') {
                result = result || conditionResults[i].passed;
            }
        }
        
        return result;
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    getEvaluationSummary(options) {
        const totalRules = this.results.length;
        const passedRules = this.results.filter(r => r.passed).length;
        const failedRules = totalRules - passedRules;
        
        return {
            summary: {
                totalRules,
                passedRules,
                failedRules,
                overallStatus: failedRules === 0 ? 'PASSED' : 'FAILED',
                evaluationTimestamp: new Date().toISOString()
            },
            results: this.results,
            recommendations: this.generateRecommendations()
        };
    }

    generateRecommendations() {
        const failedRules = this.results.filter(r => !r.passed);
        if (failedRules.length === 0) {
            return ['All rules passed successfully. Procurement data is valid.'];
        }
        
        const recommendations = [];
        
        failedRules.forEach(rule => {
            recommendations.push(`Fix rule violation: ${rule.ruleName} (${rule.ruleId})`);
            
            if (rule.conditionResults) {
                const failedConditions = rule.conditionResults.filter(c => !c.passed);
                failedConditions.forEach(condition => {
                    recommendations.push(
                        `  - Field '${condition.field}' should ${condition.operator} '${condition.expectedValue}' but got '${condition.actualValue}'`
                    );
                });
            }
        });
        
        return recommendations;
    }
}

module.exports = RuleEngineService;
