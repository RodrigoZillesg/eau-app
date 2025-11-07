"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const membershipFee_service_1 = require("../services/membershipFee.service");
const membershipApplication_service_1 = require("../services/membershipApplication.service");
const logger_1 = require("../utils/logger");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
// Middleware for validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};
/**
 * GET /api/v1/public/membership-types
 * Get all available membership types with benefits
 */
router.get('/membership-types', async (req, res) => {
    try {
        (0, logger_1.logInfo)('Fetching public membership types');
        const membershipTypes = await membershipFee_service_1.MembershipFeeService.getMembershipTypes();
        res.json({
            success: true,
            data: membershipTypes
        });
    }
    catch (error) {
        (0, logger_1.logError)(error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch membership types'
        });
    }
});
/**
 * POST /api/v1/public/calculate-fee
 * Calculate membership fee for given type
 */
router.post('/calculate-fee', [
    (0, express_validator_1.body)('membershipType')
        .notEmpty()
        .withMessage('Membership type is required')
        .isString()
        .withMessage('Invalid membership type format'),
    (0, express_validator_1.body)('numSites')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Number of sites must be at least 1'),
    (0, express_validator_1.body)('studentWeeks')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Student weeks must be non-negative')
], handleValidationErrors, async (req, res) => {
    try {
        const { membershipType, numSites = 1, studentWeeks = 0 } = req.body;
        (0, logger_1.logInfo)('Calculating membership fee', { membershipType, numSites, studentWeeks });
        const feeCalculation = await membershipFee_service_1.MembershipFeeService.calculateFee(membershipType, numSites, studentWeeks);
        res.json({
            success: true,
            data: feeCalculation
        });
    }
    catch (error) {
        (0, logger_1.logError)(error, req, res);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate membership fee'
        });
    }
});
/**
 * POST /api/v1/public/membership-application
 * Submit a new membership application
 */
router.post('/membership-application', [
    // Institution Details validation
    (0, express_validator_1.body)('institutionName')
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Institution name must be between 2 and 255 characters'),
    (0, express_validator_1.body)('institutionType')
        .trim()
        .notEmpty()
        .withMessage('Institution type is required'),
    (0, express_validator_1.body)('website')
        .optional()
        .isURL()
        .withMessage('Website must be a valid URL'),
    (0, express_validator_1.body)('establishedYear')
        .optional()
        .isInt({ min: 1800, max: new Date().getFullYear() })
        .withMessage('Established year must be between 1800 and current year'),
    // Address validation
    (0, express_validator_1.body)('streetAddress')
        .trim()
        .isLength({ min: 5, max: 255 })
        .withMessage('Street address must be between 5 and 255 characters'),
    (0, express_validator_1.body)('city')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters'),
    (0, express_validator_1.body)('state')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('State must be between 2 and 100 characters'),
    (0, express_validator_1.body)('postalCode')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('Postal code must be between 3 and 20 characters'),
    (0, express_validator_1.body)('country')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Country must be between 2 and 100 characters'),
    // Contact Person validation
    (0, express_validator_1.body)('contactPersonName')
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Contact person name must be between 2 and 255 characters'),
    (0, express_validator_1.body)('contactPersonTitle')
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Contact person title must be between 2 and 255 characters'),
    (0, express_validator_1.body)('contactPersonEmail')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    (0, express_validator_1.body)('contactPersonPhone')
        .trim()
        .isLength({ min: 8, max: 20 })
        .withMessage('Phone number must be between 8 and 20 characters'),
    // Membership Details validation
    (0, express_validator_1.body)('membershipType')
        .notEmpty()
        .withMessage('Membership type is required')
        .isString()
        .withMessage('Invalid membership type'),
    (0, express_validator_1.body)('motivationStatement')
        .trim()
        .isLength({ min: 50, max: 2000 })
        .withMessage('Motivation statement must be between 50 and 2000 characters'),
    // Optional fields validation
    (0, express_validator_1.body)('numberOfStudents')
        .optional()
        .isInt({ min: 0, max: 100000 })
        .withMessage('Number of students must be between 0 and 100,000'),
    (0, express_validator_1.body)('accreditations')
        .optional()
        .isArray()
        .withMessage('Accreditations must be an array'),
    (0, express_validator_1.body)('specialPrograms')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Special programs description must be under 1000 characters')
], handleValidationErrors, async (req, res) => {
    try {
        const applicationData = req.body;
        (0, logger_1.logInfo)('Submitting membership application', {
            institutionName: applicationData.institutionName,
            contactEmail: applicationData.contactPersonEmail
        });
        const applicationId = await membershipApplication_service_1.MembershipApplicationService.submitApplication(applicationData);
        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: {
                applicationId,
                status: 'pending'
            }
        });
    }
    catch (error) {
        (0, logger_1.logError)(error, req, res);
        if (error instanceof Error && error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                message: 'An application from this institution is already being processed'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to submit application'
        });
    }
});
/**
 * GET /api/v1/public/application-status/:id
 * Get application status by ID (public endpoint for applicants)
 */
router.get('/application-status/:id', async (req, res) => {
    try {
        const { id } = req.params;
        (0, logger_1.logInfo)('Fetching application status', { applicationId: id });
        const application = await membershipApplication_service_1.MembershipApplicationService.getApplicationById(id);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        // Return limited information for public endpoint
        res.json({
            success: true,
            data: {
                id: application.id,
                status: application.status,
                institutionName: application.institution_name,
                submittedAt: application.submitted_at,
                reviewedAt: application.reviewed_at
            }
        });
    }
    catch (error) {
        (0, logger_1.logError)(error, req, res);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch application status'
        });
    }
});
exports.default = router;
//# sourceMappingURL=public.routes.js.map