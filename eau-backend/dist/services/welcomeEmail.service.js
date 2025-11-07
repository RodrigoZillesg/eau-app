"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WelcomeEmailService = void 0;
const email_service_1 = require("./email.service");
const welcomeEmail_1 = require("../templates/welcomeEmail");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
class WelcomeEmailService {
    static FRONTEND_URL = process.env.FRONTEND_URL || 'https://eauapp.platty.tech';
    static SUPPORT_EMAIL = 'support@englishaustralia.com.au';
    /**
     * Send welcome email to a new member
     * IMPORTANT: Respects SMTP test mode settings
     */
    static async sendWelcomeEmail(userId, email, name, institutionId, temporaryPassword) {
        try {
            // FIRST: Check if SMTP is in test mode
            const smtpSettings = await email_service_1.EmailService.getSMTPSettings();
            if (!smtpSettings || !smtpSettings.enabled) {
                (0, logger_1.logInfo)(`SMTP is disabled. Skipping welcome email for ${email}`);
                return false;
            }
            if (smtpSettings.test_mode) {
                // In test mode, only send to the configured test email
                (0, logger_1.logInfo)(`SMTP in TEST MODE. Would send welcome email to ${email} but redirecting to ${smtpSettings.test_email}`);
                // If no test email configured, don't send at all
                if (!smtpSettings.test_email) {
                    (0, logger_1.logInfo)('No test email configured. Skipping email send.');
                    return false;
                }
                // Replace recipient with test email
                email = smtpSettings.test_email;
                (0, logger_1.logInfo)(`Redirecting welcome email to test address: ${email}`);
            }
            (0, logger_1.logInfo)(`Preparing welcome email for ${email}`);
            // Get institution name if provided
            let institutionName = 'English Australia';
            if (institutionId) {
                const { data: institution } = await database_1.supabaseAdmin
                    .from('institutions')
                    .select('name')
                    .eq('id', institutionId)
                    .single();
                if (institution) {
                    institutionName = institution.name;
                }
            }
            // Generate password reset token
            const resetToken = await this.generatePasswordResetToken(userId, email);
            const resetPasswordUrl = `${this.FRONTEND_URL}/reset-password?token=${resetToken}`;
            // Prepare email data
            const emailData = {
                recipientName: name || email.split('@')[0],
                recipientEmail: email,
                institutionName,
                temporaryPassword,
                resetPasswordUrl,
                loginUrl: `${this.FRONTEND_URL}/login`,
                supportEmail: this.SUPPORT_EMAIL
            };
            // Generate email content
            const html = (0, welcomeEmail_1.generateWelcomeEmailHTML)(emailData);
            const text = (0, welcomeEmail_1.generateWelcomeEmailText)(emailData);
            // Send email
            const result = await email_service_1.EmailService.sendEmail({
                to: email,
                subject: '🎓 Welcome to English Australia - Your Account is Ready!',
                html,
                text
            });
            if (result.success) {
                (0, logger_1.logInfo)(`Welcome email sent successfully to ${email}`);
                // Record email sent in database
                await this.recordEmailSent(userId, email, 'welcome');
                return true;
            }
            else {
                (0, logger_1.logError)(new Error(`Failed to send welcome email: ${result.message}`));
                return false;
            }
        }
        catch (error) {
            (0, logger_1.logError)(error instanceof Error ? error : new Error('Failed to send welcome email'));
            return false;
        }
    }
    /**
     * Send welcome email to multiple members (batch)
     */
    static async sendWelcomeEmailBatch(members) {
        const results = {
            sent: 0,
            failed: 0,
            details: []
        };
        for (const member of members) {
            try {
                const sent = await this.sendWelcomeEmail(member.userId, member.email, member.name, member.institutionId, member.temporaryPassword);
                if (sent) {
                    results.sent++;
                    results.details.push({
                        email: member.email,
                        status: 'sent',
                        timestamp: new Date().toISOString()
                    });
                }
                else {
                    results.failed++;
                    results.details.push({
                        email: member.email,
                        status: 'failed',
                        timestamp: new Date().toISOString()
                    });
                }
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            catch (error) {
                results.failed++;
                results.details.push({
                    email: member.email,
                    status: 'error',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
        (0, logger_1.logInfo)(`Welcome email batch completed: ${results.sent} sent, ${results.failed} failed`);
        return results;
    }
    /**
     * Generate a password reset token for the user
     */
    static async generatePasswordResetToken(userId, email) {
        try {
            // Create a password reset token in the database
            const token = this.generateSecureToken();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 72); // 72 hours validity for first login
            // Store token in database (you might need to create this table)
            const { error } = await database_1.supabaseAdmin
                .from('password_reset_tokens')
                .insert({
                user_id: userId,
                email,
                token,
                expires_at: expiresAt.toISOString(),
                used: false,
                type: 'welcome' // Different from regular password reset
            });
            if (error) {
                (0, logger_1.logError)(new Error(`Failed to create password reset token: ${error.message}`));
                // Fallback to a simple encoded token
                return Buffer.from(`${userId}:${email}:${Date.now()}`).toString('base64');
            }
            return token;
        }
        catch (error) {
            (0, logger_1.logError)(error instanceof Error ? error : new Error('Error generating password reset token'));
            // Fallback to a simple encoded token
            return Buffer.from(`${userId}:${email}:${Date.now()}`).toString('base64');
        }
    }
    /**
     * Generate a secure random token
     */
    static generateSecureToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < length; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }
    /**
     * Record that an email was sent
     */
    static async recordEmailSent(userId, email, type) {
        try {
            await database_1.supabaseAdmin
                .from('email_logs')
                .insert({
                user_id: userId,
                recipient_email: email,
                email_type: type,
                sent_at: new Date().toISOString(),
                status: 'sent'
            });
        }
        catch (error) {
            // Don't fail if we can't log the email
            (0, logger_1.logError)(error instanceof Error ? error : new Error('Failed to record email sent'));
        }
    }
    /**
     * Resend welcome email to a user
     */
    static async resendWelcomeEmail(userId) {
        try {
            // Get user details
            const { data: userData, error: userError } = await database_1.supabaseAdmin.auth.admin.getUserById(userId);
            if (userError || !userData?.user) {
                (0, logger_1.logError)(new Error(userError?.message || 'User not found'));
                return false;
            }
            const user = userData.user;
            // Get member details
            const { data: member } = await database_1.supabaseAdmin
                .from('members')
                .select('full_name, institution_id')
                .eq('user_id', userId)
                .single();
            return await this.sendWelcomeEmail(userId, user.email, member?.full_name || user.email.split('@')[0], member?.institution_id);
        }
        catch (error) {
            (0, logger_1.logError)(error instanceof Error ? error : new Error('Failed to resend welcome email'));
            return false;
        }
    }
}
exports.WelcomeEmailService = WelcomeEmailService;
//# sourceMappingURL=welcomeEmail.service.js.map