/**
 * OpenLearning Correct Service - Implementação seguindo documentação oficial
 *
 * Baseado na documentação: https://help.openlearning.com/t/k9slj4/openlearning-api-user-provisioning-and-single-sign-on-with-lti
 * API Docs: https://api.openlearning.com/v2.2/docs
 */
export declare class OpenLearningCorrectService {
    private axiosInstance;
    private config;
    constructor();
    /**
     * Provision a managed user account in OpenLearning
     * API: POST /institutions/{institution_id}/managed-users/
     */
    provisionUser(memberId: string, userData: {
        fullName: string;
        email: string;
        externalId?: string;
    }): Promise<{
        success: boolean;
        openLearningUserId?: string;
        error?: string;
    }>;
    /**
     * Generate SSO launch URL for a member
     * API: POST /institutions/{institution_id}/managed-users/{user_id}/sign-on/
     */
    generateSSOLaunchUrl(memberId: string, openLearningUserId: string, classId?: string): Promise<{
        success: boolean;
        launchUrl?: string;
        launchData?: any;
        error?: string;
    }>;
    /**
     * Set the API key (call this after getting the real API key)
     */
    setApiKey(apiKey: string): void;
    /**
     * Get institution information to verify API key
     */
    verifyApiKey(): Promise<{
        success: boolean;
        institutionData?: any;
        error?: string;
    }>;
    /**
     * Get list of courses from OpenLearning institution
     */
    getCourses(): Promise<{
        success: boolean;
        courses?: any[];
        error?: string;
    }>;
}
export declare const openLearningCorrectService: OpenLearningCorrectService;
//# sourceMappingURL=openlearningCorrect.service.d.ts.map