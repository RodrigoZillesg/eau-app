// API Configuration
export const API_CONFIG = {
  // Use the backend service running on port 3001
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  API_PREFIX: '/api/v1',
  
  // Endpoints
  ENDPOINTS: {
    // Auth
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    
    // Email
    EMAIL_TEST: '/email/test',
    EMAIL_SEND: '/email/send',
    EMAIL_TEST_CONNECTION: '/email/test-connection',
    EMAIL_EVENT_REGISTRATION: '/email/event-registration',
    EMAIL_CPD_NOTIFICATION: '/email/cpd-notification',
    
    // Members
    MEMBERS: '/members',
    
    // CPD
    CPD: '/cpd',
    
    // Other endpoints...
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${endpoint}`;
};