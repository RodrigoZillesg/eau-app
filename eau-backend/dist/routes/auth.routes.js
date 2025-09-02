"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_controller_1 = require("../controllers/auth.controller");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
// Login with Supabase Auth
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty().isLength({ min: 6 })
], validation_1.handleValidationErrors, authController.loginWithSupabase);
// Refresh token
router.post('/refresh', [
    (0, express_validator_1.body)('refreshToken').notEmpty()
], validation_1.handleValidationErrors, authController.refreshToken);
// Logout
router.post('/logout', auth_1.authenticate, authController.logout);
// Get current user
router.get('/me', auth_1.authenticate, authController.me);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map