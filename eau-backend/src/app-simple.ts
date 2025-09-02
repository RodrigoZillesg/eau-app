import express from 'express';
import cors from 'cors';

const app = express();

// Minimal middleware
app.use(cors());
app.use(express.json());

// Single health route directly in app
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Ultra-simple EAU Backend',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;