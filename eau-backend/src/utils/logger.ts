import morgan from 'morgan';
import { Request, Response } from 'express';

// Custom morgan token for user ID
morgan.token('user-id', (req: any) => {
  return req.user?.id || 'anonymous';
});

// Custom morgan token for institution ID
morgan.token('institution-id', (req: any) => {
  return req.user?.institutionId || 'none';
});

// Development logging format
export const developmentFormat = ':method :url :status :response-time ms - :res[content-length] - user: :user-id';

// Production logging format (more detailed)
export const productionFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms - user: :user-id - institution: :institution-id';

// Error logging function
export const logError = (error: Error, req?: Request, res?: Response) => {
  const timestamp = new Date().toISOString();
  const method = req?.method || 'N/A';
  const url = req?.url || 'N/A';
  const userId = (req as any)?.user?.id || 'anonymous';
  
  console.error(`[${timestamp}] ERROR: ${method} ${url} - User: ${userId}`);
  console.error('Error details:', error.message);
  console.error('Stack trace:', error.stack);
};

// Info logging function
export const logInfo = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] INFO: ${message}`);
  if (data) {
    console.log('Data:', JSON.stringify(data, null, 2));
  }
};

// Warning logging function
export const logWarning = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}] WARNING: ${message}`);
  if (data) {
    console.warn('Data:', JSON.stringify(data, null, 2));
  }
};