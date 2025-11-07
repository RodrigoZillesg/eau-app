import { MembershipApplicationData } from './membershipApplication.service';
export declare class MembershipApplicationEmailService {
    private static readonly TEMPLATES_DIR;
    private static readonly LOGIN_URL;
    /**
     * Send application approval email
     */
    static sendApprovalEmail(applicationData: MembershipApplicationData, applicationId: string, institutionId: string, memberId: string, reviewNotes?: string): Promise<void>;
    /**
     * Send application rejection email
     */
    static sendRejectionEmail(applicationData: MembershipApplicationData, applicationId: string, reviewNotes: string): Promise<void>;
    /**
     * Send application received confirmation email
     */
    static sendApplicationReceivedEmail(applicationData: MembershipApplicationData, applicationId: string): Promise<void>;
    /**
     * Load HTML template and replace variables
     */
    private static loadAndProcessTemplate;
    /**
     * Generate approval email text content
     */
    private static generateApprovalTextContent;
    /**
     * Generate rejection email text content
     */
    private static generateRejectionTextContent;
    /**
     * Generate application received confirmation email HTML
     */
    private static generateReceivedEmailHTML;
    /**
     * Generate application received confirmation email text
     */
    private static generateReceivedEmailText;
}
//# sourceMappingURL=membershipApplicationEmail.service.d.ts.map