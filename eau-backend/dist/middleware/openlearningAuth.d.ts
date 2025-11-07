import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const authenticateOpenLearning: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=openlearningAuth.d.ts.map