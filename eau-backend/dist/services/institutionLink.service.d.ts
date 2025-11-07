interface LinkRequest {
    member_id: string;
    institution_id: string;
}
interface ApproveData {
    requestId: string;
    reviewedBy: string;
    notes?: string;
}
interface RejectData {
    requestId: string;
    reviewedBy: string;
    notes: string;
}
/**
 * Member requests to link with an institution
 * Creates pending request and sends email to institution admin
 */
export declare function requestInstitutionLink(data: LinkRequest): Promise<{
    success: boolean;
    request: any;
    message: string;
}>;
/**
 * Institution admin approves a link request
 */
export declare function approveLinkRequest({ requestId, reviewedBy, notes }: ApproveData): Promise<{
    success: boolean;
    message: string;
}>;
/**
 * Institution admin rejects a link request
 */
export declare function rejectLinkRequest({ requestId, reviewedBy, notes }: RejectData): Promise<{
    success: boolean;
    message: string;
}>;
/**
 * Get pending link requests for an institution
 */
export declare function getPendingLinkRequests(institutionId: string): Promise<any[]>;
/**
 * Get all link requests for an institution (pending, approved, rejected)
 */
export declare function getAllLinkRequests(institutionId: string): Promise<any[]>;
/**
 * Member unlinks from their current institution
 */
export declare function unlinkFromInstitution(memberId: string): Promise<{
    success: boolean;
    message: string;
}>;
/**
 * Get member's current link status and history
 */
export declare function getMemberLinkStatus(memberId: string): Promise<{
    currentInstitution: {
        id: any;
        name: any;
        linkedAt: any;
    } | null;
    pendingRequest: {
        id: any;
        institutionName: any;
        requestedAt: any;
    } | null;
    history: any[];
}>;
/**
 * Get ALL pending link requests (for Super Admins - no institution filter)
 */
export declare function getAllPendingLinkRequestsForSuperAdmin(): Promise<any[]>;
/**
 * Get ALL link requests (pending, approved, rejected) for Super Admins
 */
export declare function getAllLinkRequestsForSuperAdmin(): Promise<any[]>;
export {};
//# sourceMappingURL=institutionLink.service.d.ts.map