import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class CPDController {
    list(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    create(req: AuthRequest, res: Response): Promise<void>;
    update(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    delete(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getProgress(req: AuthRequest, res: Response): Promise<void>;
    private updateMemberCPDPoints;
}
//# sourceMappingURL=cpd.controller.d.ts.map