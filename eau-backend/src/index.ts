import app from './app';
import { logInfo } from './utils/logger';

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    // Test database connection
    const { supabaseAdmin } = await import('./config/database');
    const { error } = await supabaseAdmin
      .from('members')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }

    logInfo('✅ Database connection successful');

    // Start server
    const server = app.listen(PORT, () => {
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
    server.on('error', (error: Error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  console.error('❌ Startup error:', error);
  process.exit(1);
});

export default app;