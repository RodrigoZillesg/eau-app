import { Request, Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import { ERROR_MESSAGES, USER_TYPES } from '../config/constants';
import * as linkService from '../services/institutionLink.service';

export class InstitutionLinkController {
  /**
   * Member requests to link with an institution
   * POST /api/v1/institution-links/request
   */
  async requestLink(req: AuthRequest, res: Response) {
    try {
      const { institution_id } = req.body;
      const member_id = req.user?.id;

      if (!member_id) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        } as ApiResponse);
      }

      const result = await linkService.requestInstitutionLink({
        member_id,
        institution_id
      });

      res.status(201).json({
        success: true,
        data: result.request,
        message: result.message
      } as ApiResponse);
    } catch (error) {
      console.error('Request institution link error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  /**
   * Get pending link requests for institution admin's institution
   * GET /api/v1/institution-links/pending
   */
  async getPendingRequests(req: AuthRequest, res: Response) {
    try {
      const institutionId = req.user?.institutionId;
      const userType = req.user?.userType;

      // Super Admins and Admins can see ALL pending requests across all institutions
      if (userType === 'super_admin' || userType === 'admin') {
        const requests = await linkService.getAllPendingLinkRequestsForSuperAdmin();
        return res.json({
          success: true,
          data: requests
        } as ApiResponse);
      }

      // Institution Admins must have an institution assigned
      if (!institutionId) {
        return res.status(400).json({
          success: false,
          error: 'Institution admin must have an institution assigned'
        } as ApiResponse);
      }

      // Institution Admin - only see their institution's requests
      const requests = await linkService.getPendingLinkRequests(institutionId);

      res.json({
        success: true,
        data: requests
      } as ApiResponse);
    } catch (error) {
      console.error('Get pending requests error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  /**
   * Get all link requests for institution admin's institution
   * GET /api/v1/institution-links/all
   */
  async getAllRequests(req: AuthRequest, res: Response) {
    try {
      const institutionId = req.user?.institutionId;
      const userType = req.user?.userType;

      // Super Admins and Admins can see ALL requests across all institutions
      if (userType === 'super_admin' || userType === 'admin') {
        const requests = await linkService.getAllLinkRequestsForSuperAdmin();
        return res.json({
          success: true,
          data: requests
        } as ApiResponse);
      }

      // Institution Admins must have an institution assigned
      if (!institutionId) {
        return res.status(400).json({
          success: false,
          error: 'Institution admin must have an institution assigned'
        } as ApiResponse);
      }

      // Institution Admin - only see their institution's requests
      const requests = await linkService.getAllLinkRequests(institutionId);

      res.json({
        success: true,
        data: requests
      } as ApiResponse);
    } catch (error) {
      console.error('Get all requests error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  /**
   * Institution admin approves a link request
   * POST /api/v1/institution-links/:id/approve
   */
  async approveRequest(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const reviewedBy = req.user?.id;

      if (!reviewedBy) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        } as ApiResponse);
      }

      const result = await linkService.approveLinkRequest({
        requestId: id,
        reviewedBy,
        notes
      });

      res.json({
        success: true,
        message: result.message
      } as ApiResponse);
    } catch (error) {
      console.error('Approve request error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  /**
   * Institution admin rejects a link request
   * POST /api/v1/institution-links/:id/reject
   */
  async rejectRequest(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const reviewedBy = req.user?.id;

      if (!reviewedBy) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        } as ApiResponse);
      }

      if (!notes || notes.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Rejection reason (notes) is required'
        } as ApiResponse);
      }

      const result = await linkService.rejectLinkRequest({
        requestId: id,
        reviewedBy,
        notes
      });

      res.json({
        success: true,
        message: result.message
      } as ApiResponse);
    } catch (error) {
      console.error('Reject request error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  /**
   * Member unlinks from their current institution
   * DELETE /api/v1/institution-links/unlink
   */
  async unlinkFromInstitution(req: AuthRequest, res: Response) {
    try {
      const memberId = req.user?.id;

      if (!memberId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        } as ApiResponse);
      }

      const result = await linkService.unlinkFromInstitution(memberId);

      res.json({
        success: true,
        message: result.message
      } as ApiResponse);
    } catch (error) {
      console.error('Unlink from institution error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  /**
   * Get member's current link status and history
   * GET /api/v1/institution-links/status
   */
  async getLinkStatus(req: AuthRequest, res: Response) {
    try {
      const memberId = req.user?.id;

      if (!memberId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        } as ApiResponse);
      }

      const status = await linkService.getMemberLinkStatus(memberId);

      res.json({
        success: true,
        data: status
      } as ApiResponse);
    } catch (error) {
      console.error('Get link status error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }
}
