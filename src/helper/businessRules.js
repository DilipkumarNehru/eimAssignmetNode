'use strict';

const fs = require('fs');
const path = require('path');

class BusinessRulesEngine {
    constructor() {
        this.rules = this.loadBusinessRules();
    }

    loadBusinessRules() {
        try {
            const rulesPath = path.join(__dirname, '../data/businessRules.json');
            const rulesData = fs.readFileSync(rulesPath, 'utf8');
            return JSON.parse(rulesData);
        } catch (error) {
            console.error('Error loading business rules:', error);
            return { approvalRules: [] };
        }
    }

    applyRules(prData) {
        let processedPR = { ...prData };
        let rulesAppliedCount = 0;
        
        this.rules.approvalRules.forEach(rule => {
            if (this.evaluateCondition(rule.condition, processedPR)) {
                processedPR = this.executeAction(rule, processedPR);
                rulesAppliedCount++;
            }
        });

        // Add processing metadata
        processedPR.processedAt = new Date().toISOString();
        processedPR.rulesApplied = rulesAppliedCount;
        
        return processedPR;
    }

    evaluateCondition(condition, data) {
        try {
            // Calculate delivery days if needed
            if (condition.includes('deliveryDays')) {
                const deliveryDate = new Date(data.requiredDeliveryDate);
                const currentDate = new Date();
                const deliveryDays = Math.ceil((deliveryDate - currentDate) / (1000 * 60 * 60 * 24));
                data.deliveryDays = deliveryDays;
            }

            // Replace field references with actual values
            let evaluationString = condition;
            const fieldMatches = condition.match(/\b\w+\b/g);
            
            if (fieldMatches) {
                fieldMatches.forEach(field => {
                    if (data.hasOwnProperty(field)) {
                        const value = typeof data[field] === 'string' ? `"${data[field]}"` : data[field];
                        evaluationString = evaluationString.replace(
                            new RegExp(`\\b${field}\\b`, 'g'), 
                            value
                        );
                    }
                });
            }

            return eval(evaluationString);
        } catch (error) {
            console.error('Error evaluating condition:', error);
            return false;
        }
    }

    executeAction(rule, prData) {
        switch (rule.action) {
            case 'autoApprove':
                prData.status = rule.setStatus || 'Approved';
                prData.approvalType = 'Auto';
                prData.approvedAt = new Date().toISOString();
                break;
            
            case 'setUrgency':
                prData.urgency = rule.urgency || 'High';
                prData.urgencySetAt = new Date().toISOString();
                break;
            
            case 'requireApproval':
                prData.status = 'Pending Approval';
                prData.approvalRequired = true;
                prData.approvalLevel = rule.approvalLevel;
                break;
            
            default:
                console.log('Unknown action:', rule.action);
        }
        
        return prData;
    }
}

module.exports = BusinessRulesEngine;
