import { Request, Response } from 'express';
export declare class EmailController {
    /**
     * Send a test email
     */
    static sendTestEmail(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Test SMTP connection
     */
    static testConnection(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Send a generic email
     */
    static sendEmail(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Send event registration confirmation
     */
    static sendEventRegistration(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Send CPD points notification
     */
    static sendCPDNotification(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get SMTP settings
     */
    static getSMTPSettings(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Save SMTP settings
     */
    static saveSMTPSettings(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Create event reminders
     */
    static createReminders(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=email.controller.d.ts.map