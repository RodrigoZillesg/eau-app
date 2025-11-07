export declare const openLearningService: {
    provisionUser: () => Promise<{
        success: boolean;
        error: string;
    }>;
    generateSSOLaunchUrl: () => Promise<{
        success: boolean;
        error: string;
    }>;
    syncCoursesToCPD: () => Promise<{
        success: boolean;
        error: string;
    }>;
    getCourses: () => Promise<{
        success: boolean;
        error: string;
    }>;
};
//# sourceMappingURL=openlearning.service.d.ts.map