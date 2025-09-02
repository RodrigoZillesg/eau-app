export const API_PREFIX = '/api/v1';

export const MEMBERSHIP_TYPES = {
  FULL_PROVIDER: 'full_provider',
  ASSOCIATE: 'associate',
  CORPORATE: 'corporate',
  PROFESSIONAL: 'professional'
} as const;

export const INSTITUTION_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
} as const;

export const PAYMENT_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue',
  GRACE_PERIOD: 'grace_period'
} as const;

export const USER_TYPES = {
  SUPER_ADMIN: 'super_admin',
  INSTITUTION_ADMIN: 'institution_admin',
  STAFF: 'staff',
  TEACHER: 'teacher',
  LIMITED: 'limited'
} as const;

export const CPD_POINTS = {
  YEARLY_TARGET: 20,
  ACTIVITY_TYPES: {
    EVENT: 2,
    WEBINAR: 1,
    ONLINE_COURSE: 1,
    PEER_OBSERVATION: 1,
    PROFESSIONAL_READING: 0.5
  }
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_TOKEN: 'Invalid or expired token',
  USER_NOT_FOUND: 'User not found',
  INSTITUTION_NOT_FOUND: 'Institution not found',
  INVALID_CREDENTIALS: 'Invalid credentials',
  SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later'
} as const;