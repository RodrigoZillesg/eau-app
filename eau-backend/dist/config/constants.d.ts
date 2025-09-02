export declare const API_PREFIX = "/api/v1";
export declare const MEMBERSHIP_TYPES: {
    readonly FULL_PROVIDER: "full_provider";
    readonly ASSOCIATE: "associate";
    readonly CORPORATE: "corporate";
    readonly PROFESSIONAL: "professional";
};
export declare const INSTITUTION_STATUS: {
    readonly PENDING: "pending";
    readonly ACTIVE: "active";
    readonly SUSPENDED: "suspended";
    readonly EXPIRED: "expired";
    readonly CANCELLED: "cancelled";
};
export declare const PAYMENT_STATUS: {
    readonly PAID: "paid";
    readonly PENDING: "pending";
    readonly OVERDUE: "overdue";
    readonly GRACE_PERIOD: "grace_period";
};
export declare const USER_TYPES: {
    readonly SUPER_ADMIN: "super_admin";
    readonly INSTITUTION_ADMIN: "institution_admin";
    readonly STAFF: "staff";
    readonly TEACHER: "teacher";
    readonly LIMITED: "limited";
};
export declare const CPD_POINTS: {
    readonly YEARLY_TARGET: 20;
    readonly ACTIVITY_TYPES: {
        readonly EVENT: 2;
        readonly WEBINAR: 1;
        readonly ONLINE_COURSE: 1;
        readonly PEER_OBSERVATION: 1;
        readonly PROFESSIONAL_READING: 0.5;
    };
};
export declare const ERROR_MESSAGES: {
    readonly UNAUTHORIZED: "Unauthorized access";
    readonly INVALID_TOKEN: "Invalid or expired token";
    readonly USER_NOT_FOUND: "User not found";
    readonly INSTITUTION_NOT_FOUND: "Institution not found";
    readonly INVALID_CREDENTIALS: "Invalid credentials";
    readonly SERVER_ERROR: "Internal server error";
    readonly VALIDATION_ERROR: "Validation error";
    readonly RATE_LIMIT_EXCEEDED: "Too many requests, please try again later";
};
//# sourceMappingURL=constants.d.ts.map