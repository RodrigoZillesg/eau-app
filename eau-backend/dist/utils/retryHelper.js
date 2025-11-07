"use strict";
/**
 * Retry utility for handling transient failures with exponential backoff
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryHelper = void 0;
class RetryHelper {
    static defaultConfig = {
        maxAttempts: 3,
        baseDelay: 1000, // 1 second
        maxDelay: 30000, // 30 seconds
        exponentialBase: 2,
        jitter: true
    };
    /**
     * Execute a function with retry logic
     */
    static async execute(fn, config = {}) {
        const finalConfig = { ...this.defaultConfig, ...config };
        const startTime = Date.now();
        let lastError;
        for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
            try {
                console.log(`🔄 Retry attempt ${attempt}/${finalConfig.maxAttempts}`);
                const result = await fn();
                console.log(`✅ Success on attempt ${attempt}`);
                return {
                    success: true,
                    result,
                    attempts: attempt,
                    totalTime: Date.now() - startTime
                };
            }
            catch (error) {
                lastError = error;
                console.error(`❌ Attempt ${attempt} failed:`, error);
                // If this is the last attempt, don't wait
                if (attempt === finalConfig.maxAttempts) {
                    break;
                }
                // Calculate delay for next attempt
                const delay = this.calculateDelay(attempt, finalConfig);
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await this.sleep(delay);
            }
        }
        return {
            success: false,
            error: lastError,
            attempts: finalConfig.maxAttempts,
            totalTime: Date.now() - startTime
        };
    }
    /**
     * Execute with specific retry conditions
     */
    static async executeWithCondition(fn, shouldRetry, config = {}) {
        const finalConfig = { ...this.defaultConfig, ...config };
        const startTime = Date.now();
        let lastError;
        for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
            try {
                console.log(`🔄 Conditional retry attempt ${attempt}/${finalConfig.maxAttempts}`);
                const result = await fn();
                console.log(`✅ Success on attempt ${attempt}`);
                return {
                    success: true,
                    result,
                    attempts: attempt,
                    totalTime: Date.now() - startTime
                };
            }
            catch (error) {
                lastError = error;
                console.error(`❌ Attempt ${attempt} failed:`, error);
                // Check if we should retry this error
                if (!shouldRetry(lastError)) {
                    console.log(`🚫 Error is not retryable, stopping`);
                    break;
                }
                // If this is the last attempt, don't wait
                if (attempt === finalConfig.maxAttempts) {
                    break;
                }
                // Calculate delay for next attempt
                const delay = this.calculateDelay(attempt, finalConfig);
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await this.sleep(delay);
            }
        }
        return {
            success: false,
            error: lastError,
            attempts: finalConfig.maxAttempts,
            totalTime: Date.now() - startTime
        };
    }
    /**
     * Calculate delay with exponential backoff and optional jitter
     */
    static calculateDelay(attempt, config) {
        // Exponential backoff: baseDelay * (exponentialBase ^ (attempt - 1))
        let delay = config.baseDelay * Math.pow(config.exponentialBase, attempt - 1);
        // Apply maximum delay limit
        delay = Math.min(delay, config.maxDelay);
        // Add jitter to avoid thundering herd problem
        if (config.jitter) {
            // Add random jitter ±25%
            const jitterRange = delay * 0.25;
            const jitter = (Math.random() - 0.5) * 2 * jitterRange;
            delay = Math.max(0, delay + jitter);
        }
        return Math.floor(delay);
    }
    /**
     * Sleep for specified milliseconds
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Common retry conditions
     */
    static retryConditions = {
        // Network errors that should be retried
        networkErrors: (error) => {
            const message = error.message.toLowerCase();
            return (message.includes('network') ||
                message.includes('timeout') ||
                message.includes('econnreset') ||
                message.includes('enotfound') ||
                message.includes('econnrefused') ||
                message.includes('socket hang up'));
        },
        // HTTP errors that should be retried (5xx and some 4xx)
        httpErrors: (error) => {
            if (error.response?.status) {
                const status = error.response.status;
                return (status >= 500 || // 5xx server errors
                    status === 408 || // Request timeout
                    status === 409 || // Conflict (might be transient)
                    status === 429 // Too many requests
                );
            }
            return false;
        },
        // Database errors that should be retried
        databaseErrors: (error) => {
            const message = error.message.toLowerCase();
            return (message.includes('connection') ||
                message.includes('timeout') ||
                message.includes('deadlock') ||
                message.includes('lock wait timeout') ||
                message.includes('too many connections'));
        },
        // Combined condition for API calls
        apiErrors: (error) => {
            return (RetryHelper.retryConditions.networkErrors(error) ||
                RetryHelper.retryConditions.httpErrors(error));
        },
        // Combined condition for database operations
        dbErrors: (error) => {
            return (RetryHelper.retryConditions.networkErrors(error) ||
                RetryHelper.retryConditions.databaseErrors(error));
        }
    };
}
exports.RetryHelper = RetryHelper;
//# sourceMappingURL=retryHelper.js.map