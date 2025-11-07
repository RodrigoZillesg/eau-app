/**
 * Retry utility for handling transient failures with exponential backoff
 */
interface RetryConfig {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    exponentialBase: number;
    jitter: boolean;
}
interface RetryResult<T> {
    success: boolean;
    result?: T;
    error?: Error;
    attempts: number;
    totalTime: number;
}
export declare class RetryHelper {
    private static defaultConfig;
    /**
     * Execute a function with retry logic
     */
    static execute<T>(fn: () => Promise<T>, config?: Partial<RetryConfig>): Promise<RetryResult<T>>;
    /**
     * Execute with specific retry conditions
     */
    static executeWithCondition<T>(fn: () => Promise<T>, shouldRetry: (error: Error) => boolean, config?: Partial<RetryConfig>): Promise<RetryResult<T>>;
    /**
     * Calculate delay with exponential backoff and optional jitter
     */
    private static calculateDelay;
    /**
     * Sleep for specified milliseconds
     */
    private static sleep;
    /**
     * Common retry conditions
     */
    static retryConditions: {
        networkErrors: (error: Error) => boolean;
        httpErrors: (error: any) => boolean;
        databaseErrors: (error: Error) => boolean;
        apiErrors: (error: any) => boolean;
        dbErrors: (error: Error) => boolean;
    };
}
export {};
//# sourceMappingURL=retryHelper.d.ts.map