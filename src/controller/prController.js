'use strict';

const PurchaseRequest = require('../model/purchaseRequest.model');
const BusinessRulesEngine = require('../helper/businessRules');
const output = require('../helper/api');

class PRController {
    constructor() {
        this.businessRulesEngine = new BusinessRulesEngine();
    }

    // Process Purchase Request with business rules
    async processPR(req, res) {
        try {
            const prData = req.body;

            // Validate required fields
            if (!prData.prNumber || !prData.totalAmount || !prData.requiredDeliveryDate) {
                return output.invalid(req, res, 'Missing required fields: prNumber, totalAmount, requiredDeliveryDate');
            }

            // Apply business rules to PR data
            const processedPR = this.businessRulesEngine.applyRules(prData);

            // Save processed PR to database
            const savedPR = await PurchaseRequest.create(processedPR);

            return output.ok(req, res, savedPR, "Purchase Request processed successfully", 0);

        } catch (error) {
            console.error('Error processing PR:', error);
            return output.serverError(req, res, error);
        }
    }

    // Get Purchase Request by ID
    async getPR(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return output.invalid(req, res, 'PR ID is required');
            }

            const pr = await PurchaseRequest.findById(id);

            if (!pr) {
                return output.notFound(req, res, 'Purchase Request not found');
            }

            return output.ok(req, res, pr, "Purchase Request retrieved successfully", 0);

        } catch (error) {
            console.error('Error retrieving PR:', error);
            return output.serverError(req, res, error);
        }
    }

    // Get all Purchase Requests with filters
    async getAllPRs(req, res) {
        try {
            const { status, department, urgency, page = 1, limit = 10 } = req.query;
            const query = {};

            if (status) query.status = status;
            if (department) query.department = department;
            if (urgency) query.urgency = urgency;

            const skip = (page - 1) * limit;
            const prs = await PurchaseRequest.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await PurchaseRequest.countDocuments(query);

            const result = {
                prs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            };

            return output.ok(req, res, result, "Purchase Requests retrieved successfully", 0);

        } catch (error) {
            console.error('Error retrieving PRs:', error);
            return output.serverError(req, res, error);
        }
    }

    // Update Purchase Request
    async updatePR(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            if (!id) {
                return output.invalid(req, res, 'PR ID is required');
            }

            // Re-apply business rules if critical fields changed
            if (updateData.totalAmount || updateData.requiredDeliveryDate) {
                const processedData = this.businessRulesEngine.applyRules(updateData);
                Object.assign(updateData, processedData);
            }

            updateData.updatedAt = new Date();

            const updatedPR = await PurchaseRequest.findByIdAndUpdate(id, updateData, { new: true });

            if (!updatedPR) {
                return output.notFound(req, res, 'Purchase Request not found');
            }

            return output.ok(req, res, updatedPR, "Purchase Request updated successfully", 0);

        } catch (error) {
            console.error('Error updating PR:', error);
            return output.serverError(req, res, error);
        }
    }

    // Delete Purchase Request
    async deletePR(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return output.invalid(req, res, 'PR ID is required');
            }

            const deletedPR = await PurchaseRequest.findByIdAndDelete(id);

            if (!deletedPR) {
                return output.notFound(req, res, 'Purchase Request not found');
            }

            return output.ok(req, res, deletedPR, "Purchase Request deleted successfully", 0);

        } catch (error) {
            console.error('Error deleting PR:', error);
            return output.serverError(req, res, error);
        }
    }
}

module.exports = new PRController();
