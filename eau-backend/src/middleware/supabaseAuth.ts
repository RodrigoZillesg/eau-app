import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/database';
import { AuthRequest } from '../types';

export const authenticateSupabase = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    
    try {
      // Verify the token with Supabase
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
      }

      // Get member data
      const { data: member } = await supabaseAdmin
        .from('members')
        .select('id, email, first_name, last_name, user_id, institution_id')
        .eq('user_id', user.id)
        .single();

      // Get user roles if member exists
      let memberRoles: any[] = [];
      if (member) {
        const { data: roles } = await supabaseAdmin
          .from('member_roles')
          .select('role_name')
          .eq('member_id', member.id);
        memberRoles = roles || [];
      }

      // Set user data in request
      req.user = {
        id: user.id,
        email: user.email || '',
        roles: memberRoles.map(r => r.role_name) || [],
        institutionId: member?.institution_id || '',
        userType: 'member'
      };

      // Check if user is admin
      const userRoles = memberRoles.map(r => r.role_name) || [];
      if (userRoles.includes('AdminSuper') || userRoles.includes('Admin')) {
        req.user.userType = 'admin';
      }

      next();
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};