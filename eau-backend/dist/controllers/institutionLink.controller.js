"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstitutionLinkController = void 0;
const constants_1 = require("../config/constants");
const linkService = __importStar(require("../services/institutionLink.service"));
class InstitutionLinkController {
    /**
     * Member requests to link with an institution
     * POST /api/v1/institution-links/request
     */
    async requestLink(req, res) {
        try {
            const { institution_id } = req.body;
            const member_id = req.user?.id;
            if (!member_id) {
                return res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
            }
            const result = await linkService.requestInstitutionLink({
                member_id,
                institution_id
            });
            res.status(201).json({
                success: true,
                data: result.request,
                message: result.message
            });
        }
        catch (error) {
            console.error('Request institution link error:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
    /**
     * Get pending link requests for institution admin's institution
     * GET /api/v1/institution-links/pending
     */
    async getPendingRequests(req, res) {
        try {
            const institutionId = req.user?.institutionId;
            const userType = req.user?.userType;
            // Super Admins and Admins can see ALL pending requests across all institutions
            if (userType === 'super_admin' || userType === 'admin') {
                const requests = await linkService.getAllPendingLinkRequestsForSuperAdmin();
                return res.json({
                    success: true,
                    data: requests
                });
            }
            // Institution Admins must have an institution assigned
            if (!institutionId) {
                return res.status(400).json({
                    success: false,
                    error: 'Institution admin must have an institution assigned'
                });
            }
            // Institution Admin - only see their institution's requests
            const requests = await linkService.getPendingLinkRequests(institutionId);
            res.json({
                success: true,
                data: requests
            });
        }
        catch (error) {
            console.error('Get pending requests error:', error);
            res.status(500).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
    /**
     * Get all link requests for institution admin's institution
     * GET /api/v1/institution-links/all
     */
    async getAllRequests(req, res) {
        try {
            const institutionId = req.user?.institutionId;
            const userType = req.user?.userType;
            // Super Admins and Admins can see ALL requests across all institutions
            if (userType === 'super_admin' || userType === 'admin') {
                const requests = await linkService.getAllLinkRequestsForSuperAdmin();
                return res.json({
                    success: true,
                    data: requests
                });
            }
            // Institution Admins must have an institution assigned
            if (!institutionId) {
                return res.status(400).json({
                    success: false,
                    error: 'Institution admin must have an institution assigned'
                });
            }
            // Institution Admin - only see their institution's requests
            const requests = await linkService.getAllLinkRequests(institutionId);
            res.json({
                success: true,
                data: requests
            });
        }
        catch (error) {
            console.error('Get all requests error:', error);
            res.status(500).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
    /**
     * Institution admin approves a link request
     * POST /api/v1/institution-links/:id/approve
     */
    async approveRequest(req, res) {
        try {
            const { id } = req.params;
            const { notes } = req.body;
            const reviewedBy = req.user?.id;
            if (!reviewedBy) {
                return res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
            }
            const result = await linkService.approveLinkRequest({
                requestId: id,
                reviewedBy,
                notes
            });
            res.json({
                success: true,
                message: result.message
            });
        }
        catch (error) {
            console.error('Approve request error:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
    /**
     * Institution admin rejects a link request
     * POST /api/v1/institution-links/:id/reject
     */
    async rejectRequest(req, res) {
        try {
            const { id } = req.params;
            const { notes } = req.body;
            const reviewedBy = req.user?.id;
            if (!reviewedBy) {
                return res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
            }
            if (!notes || notes.trim() === '') {
                return res.status(400).json({
                    success: false,
                    error: 'Rejection reason (notes) is required'
                });
            }
            const result = await linkService.rejectLinkRequest({
                requestId: id,
                reviewedBy,
                notes
            });
            res.json({
                success: true,
                message: result.message
            });
        }
        catch (error) {
            console.error('Reject request error:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
    /**
     * Member unlinks from their current institution
     * DELETE /api/v1/institution-links/unlink
     */
    async unlinkFromInstitution(req, res) {
        try {
            const memberId = req.user?.id;
            if (!memberId) {
                return res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
            }
            const result = await linkService.unlinkFromInstitution(memberId);
            res.json({
                success: true,
                message: result.message
            });
        }
        catch (error) {
            console.error('Unlink from institution error:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
    /**
     * Get member's current link status and history
     * GET /api/v1/institution-links/status
     */
    async getLinkStatus(req, res) {
        try {
            const memberId = req.user?.id;
            if (!memberId) {
                return res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
            }
            const status = await linkService.getMemberLinkStatus(memberId);
            res.json({
                success: true,
                data: status
            });
        }
        catch (error) {
            console.error('Get link status error:', error);
            res.status(500).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
}
exports.InstitutionLinkController = InstitutionLinkController;
//# sourceMappingURL=institutionLink.controller.js.map