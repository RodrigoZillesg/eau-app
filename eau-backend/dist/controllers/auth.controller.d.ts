import { Request, Response } from 'express';
export declare class AuthController {
    login(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    loginWithSupabase(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    refreshToken(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    logout(req: Request, res: Response): Promise<void>;
    me(req: Request & {
        user?: any;
    }, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=auth.controller.d.ts.map