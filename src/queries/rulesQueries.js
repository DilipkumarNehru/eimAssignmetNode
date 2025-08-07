class RulesQueries {
    constructor(connection) {
        this.db = connection;
    }

    async insertRule(ruleData) {
        const query = `
            INSERT INTO business_rules (id, name, description, type, priority, active, conditions, actions, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        return this.db.execute(query, [
            ruleData.id,
            ruleData.name,
            ruleData.description,
            ruleData.type,
            ruleData.priority,
            ruleData.active,
            JSON.stringify(ruleData.conditions),
            JSON.stringify(ruleData.actions)
        ]);
    }

    async selectAllRules() {
        const query = 'SELECT * FROM business_rules ORDER BY priority ASC, created_at DESC';
        return this.db.execute(query);
    }

    async selectActiveRules() {
        const query = 'SELECT * FROM business_rules WHERE active = true ORDER BY priority ASC';
        return this.db.execute(query);
    }

    async selectRuleById(id) {
        const query = 'SELECT * FROM business_rules WHERE id = ?';
        return this.db.execute(query, [id]);
    }

    async updateRule(id, updateData) {
        const fields = [];
        const values = [];
        
        Object.keys(updateData).forEach(key => {
            if (key !== 'id') {
                fields.push(`${key} = ?`);
                values.push(typeof updateData[key] === 'object' ? JSON.stringify(updateData[key]) : updateData[key]);
            }
        });
        
        values.push(id);
        
        const query = `UPDATE business_rules SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
        return this.db.execute(query, values);
    }

    async deleteRule(id) {
        const query = 'DELETE FROM business_rules WHERE id = ?';
        return this.db.execute(query, [id]);
    }

    async insertValidationResult(validationData) {
        const query = `
            INSERT INTO validation_history (id, summary, results, recommendations, created_at)
            VALUES (?, ?, ?, ?, NOW())
        `;
        
        return this.db.execute(query, [
            validationData.id,
            JSON.stringify(validationData.summary),
            JSON.stringify(validationData.results),
            JSON.stringify(validationData.recommendations)
        ]);
    }
}

module.exports = RulesQueries;
