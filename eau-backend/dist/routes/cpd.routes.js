"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const cpd_controller_1 = require("../controllers/cpd.controller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
const cpdController = new cpd_controller_1.CPDController();
// All routes require authentication
router.use(auth_1.authenticate);
// List CPD activities
router.get('/', [
    (0, express_validator_1.query)('year').optional().isInt({ min: 2020, max: 2030 }),
    (0, express_validator_1.query)('status').optional().isIn(['approved', 'pending', 'rejected', 'all'])
], validation_1.handleValidationErrors, cpdController.list);
// Get CPD progress
router.get('/progress', [
    (0, express_validator_1.query)('year').optional().isInt({ min: 2020, max: 2030 }),
    (0, express_validator_1.query)('memberId').optional().isUUID()
], validation_1.handleValidationErrors, cpdController.getProgress);
// Create CPD activity
router.post('/', [
    (0, express_validator_1.body)('activityDate').isISO8601().toDate(),
    (0, express_validator_1.body)('activityType').notEmpty().trim(),
    (0, express_validator_1.body)('description').notEmpty().trim(),
    (0, express_validator_1.body)('points').isFloat({ min: 0, max: 50 }),
    (0, express_validator_1.body)('evidenceUrl').optional().isURL(),
    (0, express_validator_1.body)('notes').optional().trim()
], validation_1.handleValidationErrors, cpdController.create);
// Update CPD activity
router.put('/:id', [
    (0, express_validator_1.param)('id').isUUID(),
    (0, express_validator_1.body)('activityDate').optional().isISO8601().toDate(),
    (0, express_validator_1.body)('activityType').optional().notEmpty().trim(),
    (0, express_validator_1.body)('description').optional().notEmpty().trim(),
    (0, express_validator_1.body)('points').optional().isFloat({ min: 0, max: 50 }),
    (0, express_validator_1.body)('evidenceUrl').optional().isURL(),
    (0, express_validator_1.body)('notes').optional().trim()
], validation_1.handleValidationErrors, cpdController.update);
// Delete CPD activity
router.delete('/:id', [(0, express_validator_1.param)('id').isUUID()], validation_1.handleValidationErrors, cpdController.delete);
exports.default = router;
//# sourceMappingURL=cpd.routes.js.map