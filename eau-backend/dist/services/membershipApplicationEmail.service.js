"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipApplicationEmailService = void 0;
const email_service_1 = require("./email.service");
const logger_1 = require("../utils/logger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class MembershipApplicationEmailService {
    static TEMPLATES_DIR = path_1.default.join(__dirname, '../templates');
    static LOGIN_URL = process.env.FRONTEND_URL || 'https://eauapp.platty.tech/login';
    /**
     * Send application approval email
     */
    static async sendApprovalEmail(applicationData, applicationId, institutionId, memberId, reviewNotes) {
        try {
            (0, logger_1.logInfo)('Sending application approval email', {
                applicationId,
                email: applicationData.contactPersonEmail
            });
            const emailData = {
                contactPersonName: applicationData.contactPersonName,
                institutionName: applicationData.institutionName,
                membershipType: applicationData.membershipType,
                contactPersonEmail: applicationData.contactPersonEmail,
                applicationId,
                institutionId,
                memberId,
                reviewNotes,
                loginUrl: this.LOGIN_URL
            };
            const htmlContent = await this.loadAndProcessTemplate('membership-application-approved.html', emailData);
            await email_service_1.EmailService.sendEmail({
                to: applicationData.contactPersonEmail,
                subject: '🎉 Your English Australia Membership Application Has Been Approved!',
                html: htmlContent,
                text: this.generateApprovalTextContent(emailData)
            });
            (0, logger_1.logInfo)('Application approval email sent successfully', { applicationId });
        }
        catch (error) {
            (0, logger_1.logError)(error);
            throw new Error('Failed to send approval email');
        }
    }
    /**
     * Send application rejection email
     */
    static async sendRejectionEmail(applicationData, applicationId, reviewNotes) {
        try {
            (0, logger_1.logInfo)('Sending application rejection email', {
                applicationId,
                email: applicationData.contactPersonEmail
            });
            const emailData = {
                contactPersonName: applicationData.contactPersonName,
                institutionName: applicationData.institutionName,
                membershipType: applicationData.membershipType,
                contactPersonEmail: applicationData.contactPersonEmail,
                applicationId,
                reviewNotes
            };
            const htmlContent = await this.loadAndProcessTemplate('membership-application-rejected.html', emailData);
            await email_service_1.EmailService.sendEmail({
                to: applicationData.contactPersonEmail,
                subject: 'English Australia Membership Application Update',
                html: htmlContent,
                text: this.generateRejectionTextContent(emailData)
            });
            (0, logger_1.logInfo)('Application rejection email sent successfully', { applicationId });
        }
        catch (error) {
            (0, logger_1.logError)(error);
            throw new Error('Failed to send rejection email');
        }
    }
    /**
     * Send application received confirmation email
     */
    static async sendApplicationReceivedEmail(applicationData, applicationId) {
        try {
            (0, logger_1.logInfo)('Sending application received confirmation email', {
                applicationId,
                email: applicationData.contactPersonEmail
            });
            const subject = 'Application Received - English Australia Membership';
            const htmlContent = this.generateReceivedEmailHTML(applicationData, applicationId);
            const textContent = this.generateReceivedEmailText(applicationData, applicationId);
            await email_service_1.EmailService.sendEmail({
                to: applicationData.contactPersonEmail,
                subject,
                html: htmlContent,
                text: textContent
            });
            (0, logger_1.logInfo)('Application received email sent successfully', { applicationId });
        }
        catch (error) {
            (0, logger_1.logError)(error);
            // Don't throw error for confirmation email failures
            (0, logger_1.logError)(new Error('Failed to send application received confirmation email'));
        }
    }
    /**
     * Load HTML template and replace variables
     */
    static async loadAndProcessTemplate(templateName, data) {
        try {
            const templatePath = path_1.default.join(this.TEMPLATES_DIR, templateName);
            let htmlContent = fs_1.default.readFileSync(templatePath, 'utf8');
            // Replace template variables
            htmlContent = htmlContent.replace(/{{contactPersonName}}/g, data.contactPersonName);
            htmlContent = htmlContent.replace(/{{institutionName}}/g, data.institutionName);
            htmlContent = htmlContent.replace(/{{membershipType}}/g, data.membershipType);
            htmlContent = htmlContent.replace(/{{applicationId}}/g, data.applicationId);
            htmlContent = htmlContent.replace(/{{loginUrl}}/g, data.loginUrl || this.LOGIN_URL);
            if (data.institutionId) {
                htmlContent = htmlContent.replace(/{{institutionId}}/g, data.institutionId);
            }
            if (data.memberId) {
                htmlContent = htmlContent.replace(/{{memberId}}/g, data.memberId);
            }
            // Handle conditional review notes
            if (data.reviewNotes) {
                htmlContent = htmlContent.replace(/{{#if reviewNotes}}/g, '');
                htmlContent = htmlContent.replace(/{{\/if}}/g, '');
                htmlContent = htmlContent.replace(/{{reviewNotes}}/g, data.reviewNotes);
            }
            else {
                // Remove the conditional block if no review notes
                htmlContent = htmlContent.replace(/{{#if reviewNotes}}[\s\S]*?{{\/if}}/g, '');
            }
            return htmlContent;
        }
        catch (error) {
            (0, logger_1.logError)(error);
            throw new Error(`Failed to load template: ${templateName}`);
        }
    }
    /**
     * Generate approval email text content
     */
    static generateApprovalTextContent(data) {
        return `
Dear ${data.contactPersonName},

Congratulations! Your English Australia membership application has been APPROVED.

Institution: ${data.institutionName}
Membership Type: ${data.membershipType}
Institution ID: ${data.institutionId || 'TBD'}
Member ID: ${data.memberId || 'TBD'}

${data.reviewNotes ? `Review Comments: ${data.reviewNotes}` : ''}

Next Steps:
1. Account Setup - You will receive separate login credentials
2. Payment Processing - Invoice will be sent separately  
3. Welcome Package - Complete materials via email
4. Access Benefits - You can now access all member benefits

Access your member portal: ${data.loginUrl}

If you have any questions, please contact our member services team.

Best regards,
English Australia Team
admin@englishaustralia.com.au
www.englishaustralia.com.au
    `.trim();
    }
    /**
     * Generate rejection email text content
     */
    static generateRejectionTextContent(data) {
        return `
Dear ${data.contactPersonName},

Thank you for your interest in English Australia membership.

After careful review, we regret to inform you that ${data.institutionName}'s membership application cannot be approved at this time.

${data.reviewNotes ? `Review Comments: ${data.reviewNotes}` : ''}

You are welcome to address any concerns raised and submit a new application in the future.

If you have any questions about this decision, please contact our team.

Best regards,
English Australia Team
admin@englishaustralia.com.au
www.englishaustralia.com.au
    `.trim();
    }
    /**
     * Generate application received confirmation email HTML
     */
    static generateReceivedEmailHTML(data, applicationId) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #065f46; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 15px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Application Received</h1>
        </div>
        <div class="content">
            <p>Dear ${data.contactPersonName},</p>
            
            <p>Thank you for submitting your English Australia membership application for <strong>${data.institutionName}</strong>.</p>
            
            <p><strong>Application Details:</strong></p>
            <ul>
                <li>Application ID: ${applicationId}</li>
                <li>Institution: ${data.institutionName}</li>
                <li>Membership Type: ${data.membershipType}</li>
                <li>Submitted: ${new Date().toLocaleDateString()}</li>
            </ul>
            
            <p><strong>What happens next?</strong></p>
            <ul>
                <li>Our team will review your application within 5-10 business days</li>
                <li>You'll receive email updates on your application status</li>
                <li>We may contact you if additional information is needed</li>
            </ul>
            
            <p>If you have any questions, please contact us at admin@englishaustralia.com.au</p>
            
            <p>Best regards,<br>English Australia Team</p>
        </div>
        <div class="footer">
            <p>English Australia - The national peak body for ELICOS<br>
            This is an automated message. Please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>
    `;
    }
    /**
     * Generate application received confirmation email text
     */
    static generateReceivedEmailText(data, applicationId) {
        return `
Dear ${data.contactPersonName},

Thank you for submitting your English Australia membership application for ${data.institutionName}.

Application Details:
- Application ID: ${applicationId}
- Institution: ${data.institutionName}
- Membership Type: ${data.membershipType}
- Submitted: ${new Date().toLocaleDateString()}

What happens next?
1. Our team will review your application within 5-10 business days
2. You'll receive email updates on your application status
3. We may contact you if additional information is needed

If you have any questions, please contact us at admin@englishaustralia.com.au

Best regards,
English Australia Team
www.englishaustralia.com.au
    `.trim();
    }
}
exports.MembershipApplicationEmailService = MembershipApplicationEmailService;
//# sourceMappingURL=membershipApplicationEmail.service.js.map