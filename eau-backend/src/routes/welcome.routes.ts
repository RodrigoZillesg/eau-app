import { Router } from 'express'
import { authenticateSupabase } from '../middleware/supabaseAuth'
import { WelcomeEmailService } from '../services/welcomeEmail.service'
import { supabaseAdmin } from '../config/database'

const router = Router()

// Apply authentication middleware
router.use(authenticateSupabase);

// Send welcome email to a single member
router.post('/send', async (req, res) => {
  try {
    const { userId, email, name, institutionId, temporaryPassword } = req.body

    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        error: 'User ID and email are required'
      })
    }

    const result = await WelcomeEmailService.sendWelcomeEmail(
      userId,
      email,
      name || email.split('@')[0],
      institutionId,
      temporaryPassword
    )

    if (result) {
      res.json({
        success: true,
        message: 'Welcome email sent successfully'
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send welcome email'
      })
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Send welcome emails in batch
router.post('/send-batch', async (req, res) => {
  try {
    const { members } = req.body

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Members array is required'
      })
    }

    const results = await WelcomeEmailService.sendWelcomeEmailBatch(members)

    res.json({
      success: true,
      results
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Resend welcome email
router.post('/resend/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    const result = await WelcomeEmailService.resendWelcomeEmail(userId)

    if (result) {
      res.json({
        success: true,
        message: 'Welcome email resent successfully'
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to resend welcome email'
      })
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Get members who haven't received welcome email
router.get('/pending', async (req, res) => {
  try {
    // Get members created in last 30 days who haven't received welcome email
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: members, error } = await supabaseAdmin
      .from('members')
      .select(`
        id,
        email,
        full_name,
        institution_id,
        created_at,
        institutions (name)
      `)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .is('welcome_email_sent', null)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    res.json({
      success: true,
      members: members || []
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router