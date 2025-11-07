"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const routes_1 = __importDefault(require("./routes"));
const database_1 = require("./config/database");
const reportScheduler_service_1 = require("./services/reportScheduler.service");
// import { openLearningSyncScheduler } from './services/openlearningSyncScheduler.service'; // Temporarily disabled
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// CORS Configuration
app.use((0, cors_1.default)({
    origin: ['http://localhost:5180', 'https://eauapp.platty.tech'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
// Middleware
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/', routes_1.default);
// Initialize server
const startServer = async () => {
    try {
        // Test database connection
        const { data, error } = await database_1.supabaseAdmin.from('members').select('count').limit(1);
        if (error)
            throw error;
        console.log('✅ Database connection successful');
        // Initialize Report Scheduler
        reportScheduler_service_1.ReportSchedulerService.init();
        // Initialize OpenLearning Sync Scheduler
        // Temporarily disabled due to TypeScript errors
        // console.log('📊 OpenLearning Sync Scheduler Service initializing...');
        // The scheduler is already initialized when imported
        // console.log('✅ OpenLearning Sync Scheduler Service initialized');
        app.listen(PORT, () => {
            console.log('🚀 =================================');
            console.log('🚀 English Australia Backend API');
            console.log('🚀 Environment:', process.env.NODE_ENV || 'development');
            console.log('🚀 Port:', PORT);
            console.log('🚀 URL: http://localhost:' + PORT);
            console.log('🚀 Health Check: http://localhost:' + PORT + '/health');
            console.log('🚀 API Docs: http://localhost:' + PORT + '/api/v1');
            console.log('🚀 =================================');
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map