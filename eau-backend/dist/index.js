"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const logger_1 = require("./utils/logger");
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
async function startServer() {
    try {
        // Test database connection
        const { supabaseAdmin } = await Promise.resolve().then(() => __importStar(require('./config/database')));
        const { error } = await supabaseAdmin
            .from('members')
            .select('count', { count: 'exact', head: true });
        if (error) {
            console.error('❌ Database connection failed:', error.message);
            process.exit(1);
        }
        (0, logger_1.logInfo)('✅ Database connection successful');
        // Start server
        const server = app_1.default.listen(PORT, () => {
            console.log('🚀 =================================');
            console.log(`🚀 English Australia Backend API`);
            console.log(`🚀 Environment: ${NODE_ENV}`);
            console.log(`🚀 Port: ${PORT}`);
            console.log(`🚀 URL: http://localhost:${PORT}`);
            console.log(`🚀 Health Check: http://localhost:${PORT}/health`);
            console.log(`🚀 API Docs: http://localhost:${PORT}/api/v1`);
            console.log('🚀 =================================');
        });
        // Handle server errors
        server.on('error', (error) => {
            console.error('❌ Server error:', error);
            process.exit(1);
        });
        return server;
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Start the server
startServer().catch((error) => {
    console.error('❌ Startup error:', error);
    process.exit(1);
});
exports.default = app_1.default;
//# sourceMappingURL=index.js.map