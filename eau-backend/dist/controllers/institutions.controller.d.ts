import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class InstitutionsController {
    list(req: AuthRequest, res: Response): Promise<void>;
    getById(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    create(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    update(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getMembers(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getStatistics(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=institutions.controller.d.ts.map