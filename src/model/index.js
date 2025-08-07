const RulesModel = require('./RulesModel');
const ValidationModel = require('./ValidationModel');

// Create singleton instances
const rulesModelInstance = new RulesModel();
const validationModelInstance = new ValidationModel();

module.exports = {
    rulesModel: rulesModelInstance,
    validationModel: validationModelInstance
};
