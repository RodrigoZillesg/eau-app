import { EmailService } from './email.service'
import { generateWelcomeEmailHTML, generateWelcomeEmailText, WelcomeEmailData } from '../templates/welcomeEmail'
import { supabaseAdmin } from '../config/database'
import { logInfo, logError } from '../utils/logger'

export class WelcomeEmailService {
  private static readonly FRONTEND_URL = process.env.FRONTEND_URL || 'https://eauapp.platty.tech'
  private static readonly SUPPORT_EMAIL = 'support@englishaustralia.com.au'

  /**
   * Send welcome email to a new member
   * IMPORTANT: Respects SMTP test mode settings
   */
  static async sendWelcomeEmail(
    userId: string,
    email: string,
    name: string,
    institutionId?: string,
    temporaryPassword?: string
  ): Promise<boolean> {
    try {
      // FIRST: Check if SMTP is in test mode
      const smtpSettings = await EmailService.getSMTPSettings()
      
      if (!smtpSettings || !smtpSettings.enabled) {
        logInfo(`SMTP is disabled. Skipping welcome email for ${email}`)
        return false
      }

      if (smtpSettings.test_mode) {
        // In test mode, only send to the configured test email
        logInfo(`SMTP in TEST MODE. Would send welcome email to ${email} but redirecting to ${smtpSettings.test_email}`)
        
        // If no test email configured, don't send at all
        if (!smtpSettings.test_email) {
          logInfo('No test email configured. Skipping email send.')
          return false
        }
        
        // Replace recipient with test email
        email = smtpSettings.test_email
        logInfo(`Redirecting welcome email to test address: ${email}`)
      }

      logInfo(`Preparing welcome email for ${email}`)

      // Get institution name if provided
      let institutionName = 'English Australia'
      if (institutionId) {
        const { data: institution } = await supabaseAdmin
          .from('institutions')
          .select('name')
          .eq('id', institutionId)
          .single()
        
        if (institution) {
          institutionName = institution.name
        }
      }

      // Generate password reset token
      const resetToken = await this.generatePasswordResetToken(userId, email)
      const resetPasswordUrl = `${this.FRONTEND_URL}/reset-password?token=${resetToken}`

      // Prepare email data
      const emailData: WelcomeEmailData = {
        recipientName: name || email.split('@')[0],
        recipientEmail: email,
        institutionName,
        temporaryPassword,
        resetPasswordUrl,
        loginUrl: `${this.FRONTEND_URL}/login`,
        supportEmail: this.SUPPORT_EMAIL
      }

      // Generate email content
      const html = generateWelcomeEmailHTML(emailData)
      const text = generateWelcomeEmailText(emailData)

      // Send email
      const result = await EmailService.sendEmail({
        to: email,
        subject: '🎓 Welcome to English Australia - Your Account is Ready!',
        html,
        text
      })

      if (result.success) {
        logInfo(`Welcome email sent successfully to ${email}`)
        
        // Record email sent in database
        await this.recordEmailSent(userId, email, 'welcome')
        return true
      } else {
        logError(new Error(`Failed to send welcome email: ${result.message}`))
        return false
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to send welcome email'))
      return false
    }
  }

  /**
   * Send welcome email to multiple members (batch)
   */
  static async sendWelcomeEmailBatch(
    members: Array<{
      userId: string
      email: string
      name: string
      institutionId?: string
      temporaryPassword?: string
    }>
  ): Promise<{ sent: number; failed: number; details: any[] }> {
    const results = {
      sent: 0,
      failed: 0,
      details: [] as any[]
    }

    for (const member of members) {
      try {
        const sent = await this.sendWelcomeEmail(
          member.userId,
          member.email,
          member.name,
          member.institutionId,
          member.temporaryPassword
        )

        if (sent) {
          results.sent++
          results.details.push({
            email: member.email,
            status: 'sent',
            timestamp: new Date().toISOString()
          })
        } else {
          results.failed++
          results.details.push({
            email: member.email,
            status: 'failed',
            timestamp: new Date().toISOString()
          })
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error: any) {
        results.failed++
        results.details.push({
          email: member.email,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }
    }

    logInfo(`Welcome email batch completed: ${results.sent} sent, ${results.failed} failed`)
    return results
  }

  /**
   * Generate a password reset token for the user
   */
  private static async generatePasswordResetToken(userId: string, email: string): Promise<string> {
    try {
      // Create a password reset token in the database
      const token = this.generateSecureToken()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 72) // 72 hours validity for first login

      // Store token in database (you might need to create this table)
      const { error } = await supabaseAdmin
        .from('password_reset_tokens')
        .insert({
          user_id: userId,
          email,
          token,
          expires_at: expiresAt.toISOString(),
          used: false,
          type: 'welcome' // Different from regular password reset
        })

      if (error) {
        logError(new Error(`Failed to create password reset token: ${error.message}`))
        // Fallback to a simple encoded token
        return Buffer.from(`${userId}:${email}:${Date.now()}`).toString('base64')
      }

      return token
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error generating password reset token'))
      // Fallback to a simple encoded token
      return Buffer.from(`${userId}:${email}:${Date.now()}`).toString('base64')
    }
  }

  /**
   * Generate a secure random token
   */
  private static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let token = ''
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return token
  }

  /**
   * Record that an email was sent
   */
  private static async recordEmailSent(
    userId: string,
    email: string,
    type: string
  ): Promise<void> {
    try {
      await supabaseAdmin
        .from('email_logs')
        .insert({
          user_id: userId,
          recipient_email: email,
          email_type: type,
          sent_at: new Date().toISOString(),
          status: 'sent'
        })
    } catch (error) {
      // Don't fail if we can't log the email
      logError(error instanceof Error ? error : new Error('Failed to record email sent'))
    }
  }

  /**
   * Resend welcome email to a user
   */
  static async resendWelcomeEmail(userId: string): Promise<boolean> {
    try {
      // Get user details
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
      
      if (userError || !userData?.user) {
        logError(new Error(userError?.message || 'User not found'))
        return false
      }

      const user = userData.user

      // Get member details
      const { data: member } = await supabaseAdmin
        .from('members')
        .select('full_name, institution_id')
        .eq('user_id', userId)
        .single()

      return await this.sendWelcomeEmail(
        userId,
        user.email!,
        member?.full_name || user.email!.split('@')[0],
        member?.institution_id
      )
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to resend welcome email'))
      return false
    }
  }
}