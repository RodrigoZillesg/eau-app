"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_MESSAGES = exports.CPD_POINTS = exports.USER_TYPES = exports.PAYMENT_STATUS = exports.INSTITUTION_STATUS = exports.MEMBERSHIP_TYPES = exports.API_PREFIX = void 0;
exports.API_PREFIX = '/api/v1';
exports.MEMBERSHIP_TYPES = {
    FULL_PROVIDER: 'full_provider',
    ASSOCIATE: 'associate',
    CORPORATE: 'corporate',
    PROFESSIONAL: 'professional'
};
exports.INSTITUTION_STATUS = {
    PENDING: 'pending',
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled'
};
exports.PAYMENT_STATUS = {
    PAID: 'paid',
    PENDING: 'pending',
    OVERDUE: 'overdue',
    GRACE_PERIOD: 'grace_period'
};
exports.USER_TYPES = {
    SUPER_ADMIN: 'super_admin',
    INSTITUTION_ADMIN: 'institution_admin',
    STAFF: 'staff',
    TEACHER: 'teacher',
    LIMITED: 'limited'
};
exports.CPD_POINTS = {
    YEARLY_TARGET: 20,
    ACTIVITY_TYPES: {
        EVENT: 2,
        WEBINAR: 1,
        ONLINE_COURSE: 1,
        PEER_OBSERVATION: 1,
        PROFESSIONAL_READING: 0.5
    }
};
exports.ERROR_MESSAGES = {
    UNAUTHORIZED: 'Unauthorized access',
    INVALID_TOKEN: 'Invalid or expired token',
    USER_NOT_FOUND: 'User not found',
    INSTITUTION_NOT_FOUND: 'Institution not found',
    INVALID_CREDENTIALS: 'Invalid credentials',
    SERVER_ERROR: 'Internal server error',
    VALIDATION_ERROR: 'Validation error',
    RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later'
};
//# sourceMappingURL=constants.js.map