import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/crypto';
import { ERROR_MESSAGES } from '../config/constants';
import { ApiResponse, TokenPayload } from '../types';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const { data: member, error } = await supabaseAdmin
        .from('members')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error || !member) {
        return res.status(401).json({
          success: false,
          error: ERROR_MESSAGES.INVALID_CREDENTIALS
        } as ApiResponse);
      }

      // Verify password (assuming password is stored in a separate auth table)
      const { data: authData } = await supabaseAdmin
        .from('auth.users')
        .select('encrypted_password')
        .eq('email', email.toLowerCase())
        .single();

      if (!authData) {
        return res.status(401).json({
          success: false,
          error: ERROR_MESSAGES.INVALID_CREDENTIALS
        } as ApiResponse);
      }

      // Get user roles
      const { data: roles } = await supabaseAdmin
        .from('member_roles')
        .select('roles(name)')
        .eq('member_id', member.id);

      const tokenPayload: TokenPayload = {
        userId: member.id,
        email: member.email,
        institutionId: member.institution_id,
        userType: member.user_type || 'staff',
        roles: roles?.map((r: any) => r.roles?.name).filter(Boolean) || []
      };

      const tokens = generateTokenPair(tokenPayload);

      // Update last login
      await supabaseAdmin
        .from('members')
        .update({ last_login: new Date().toISOString() })
        .eq('id', member.id);

      res.json({
        success: true,
        data: {
          user: {
            id: member.id,
            email: member.email,
            fullName: member.full_name,
            institutionId: member.institution_id,
            userType: member.user_type,
            roles: tokenPayload.roles
          },
          tokens
        }
      } as ApiResponse);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  async loginWithSupabase(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Use Supabase Auth for authentication
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password
      });

      if (authError || !authData.user) {
        return res.status(401).json({
          success: false,
          error: ERROR_MESSAGES.INVALID_CREDENTIALS
        } as ApiResponse);
      }

      // Get member details
      const { data: member } = await supabaseAdmin
        .from('members')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (!member) {
        // Create member if doesn't exist
        const { data: newMember } = await supabaseAdmin
          .from('members')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            full_name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0],
            membership_status: 'active',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!newMember) {
          throw new Error('Failed to create member record');
        }
      }

      // Get user roles
      const { data: roles } = await supabaseAdmin
        .from('member_roles')
        .select('roles(name)')
        .eq('member_id', authData.user.id);

      const tokenPayload: TokenPayload = {
        userId: authData.user.id,
        email: authData.user.email!,
        institutionId: member?.institution_id,
        userType: member?.user_type || 'staff',
        roles: roles?.map((r: any) => r.roles?.name).filter(Boolean) || []
      };

      const tokens = generateTokenPair(tokenPayload);

      res.json({
        success: true,
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email,
            fullName: member?.full_name || authData.user.user_metadata?.full_name,
            institutionId: member?.institution_id,
            userType: member?.user_type,
            roles: tokenPayload.roles
          },
          tokens,
          supabaseSession: authData.session
        }
      } as ApiResponse);
    } catch (error) {
      console.error('Supabase login error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        } as ApiResponse);
      }

      const decoded = verifyRefreshToken(refreshToken);

      // Verify user still exists and is active
      const { data: member } = await supabaseAdmin
        .from('members')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      if (!member) {
        return res.status(401).json({
          success: false,
          error: ERROR_MESSAGES.USER_NOT_FOUND
        } as ApiResponse);
      }

      // Get updated roles
      const { data: roles } = await supabaseAdmin
        .from('member_roles')
        .select('roles(name)')
        .eq('member_id', member.id);

      const tokenPayload: TokenPayload = {
        userId: member.id,
        email: member.email,
        institutionId: member.institution_id,
        userType: member.user_type || 'staff',
        roles: roles?.map((r: any) => r.roles?.name).filter(Boolean) || []
      };

      const tokens = generateTokenPair(tokenPayload);

      res.json({
        success: true,
        data: { tokens }
      } as ApiResponse);
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        error: ERROR_MESSAGES.INVALID_TOKEN
      } as ApiResponse);
    }
  }

  async logout(req: Request, res: Response) {
    try {
      // In a production app, you might want to:
      // 1. Invalidate the refresh token in a database
      // 2. Add the access token to a blacklist
      // 3. Clear any server-side sessions

      res.json({
        success: true,
        message: 'Logged out successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  async me(req: Request & { user?: any }, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: ERROR_MESSAGES.UNAUTHORIZED
        } as ApiResponse);
      }

      // Get full member details
      const { data: member } = await supabaseAdmin
        .from('members')
        .select(`
          *,
          institutions (
            id,
            name,
            membership_type,
            status
          )
        `)
        .eq('id', req.user.id)
        .single();

      res.json({
        success: true,
        data: member
      } as ApiResponse);
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }
}