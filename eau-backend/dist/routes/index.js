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
const openlearning_routes_1 = __importDefault(require("./openlearning.routes"));
const openlearning_public_routes_1 = __importDefault(require("./openlearning-public.routes"));
const constants_1 = require("../config/constants");
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
// API routes
router.use(`${constants_1.API_PREFIX}/auth`, auth_routes_1.default);
router.use(`${constants_1.API_PREFIX}/members`, members_routes_1.default);
router.use(`${constants_1.API_PREFIX}/institutions`, institutions_routes_1.default);
router.use(`${constants_1.API_PREFIX}/invitations`, invitations_routes_1.default);
router.use(`${constants_1.API_PREFIX}/cpd`, cpd_routes_1.default);
router.use(`${constants_1.API_PREFIX}/email`, email_routes_1.default);
router.use(`${constants_1.API_PREFIX}/openlearning`, openlearning_routes_1.default);
router.use(`${constants_1.API_PREFIX}/openlearning`, openlearning_public_routes_1.default); // Public routes (no auth required)
exports.default = router;
//# sourceMappingURL=index.js.map