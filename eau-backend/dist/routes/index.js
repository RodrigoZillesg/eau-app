"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const members_routes_1 = __importDefault(require("./members.routes"));
const institutions_routes_1 = __importDefault(require("./institutions.routes"));
const invitations_routes_1 = __importDefault(require("./invitations.routes"));
const cpd_routes_1 = __importDefault(require("./cpd.routes"));
const email_routes_1 = __importDefault(require("./email.routes"));
const institutionLink_routes_1 = __importDefault(require("./institutionLink.routes"));
const openlearningCourses_routes_1 = __importDefault(require("./openlearningCourses.routes"));
const openlearning_routes_1 = __importDefault(require("./openlearning.routes")); // OpenLearning SSO routes
const storage_routes_1 = __importDefault(require("./storage.routes")); // Storage routes for avatar upload
// import openlearningPublicRoutes from './openlearning-public.routes'; // Temporarily disabled
// import openlearningSSORoutes from './openlearningSSO.routes'; // Temporarily disabled
// import certificatesRoutes from './certificates.routes';
const welcome_routes_1 = __importDefault(require("./welcome.routes"));
const public_routes_1 = __importDefault(require("./public.routes"));
const membershipApplications_routes_1 = __importDefault(require("./admin/membershipApplications.routes"));
const emailLogs_routes_1 = __importDefault(require("./admin/emailLogs.routes"));
const tracking_routes_1 = __importDefault(require("./tracking.routes"));
const system_routes_1 = __importDefault(require("./system.routes")); // System status routes
// import applicationsRoutes from './applications.routes';
const constants_1 = require("../config/constants");
const email_controller_1 = require("../controllers/email.controller");
const router = (0, express_1.Router)();
// Health check
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'EAU Backend API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
// Special route for event reminders (no auth, called by frontend)
router.post('/api/create-reminders', email_controller_1.EmailController.createReminders);
// API routes
router.use(`${constants_1.API_PREFIX}/auth`, auth_routes_1.default);
router.use(`${constants_1.API_PREFIX}/members`, members_routes_1.default);
router.use(`${constants_1.API_PREFIX}/institutions`, institutions_routes_1.default);
router.use(`${constants_1.API_PREFIX}/invitations`, invitations_routes_1.default);
router.use(`${constants_1.API_PREFIX}/cpd`, cpd_routes_1.default);
router.use(`${constants_1.API_PREFIX}/email`, email_routes_1.default);
router.use(`${constants_1.API_PREFIX}/storage`, storage_routes_1.default); // Storage routes for avatar upload (auth required)
router.use(`${constants_1.API_PREFIX}/institution-links`, institutionLink_routes_1.default); // Institution linking workflow
router.use(`${constants_1.API_PREFIX}/openlearning-courses`, openlearningCourses_routes_1.default); // OpenLearning courses catalog
router.use(`${constants_1.API_PREFIX}/openlearning`, openlearning_routes_1.default); // OpenLearning SSO routes
// router.use(`${API_PREFIX}/openlearning`, openlearningPublicRoutes); // Temporarily disabled
// router.use(`${API_PREFIX}/openlearning-sso`, openlearningSSORoutes); // Temporarily disabled
router.use(`${constants_1.API_PREFIX}/welcome`, welcome_routes_1.default);
router.use(`${constants_1.API_PREFIX}/public`, public_routes_1.default); // Public membership application routes
router.use(`${constants_1.API_PREFIX}/admin/membership-applications`, membershipApplications_routes_1.default); // Admin application management routes
router.use(`${constants_1.API_PREFIX}/admin/email-logs`, emailLogs_routes_1.default); // Email logs admin routes
router.use(`${constants_1.API_PREFIX}/track`, tracking_routes_1.default); // Email tracking routes (public, no auth required)
router.use(`${constants_1.API_PREFIX}/system`, system_routes_1.default); // System status routes (Super Admin only)
// router.use(`${API_PREFIX}/applications`, applicationsRoutes); // Admin application management routes - disabled temporarily
exports.default = router;
//# sourceMappingURL=index.js.map