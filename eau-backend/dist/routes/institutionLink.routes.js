"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const institutionLink_controller_1 = require("../controllers/institutionLink.controller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
const linkController = new institutionLink_controller_1.InstitutionLinkController();
// All routes require authentication
router.use(auth_1.authenticate);
/**
 * Member requests to link with an institution
 * POST /api/v1/institution-links/request
 */
router.post('/request', [
    (0, express_validator_1.body)('institution_id')
        .notEmpty()
        .withMessage('Institution ID is required')
        .isUUID()
        .withMessage('Invalid institution ID format')
], validation_1.handleValidationErrors, linkController.requestLink);
/**
 * Get pending link requests for institution admin's institution
 * GET /api/v1/institution-links/pending
 * Requires: Institution Admin or Super Admin role
 */
router.get('/pending', linkController.getPendingRequests);
/**
 * Get all link requests for institution admin's institution
 * GET /api/v1/institution-links/all
 * Requires: Institution Admin or Super Admin role
 */
router.get('/all', linkController.getAllRequests);
/**
 * Institution admin approves a link request
 * POST /api/v1/institution-links/:id/approve
 */
router.post('/:id/approve', [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid request ID format'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isString()
        .withMessage('Notes must be a string')
], validation_1.handleValidationErrors, linkController.approveRequest);
/**
 * Institution admin rejects a link request
 * POST /api/v1/institution-links/:id/reject
 */
router.post('/:id/reject', [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid request ID format'),
    (0, express_validator_1.body)('notes')
        .notEmpty()
        .withMessage('Rejection reason is required')
        .isString()
        .withMessage('Notes must be a string')
], validation_1.handleValidationErrors, linkController.rejectRequest);
/**
 * Member unlinks from their current institution
 * DELETE /api/v1/institution-links/unlink
 */
router.delete('/unlink', linkController.unlinkFromInstitution);
/**
 * Get member's current link status and history
 * GET /api/v1/institution-links/status
 */
router.get('/status', linkController.getLinkStatus);
exports.default = router;
//# sourceMappingURL=institutionLink.routes.js.map