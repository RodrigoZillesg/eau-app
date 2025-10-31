import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes';
import { supabaseAdmin } from './config/database';
import { ReportSchedulerService } from './services/reportScheduler.service';
import { openLearningSyncScheduler } from './services/openlearningSyncScheduler.service';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Configuration
app.use(cors({
  origin: ['http://localhost:5180', 'https://eauapp.platty.tech'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', routes);

// Initialize server
const startServer = async () => {
  try {
    // Test database connection
    const { data, error } = await supabaseAdmin.from('members').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful');

    // Initialize Report Scheduler
    ReportSchedulerService.init();

    // Initialize OpenLearning Sync Scheduler
    console.log('📊 OpenLearning Sync Scheduler Service initializing...');
    // The scheduler is already initialized when imported
    console.log('✅ OpenLearning Sync Scheduler Service initialized');

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
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();