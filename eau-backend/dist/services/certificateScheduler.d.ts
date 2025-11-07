/**
 * Certificate Scheduler Service
 * Automatically processes completed events and generates certificates/CPD
 */
export declare class CertificateScheduler {
    private static isRunning;
    /**
     * Start the automated certificate generation scheduler
     * Runs every hour to process recently completed events
     */
    static startScheduler(): void;
    /**
     * Process immediately (for testing or manual trigger)
     */
    static processNow(): Promise<{
        success: boolean;
        message: any;
    }>;
}
//# sourceMappingURL=certificateScheduler.d.ts.map