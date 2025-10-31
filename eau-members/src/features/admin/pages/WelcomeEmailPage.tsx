import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { supabase } from '../../../lib/supabase/client'
import { showNotification } from '../../../lib/notifications'
import { ArrowLeft, Mail, AlertTriangle, CheckCircle, Users, Send, RefreshCw } from 'lucide-react'

interface PendingMember {
  id: string
  email: string
  first_name: string
  last_name: string
  institution_id: string | null
  created_at: string
  institutions?: { name: string }
  selected?: boolean
}

interface SMTPStatus {
  enabled: boolean
  test_mode: boolean
  test_email: string | null
}

export const WelcomeEmailPage: React.FC = () => {
  const navigate = useNavigate()
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [smtpStatus, setSmtpStatus] = useState<SMTPStatus | null>(null)
  const [selectAll, setSelectAll] = useState(false)

  useEffect(() => {
    fetchSMTPStatus()
    fetchPendingMembers()
  }, [])

  const fetchSMTPStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.warn('No session available')
        return
      }

      const response = await fetch(`http://localhost:3001/api/v1/email/settings`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          setSmtpStatus({
            enabled: data.settings.enabled,
            test_mode: data.settings.test_mode,
            test_email: data.settings.test_email
          })
        }
      } else {
        console.warn('Failed to fetch SMTP status:', response.status, response.statusText)
        // Try to parse error response
        try {
          const errorData = await response.json()
          console.warn('Error details:', errorData)
        } catch (parseError) {
          console.warn('Could not parse error response')
        }
      }
    } catch (error) {
      console.error('Error fetching SMTP status:', error)
    }
  }

  const fetchPendingMembers = async () => {
    try {
      setLoading(true)
      
      // Get members created in last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data, error } = await supabase
        .from('members')
        .select(`
          id,
          email,
          first_name,
          last_name,
          institution_id,
          created_at,
          welcome_email_sent,
          institutions (name)
        `)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .is('welcome_email_sent', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPendingMembers(data?.map(m => ({ ...m, selected: false })) || [])
    } catch (error) {
      console.error('Error fetching pending members:', error)
      showNotification('error', 'Failed to load pending members')
    } finally {
      setLoading(false)
    }
  }

  const toggleMemberSelection = (memberId: string) => {
    setPendingMembers(prev => 
      prev.map(m => m.id === memberId ? { ...m, selected: !m.selected } : m)
    )
  }

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll
    setSelectAll(newSelectAll)
    setPendingMembers(prev => 
      prev.map(m => ({ ...m, selected: newSelectAll }))
    )
  }

  const sendWelcomeEmails = async () => {
    const selectedMembers = pendingMembers.filter(m => m.selected)
    
    if (selectedMembers.length === 0) {
      showNotification('warning', 'Please select at least one member')
      return
    }

    const confirmMessage = smtpStatus?.test_mode
      ? `Send ${selectedMembers.length} welcome email(s) to TEST EMAIL: ${smtpStatus.test_email}?`
      : `Send ${selectedMembers.length} welcome email(s)? (Check SMTP settings if unsure about test mode)`

    if (!confirm(confirmMessage)) {
      return
    }

    setSending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        showNotification('error', 'Authentication required', 'Please refresh the page and try again')
        return
      }

      const members = selectedMembers.map(m => ({
        userId: m.id,
        email: m.email,
        name: `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email.split('@')[0],
        institutionId: m.institution_id
      }))

      const response = await fetch(`http://localhost:3001/api/v1/welcome/send-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ members })
      })

      if (!response.ok) {
        throw new Error('Failed to send emails')
      }

      const result = await response.json()
      
      if (result.results) {
        showNotification('success', 
          `Sent ${result.results.sent} email(s)`,
          result.results.failed > 0 ? `${result.results.failed} failed` : undefined
        )

        // Mark sent members in database
        for (const member of selectedMembers) {
          await supabase
            .from('members')
            .update({ welcome_email_sent: new Date().toISOString() })
            .eq('id', member.id)
        }

        // Refresh the list
        fetchPendingMembers()
      }
    } catch (error) {
      console.error('Error sending welcome emails:', error)
      showNotification('error', 'Failed to send welcome emails')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin')}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome Email Manager</h1>
                <p className="text-gray-600">Send welcome emails to new members</p>
              </div>
            </div>
            <Button
              onClick={fetchPendingMembers}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* SMTP Status Alert */}
        {smtpStatus ? (
          <Card className={`mb-6 ${smtpStatus.test_mode ? 'border-yellow-400' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {smtpStatus.test_mode ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    TEST MODE ACTIVE
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5 text-green-500" />
                    SMTP Status
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {smtpStatus.enabled ? (
                smtpStatus.test_mode ? (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="font-medium text-yellow-800">
                      ⚠️ Test Mode is ACTIVE
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      All emails will be sent to: <strong>{smtpStatus.test_email || 'Not configured'}</strong>
                    </p>
                    <p className="text-sm text-yellow-600 mt-2">
                      Real member emails will NOT receive any messages.
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="font-medium text-green-800">
                      ✅ SMTP is enabled and ready
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Emails will be sent to REAL member addresses.
                    </p>
                  </div>
                )
              ) : (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="font-medium text-red-800">
                    ❌ SMTP is disabled
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    Please enable SMTP in settings before sending emails.
                  </p>
                  <Button
                    className="mt-3"
                    variant="outline"
                    onClick={() => navigate('/admin/smtp-settings')}
                  >
                    Configure SMTP
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-500" />
                SMTP Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium text-gray-600">
                  ⚠️ Unable to check SMTP settings
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Email sending may not work properly. Check your configuration.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Pending Welcome Emails
                </CardTitle>
                <CardDescription>
                  Members who haven't received their welcome email (last 30 days)
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={toggleSelectAll}
                  disabled={pendingMembers.length === 0}
                >
                  {selectAll ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  onClick={sendWelcomeEmails}
                  disabled={sending || pendingMembers.filter(m => m.selected).length === 0}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Selected
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-gray-500">
                Loading members...
              </div>
            ) : pendingMembers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
                <p>All members have received their welcome emails!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="text-left p-2 font-medium text-gray-700">Name</th>
                      <th className="text-left p-2 font-medium text-gray-700">Email</th>
                      <th className="text-left p-2 font-medium text-gray-700">Institution</th>
                      <th className="text-left p-2 font-medium text-gray-700">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingMembers.map((member) => (
                      <tr key={member.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={member.selected}
                            onChange={() => toggleMemberSelection(member.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-2">
                          <p className="font-medium">
                            {`${member.first_name || ''} ${member.last_name || ''}`.trim() || 'N/A'}
                          </p>
                        </td>
                        <td className="p-2">
                          <p className="text-sm">{member.email}</p>
                        </td>
                        <td className="p-2">
                          <p className="text-sm">{member.institutions?.name || 'N/A'}</p>
                        </td>
                        <td className="p-2">
                          <p className="text-sm text-gray-500">
                            {new Date(member.created_at).toLocaleDateString()}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How it Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• Welcome emails include login credentials and first-time setup instructions</p>
              <p>• Members receive a secure link to set their password</p>
              <p>• In TEST MODE, all emails go to the configured test address</p>
              <p>• The system tracks which members have received their welcome email</p>
              <p>• You can resend emails to specific members if needed</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}