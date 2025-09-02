"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logWarning = exports.logInfo = exports.logError = exports.productionFormat = exports.developmentFormat = void 0;
const morgan_1 = __importDefault(require("morgan"));
// Custom morgan token for user ID
morgan_1.default.token('user-id', (req) => {
    return req.user?.id || 'anonymous';
});
// Custom morgan token for institution ID
morgan_1.default.token('institution-id', (req) => {
    return req.user?.institutionId || 'none';
});
// Development logging format
exports.developmentFormat = ':method :url :status :response-time ms - :res[content-length] - user: :user-id';
// Production logging format (more detailed)
exports.productionFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms - user: :user-id - institution: :institution-id';
// Error logging function
const logError = (error, req, res) => {
    const timestamp = new Date().toISOString();
    const method = req?.method || 'N/A';
    const url = req?.url || 'N/A';
    const userId = req?.user?.id || 'anonymous';
    console.error(`[${timestamp}] ERROR: ${method} ${url} - User: ${userId}`);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
};
exports.logError = logError;
// Info logging function
const logInfo = (message, data) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`);
    if (data) {
        console.log('Data:', JSON.stringify(data, null, 2));
    }
};
exports.logInfo = logInfo;
// Warning logging function
const logWarning = (message, data) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARNING: ${message}`);
    if (data) {
        console.warn('Data:', JSON.stringify(data, null, 2));
    }
};
exports.logWarning = logWarning;
//# sourceMappingURL=logger.js.map