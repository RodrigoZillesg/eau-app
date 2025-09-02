"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const invitations_controller_1 = require("../controllers/invitations.controller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const constants_1 = require("../config/constants");
const router = (0, express_1.Router)();
const invitationsController = new invitations_controller_1.InvitationsController();
// Accept invitation (public route)
router.post('/accept', [
    (0, express_validator_1.body)('token').notEmpty(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('fullName').notEmpty().trim()
], validation_1.handleValidationErrors, invitationsController.acceptInvitation);
// All other routes require authentication
router.use(auth_1.authenticate);
// Create invitation
router.post('/', (0, auth_1.authorize)(constants_1.USER_TYPES.SUPER_ADMIN, constants_1.USER_TYPES.INSTITUTION_ADMIN), [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('firstName').optional().trim(),
    (0, express_validator_1.body)('lastName').optional().trim(),
    (0, express_validator_1.body)('userType').isIn(['institution_admin', 'staff', 'teacher', 'limited']),
    (0, express_validator_1.body)('institutionId').isUUID()
], validation_1.handleValidationErrors, invitationsController.createInvitation);
// List invitations for institution
router.get('/institution/:institutionId', [(0, express_validator_1.param)('institutionId').isUUID()], validation_1.handleValidationErrors, invitationsController.listInvitations);
// Revoke invitation
router.delete('/:id', (0, auth_1.authorize)(constants_1.USER_TYPES.SUPER_ADMIN, constants_1.USER_TYPES.INSTITUTION_ADMIN), [(0, express_validator_1.param)('id').isUUID()], validation_1.handleValidationErrors, invitationsController.revokeInvitation);
// Resend invitation
router.post('/:id/resend', (0, auth_1.authorize)(constants_1.USER_TYPES.SUPER_ADMIN, constants_1.USER_TYPES.INSTITUTION_ADMIN), [(0, express_validator_1.param)('id').isUUID()], validation_1.handleValidationErrors, invitationsController.resendInvitation);
exports.default = router;
//# sourceMappingURL=invitations.routes.js.map