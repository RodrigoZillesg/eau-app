import { Request, Response } from 'express';
import { AuthRequest } from '../types';
export declare class InvitationsController {
    createInvitation(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    listInvitations(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    acceptInvitation(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    revokeInvitation(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    resendInvitation(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=invitations.controller.d.ts.map