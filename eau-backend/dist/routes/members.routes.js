"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const members_controller_1 = require("../controllers/members.controller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const constants_1 = require("../config/constants");
const router = (0, express_1.Router)();
const membersController = new members_controller_1.MembersController();
// All routes require authentication
router.use(auth_1.authenticate);
// List members
router.get('/', membersController.list);
// Get member statistics
router.get('/statistics', (0, auth_1.authorize)(constants_1.USER_TYPES.SUPER_ADMIN, constants_1.USER_TYPES.INSTITUTION_ADMIN), membersController.getStatistics);
// Export members CSV
router.get('/export', (0, auth_1.authorize)(constants_1.USER_TYPES.SUPER_ADMIN, constants_1.USER_TYPES.INSTITUTION_ADMIN), membersController.exportCsv);
// Get member by ID
router.get('/:id', [(0, express_validator_1.param)('id').isUUID()], validation_1.handleValidationErrors, membersController.getById);
// Update member
router.put('/:id', [
    (0, express_validator_1.param)('id').isUUID(),
    (0, express_validator_1.body)('email').optional().isEmail().normalizeEmail(),
    (0, express_validator_1.body)('full_name').optional().trim(),
    (0, express_validator_1.body)('phone').optional().trim()
], validation_1.handleValidationErrors, membersController.update);
exports.default = router;
//# sourceMappingURL=members.routes.js.map