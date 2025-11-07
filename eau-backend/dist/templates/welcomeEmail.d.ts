export interface WelcomeEmailData {
    recipientName: string;
    recipientEmail: string;
    institutionName: string;
    temporaryPassword?: string;
    resetPasswordUrl: string;
    loginUrl: string;
    supportEmail: string;
}
export declare const generateWelcomeEmailHTML: (data: WelcomeEmailData) => string;
export declare const generateWelcomeEmailText: (data: WelcomeEmailData) => string;
//# sourceMappingURL=welcomeEmail.d.ts.map