import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const authenticateSupabase: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=supabaseAuth.d.ts.map