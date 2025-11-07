"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const email_controller_1 = require("../controllers/email.controller");
const supabaseAuth_1 = require("../middleware/supabaseAuth");
const router = (0, express_1.Router)();
// Apply authentication middleware
router.use(supabaseAuth_1.authenticateSupabase);
// SMTP settings routes
router.get('/settings', email_controller_1.EmailController.getSMTPSettings);
router.post('/settings', email_controller_1.EmailController.saveSMTPSettings);
// Test routes
router.post('/test', email_controller_1.EmailController.sendTestEmail);
router.get('/test-connection', email_controller_1.EmailController.testConnection);
// Generic email sending
router.post('/send', email_controller_1.EmailController.sendEmail);
// Specific email types
router.post('/event-registration', email_controller_1.EmailController.sendEventRegistration);
router.post('/cpd-notification', email_controller_1.EmailController.sendCPDNotification);
exports.default = router;
//# sourceMappingURL=email.routes.js.map