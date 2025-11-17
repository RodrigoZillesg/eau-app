export declare class WelcomeEmailService {
    private static readonly FRONTEND_URL;
    private static readonly SUPPORT_EMAIL;
    /**
     * Send welcome email to a new member
     * IMPORTANT: Respects SMTP test mode settings
     */
    static sendWelcomeEmail(userId: string, email: string, name: string, institutionId?: string, temporaryPassword?: string): Promise<boolean>;
    /**
     * Send welcome email to multiple members (batch)
     */
    static sendWelcomeEmailBatch(members: Array<{
        userId: string;
        email: string;
        name: string;
        institutionId?: string;
        temporaryPassword?: string;
    }>): Promise<{
        sent: number;
        failed: number;
        details: any[];
    }>;
    /**
     * Generate a password reset token for the user
     */
    private static generatePasswordResetToken;
    /**
     * Generate a secure random token
     */
    private static generateSecureToken;
    /**
     * Resend welcome email to a user
     */
    static resendWelcomeEmail(userId: string): Promise<boolean>;
}
//# sourceMappingURL=welcomeEmail.service.d.ts.map