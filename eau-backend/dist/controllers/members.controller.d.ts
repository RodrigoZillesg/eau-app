import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class MembersController {
    list(req: AuthRequest, res: Response): Promise<void>;
    getById(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    update(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getStatistics(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    exportCsv(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=members.controller.d.ts.map