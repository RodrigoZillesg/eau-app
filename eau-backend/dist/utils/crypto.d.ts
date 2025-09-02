export declare const generateSecureToken: (length?: number) => string;
export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hash: string) => Promise<boolean>;
export declare const generateInviteToken: () => string;
export declare const generateResetToken: () => string;
export declare const generateVerificationCode: () => string;
//# sourceMappingURL=crypto.d.ts.map