"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateScheduler = void 0;
const eventRegistrationService_1 = require("../../eau-members/src/services/eventRegistrationService");
const node_cron_1 = __importDefault(require("node-cron"));
/**
 * Certificate Scheduler Service
 * Automatically processes completed events and generates certificates/CPD
 */
class CertificateScheduler {
    static isRunning = false;
    /**
     * Start the automated certificate generation scheduler
     * Runs every hour to process recently completed events
     */
    static startScheduler() {
        // Run every hour at minute 0
        node_cron_1.default.schedule('0 * * * *', async () => {
            if (this.isRunning) {
                console.log('Certificate processor already running, skipping...');
                return;
            }
            this.isRunning = true;
            console.log(`[${new Date().toISOString()}] Starting automatic certificate processing...`);
            try {
                await eventRegistrationService_1.EventRegistrationService.processCompletedEvents();
                console.log('Certificate processing completed successfully');
            }
            catch (error) {
                console.error('Error in certificate scheduler:', error);
            }
            finally {
                this.isRunning = false;
            }
        });
        console.log('Certificate scheduler started - will run every hour');
    }
    /**
     * Process immediately (for testing or manual trigger)
     */
    static async processNow() {
        if (this.isRunning) {
            return { success: false, message: 'Already processing' };
        }
        this.isRunning = true;
        try {
            await eventRegistrationService_1.EventRegistrationService.processCompletedEvents();
            return { success: true, message: 'Processing completed' };
        }
        catch (error) {
            return { success: false, message: error.message };
        }
        finally {
            this.isRunning = false;
        }
    }
}
exports.CertificateScheduler = CertificateScheduler;
// Start the scheduler when this module is imported
// Uncomment the line below to activate automatic processing
// CertificateScheduler.startScheduler();
//# sourceMappingURL=certificateScheduler.js.map