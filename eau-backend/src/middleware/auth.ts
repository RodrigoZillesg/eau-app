import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { supabaseAdmin } from '../config/database';
import { AuthRequest } from '../types';
import { ERROR_MESSAGES, USER_TYPES } from '../config/constants';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = verifyAccessToken(token);
      
      // Verify user still exists and is active
      const { data: member, error } = await supabaseAdmin
        .from('members')
        .select('id, email, institution_id, user_type, membership_status')
        .eq('id', decoded.userId)
        .single();

      if (error || !member) {
        return res.status(401).json({
          success: false,
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }

      // Check if user's institution is active (if they belong to one)
      if (member.institution_id) {
        const { data: institution } = await supabaseAdmin
          .from('institutions')
          .select('status')
          .eq('id', member.institution_id)
          .single();

        if (institution?.status !== 'active' && member.user_type !== USER_TYPES.SUPER_ADMIN) {
          return res.status(403).json({
            success: false,
            error: 'Your institution is not active'
          });
        }
      }

      // Get user roles
      const { data: roles } = await supabaseAdmin
        .from('member_roles')
        .select('roles(name)')
        .eq('member_id', member.id);

      req.user = {
        id: member.id,
        email: member.email,
        institutionId: member.institution_id,
        userType: member.user_type || USER_TYPES.STAFF,
        roles: roles?.map((r: any) => r.roles?.name).filter(Boolean) || []
      };

      next();
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        error: ERROR_MESSAGES.INVALID_TOKEN
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

export const authorize = (...allowedUserTypes: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED
      });
    }

    if (!allowedUserTypes.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

export const authorizeRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED
      });
    }

    const hasRole = req.user.roles?.some(role => allowedRoles.includes(role));

    if (!hasRole && req.user.userType !== USER_TYPES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

export const authorizeInstitution = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: ERROR_MESSAGES.UNAUTHORIZED
    });
  }

  // Super admins can access any institution
  if (req.user.userType === USER_TYPES.SUPER_ADMIN) {
    return next();
  }

  const institutionId = req.params.institutionId || req.body.institutionId;

  if (!institutionId) {
    return res.status(400).json({
      success: false,
      error: 'Institution ID is required'
    });
  }

  if (req.user.institutionId !== institutionId) {
    return res.status(403).json({
      success: false,
      error: 'You can only access your own institution'
    });
  }

  next();
};