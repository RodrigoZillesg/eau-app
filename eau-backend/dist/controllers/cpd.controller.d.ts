import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class CPDController {
    list(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    create(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    update(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    delete(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getCategories(req: AuthRequest, res: Response): Promise<void>;
    getProgress(req: AuthRequest, res: Response): Promise<void>;
    getActiveCategories(req: AuthRequest, res: Response): Promise<void>;
    getAllCategories(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createCategory(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateCategory(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteCategory(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    private updateMemberCPDPoints;
}
//# sourceMappingURL=cpd.controller.d.ts.map