interface SyncResult {
    success: boolean;
    membersProcessed: number;
    coursesImported: number;
    cpdActivitiesCreated: number;
    errors: string[];
    executionTime: number;
}
export declare class OpenLearningSyncScheduler {
    private static instance;
    private syncInProgress;
    private lastSyncTime;
    private constructor();
    static getInstance(): OpenLearningSyncScheduler;
    /**
     * Initialize the daily scheduler
     */
    private initializeScheduler;
    /**
     * Perform manual sync
     */
    performManualSync(): Promise<SyncResult>;
    /**
     * Perform sync triggered by webhook
     */
    performWebhookSync(): Promise<SyncResult>;
    /**
     * Main sync function
     */
    private performSync;
    /**
     * Calculate CPD points for a course
     */
    private calculateCPDPoints;
    /**
     * Update sync log with results
     */
    private updateSyncLog;
    /**
     * Get sync status
     */
    getSyncStatus(): {
        syncInProgress: boolean;
        lastSyncTime: Date | null;
    };
    /**
     * Get recent sync logs
     */
    getSyncLogs(limit?: number): Promise<any[]>;
    /**
     * Get sync statistics
     */
    getSyncStats(): Promise<any>;
}
export declare const openLearningSyncScheduler: OpenLearningSyncScheduler;
export {};
//# sourceMappingURL=openlearningSyncScheduler.service.d.ts.map