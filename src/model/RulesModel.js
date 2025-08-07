const LoggerHelper = require('../helper/LoggerHelper');

class RulesModel {
    constructor() {
        this.logger = new LoggerHelper();
        // In-memory storage (in production, use database)
        this.businessRules = {
            rules: [],
            lastUpdated: null,
            version: '1.0.0',
            metadata: {}
        };
    }

    async saveRules(rulesData) {
        try {
            this.businessRules = {
                ...rulesData,
                lastUpdated: new Date().toISOString(),
                rulesCount: rulesData.rules.length
            };
            
            return {
                success: true,
                rulesCount: rulesData.rules.length,
                summary: {
                    version: rulesData.version,
                    rulesCount: rulesData.rules.length,
                    activeRules: rulesData.rules.filter(rule => rule.active).length,
                    ruleTypes: [...new Set(rulesData.rules.map(rule => rule.type))]
                }
            };
        } catch (err) {
            this.logger.error('Error saving rules:', err);
            throw err;
        }
    }

    async getRules() {
        try {
            return this.businessRules.rules;
        } catch (err) {
            this.logger.error('Error getting rules:', err);
            throw err;
        }
    }

    async getActiveRules() {
        try {
            return this.businessRules.rules.filter(rule => rule.active);
        } catch (err) {
            this.logger.error('Error getting active rules:', err);
            throw err;
        }
    }

    async getRuleById(ruleId) {
        try {
            return this.businessRules.rules.find(r => r.id === ruleId);
        } catch (err) {
            this.logger.error('Error getting rule by ID:', err);
            throw err;
        }
    }

    async updateRule(ruleId, updateData) {
        try {
            const ruleIndex = this.businessRules.rules.findIndex(r => r.id === ruleId);
            
            if (ruleIndex === -1) {
                return null;
            }
            
            this.businessRules.rules[ruleIndex] = {
                ...this.businessRules.rules[ruleIndex],
                ...updateData,
                updated_at: new Date().toISOString()
            };
            
            return this.businessRules.rules[ruleIndex];
        } catch (err) {
            this.logger.error('Error updating rule:', err);
            throw err;
        }
    }

    async deleteRule(ruleId) {
        try {
            const ruleIndex = this.businessRules.rules.findIndex(r => r.id === ruleId);
            
            if (ruleIndex === -1) {
                return false;
            }
            
            this.businessRules.rules.splice(ruleIndex, 1);
            return true;
        } catch (err) {
            this.logger.error('Error deleting rule:', err);
            throw err;
        }
    }

    getRulesSummary(rules) {
        return {
            version: this.businessRules.version,
            lastUpdated: this.businessRules.lastUpdated,
            metadata: this.businessRules.metadata,
            rulesCount: rules.length,
            activeRules: rules.filter(rule => rule.active).length,
            ruleTypes: [...new Set(rules.map(rule => rule.type))],
            rules: rules
        };
    }

    async getRulesStats() {
        try {
            const rules = this.businessRules.rules;
            return {
                totalRules: rules.length,
                activeRules: rules.filter(r => r.active).length,
                inactiveRules: rules.filter(r => !r.active).length,
                rulesByType: rules.reduce((acc, rule) => {
                    acc[rule.type] = (acc[rule.type] || 0) + 1;
                    return acc;
                }, {}),
                lastUpdated: this.businessRules.lastUpdated
            };
        } catch (err) {
            this.logger.error('Error getting rules stats:', err);
            throw err;
        }
    }
}

module.exports = RulesModel;
