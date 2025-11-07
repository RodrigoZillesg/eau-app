import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class InstitutionLinkController {
    /**
     * Member requests to link with an institution
     * POST /api/v1/institution-links/request
     */
    requestLink(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get pending link requests for institution admin's institution
     * GET /api/v1/institution-links/pending
     */
    getPendingRequests(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get all link requests for institution admin's institution
     * GET /api/v1/institution-links/all
     */
    getAllRequests(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Institution admin approves a link request
     * POST /api/v1/institution-links/:id/approve
     */
    approveRequest(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Institution admin rejects a link request
     * POST /api/v1/institution-links/:id/reject
     */
    rejectRequest(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Member unlinks from their current institution
     * DELETE /api/v1/institution-links/unlink
     */
    unlinkFromInstitution(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get member's current link status and history
     * GET /api/v1/institution-links/status
     */
    getLinkStatus(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=institutionLink.controller.d.ts.map