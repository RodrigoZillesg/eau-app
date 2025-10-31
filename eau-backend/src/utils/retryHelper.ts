/**
 * Retry utility for handling transient failures with exponential backoff
 */

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
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

export class RetryHelper {
  private static defaultConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    exponentialBase: 2,
    jitter: true
  };

  /**
   * Execute a function with retry logic
   */
  static async execute<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    let lastError: Error | undefined;

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
      } catch (error) {
        lastError = error as Error;
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
  static async executeWithCondition<T>(
    fn: () => Promise<T>,
    shouldRetry: (error: Error) => boolean,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    let lastError: Error | undefined;

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
      } catch (error) {
        lastError = error as Error;
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
  private static calculateDelay(attempt: number, config: RetryConfig): number {
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
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Common retry conditions
   */
  static retryConditions = {
    // Network errors that should be retried
    networkErrors: (error: Error): boolean => {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('econnreset') ||
        message.includes('enotfound') ||
        message.includes('econnrefused') ||
        message.includes('socket hang up')
      );
    },

    // HTTP errors that should be retried (5xx and some 4xx)
    httpErrors: (error: any): boolean => {
      if (error.response?.status) {
        const status = error.response.status;
        return (
          status >= 500 || // 5xx server errors
          status === 408 || // Request timeout
          status === 409 || // Conflict (might be transient)
          status === 429    // Too many requests
        );
      }
      return false;
    },

    // Database errors that should be retried
    databaseErrors: (error: Error): boolean => {
      const message = error.message.toLowerCase();
      return (
        message.includes('connection') ||
        message.includes('timeout') ||
        message.includes('deadlock') ||
        message.includes('lock wait timeout') ||
        message.includes('too many connections')
      );
    },

    // Combined condition for API calls
    apiErrors: (error: any): boolean => {
      return (
        RetryHelper.retryConditions.networkErrors(error) ||
        RetryHelper.retryConditions.httpErrors(error)
      );
    },

    // Combined condition for database operations
    dbErrors: (error: Error): boolean => {
      return (
        RetryHelper.retryConditions.networkErrors(error) ||
        RetryHelper.retryConditions.databaseErrors(error)
      );
    }
  };
}