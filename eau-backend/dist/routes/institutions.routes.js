"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const institutions_controller_1 = require("../controllers/institutions.controller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const constants_1 = require("../config/constants");
const router = (0, express_1.Router)();
const institutionsController = new institutions_controller_1.InstitutionsController();
// All routes require authentication
router.use(auth_1.authenticate);
// List institutions
router.get('/', institutionsController.list);
// Get statistics (super admin only)
router.get('/statistics', (0, auth_1.authorize)(constants_1.USER_TYPES.SUPER_ADMIN), institutionsController.getStatistics);
// Get institution by ID
router.get('/:id', [(0, express_validator_1.param)('id').isUUID()], validation_1.handleValidationErrors, institutionsController.getById);
// Get institution members
router.get('/:id/members', [(0, express_validator_1.param)('id').isUUID()], validation_1.handleValidationErrors, institutionsController.getMembers);
// Create institution (super admin only)
router.post('/', (0, auth_1.authorize)(constants_1.USER_TYPES.SUPER_ADMIN), [
    (0, express_validator_1.body)('name').notEmpty().trim(),
    (0, express_validator_1.body)('membership_type').notEmpty().isIn(['full_provider', 'associate', 'corporate', 'professional']),
    (0, express_validator_1.body)('primary_contact_email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('abn').optional().trim(),
    (0, express_validator_1.body)('cricos_code').optional().trim()
], validation_1.handleValidationErrors, institutionsController.create);
// Update institution
router.put('/:id', [
    (0, express_validator_1.param)('id').isUUID(),
    (0, express_validator_1.body)('name').optional().trim(),
    (0, express_validator_1.body)('primary_contact_email').optional().isEmail().normalizeEmail()
], validation_1.handleValidationErrors, institutionsController.update);
exports.default = router;
//# sourceMappingURL=institutions.routes.js.map