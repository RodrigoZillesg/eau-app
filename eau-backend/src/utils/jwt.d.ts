export interface JWTPayload {
  userId: string;
  email: string;
  institutionId?: string;
  userType: string;
  roles?: string[];
}

export function generateAccessToken(payload: JWTPayload): string;
export function generateRefreshToken(payload: JWTPayload): string;  
export function verifyAccessToken(token: string): JWTPayload;
export function verifyRefreshToken(token: string): JWTPayload;
export function generateTokenPair(payload: JWTPayload): {
  accessToken: string;
  refreshToken: string;
};