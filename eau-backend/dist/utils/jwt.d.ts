export interface JWTPayload {
    userId: string;
    email: string;
    institutionId?: string;
    userType: string;
    roles?: string[];
}
export declare const generateAccessToken: (payload: JWTPayload) => string;
export declare const generateRefreshToken: (payload: JWTPayload) => string;
export declare const verifyAccessToken: (token: string) => JWTPayload;
export declare const verifyRefreshToken: (token: string) => JWTPayload;
export declare const generateTokenPair: (payload: JWTPayload) => {
    accessToken: string;
    refreshToken: string;
};
//# sourceMappingURL=jwt.d.ts.map