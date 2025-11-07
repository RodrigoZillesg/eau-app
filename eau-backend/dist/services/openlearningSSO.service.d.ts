interface SSOParams {
    userId: string;
    email: string;
    fullName: string;
    returnUrl?: string;
}
declare class OpenLearningSSOService {
    private apiKey;
    private institutionId;
    constructor();
    /**
     * Generate OAuth 1.0 signature for SSO
     */
    private generateOAuthSignature;
    /**
     * Generate SSO link for a user
     */
    generateSSOLink(params: SSOParams): Promise<{
        success: boolean;
        url: any;
        method: any;
        params: any;
        openlearningUserId: any;
    }>;
    /**
     * Search for existing user by email
     */
    findUserByEmail(email: string): Promise<string | null>;
    /**
     * Provision a new user in OpenLearning
     */
    provisionUser(params: {
        externalId: string;
        email: string;
        fullName: string;
    }): Promise<{
        success: boolean;
        userId: string;
        externalId: string;
        alreadyExists: boolean;
        error?: undefined;
    } | {
        success: boolean;
        userId: any;
        externalId: string;
        alreadyExists?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        userId?: undefined;
        externalId?: undefined;
        alreadyExists?: undefined;
    }>;
    /**
     * Get user's course completions
     */
    getUserCourseCompletions(openlearningUserId: string): Promise<any>;
    /**
     * Import course completions as CPD activities
     */
    importCertificatesAsCPD(memberId: string, openlearningUserId: string): Promise<{
        success: boolean;
        imported: number;
        message: string;
        total?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        imported: number;
        total: any;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        imported: number;
        error: any;
        message?: undefined;
        total?: undefined;
    }>;
    /**
     * Sync all OpenLearning users with our database
     */
    syncAllUsers(): Promise<number>;
}
export declare const openLearningSSOService: OpenLearningSSOService;
export {};
//# sourceMappingURL=openlearningSSO.service.d.ts.map