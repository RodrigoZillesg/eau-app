import React, { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Card } from '../../../components/ui/Card'
import { supabase } from '../../../lib/supabase/client'
import { notifications } from '../../../lib/notifications'

interface InviteUserModalProps {
  memberEmail: string
  onClose: () => void
  onSuccess: () => void
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  memberEmail,
  onClose,
  onSuccess: _onSuccess
}) => {
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [inviteLink, setInviteLink] = useState('')

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setTemporaryPassword(password)
  }

  const createUserAccount = async () => {
    if (!temporaryPassword) {
      setMessage('Please generate a temporary password')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // Tentar criar usuário no Supabase
      const { error } = await supabase.auth.admin.createUser({
        email: memberEmail,
        password: temporaryPassword,
        email_confirm: true // Auto-confirmar email
      })

      if (error) {
        // If unable to use admin API, show manual instructions
        setMessage(`Unable to create automatically. Please create manually in Supabase Studio:
        
1. Go to Authentication > Users
2. Click "Add user" > "Create new user"  
3. Email: ${memberEmail}
4. Password: ${temporaryPassword}
5. Check "Auto Confirm User"`)
      } else {
        setMessage(`✅ User created successfully!
        
Temporary credentials:
Email: ${memberEmail}
Password: ${temporaryPassword}

⚠️ User must change password on first login.`)
        
        // Gerar link direto para login
        const loginLink = `${window.location.origin}/login?email=${encodeURIComponent(memberEmail)}`
        setInviteLink(loginLink)
      }
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    notifications.copyToClipboard(text, 'Copied to clipboard!')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Invite User</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Member Email</Label>
            <Input value={memberEmail} disabled className="bg-gray-100" />
          </div>

          <div>
            <Label>Temporary Password</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={temporaryPassword}
                onChange={(e) => setTemporaryPassword(e.target.value)}
                placeholder="Click 'Generate' to create a password"
              />
              <Button type="button" onClick={generatePassword} variant="outline">
                Generate
              </Button>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-md text-sm whitespace-pre-line ${
              message.includes('✅') 
                ? 'bg-green-50 text-green-800' 
                : message.includes('Unable to create')
                  ? 'bg-yellow-50 text-yellow-800'
                  : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}

          {inviteLink && (
            <div className="space-y-2">
              <Label>Login Link</Label>
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly className="text-xs" />
                <Button 
                  type="button" 
                  onClick={() => copyToClipboard(inviteLink)}
                  variant="outline"
                  size="sm"
                >
                  Copy
                </Button>
              </div>
            </div>
          )}

          {temporaryPassword && (
            <div className="space-y-2">
              <Button 
                type="button" 
                onClick={() => copyToClipboard(`Email: ${memberEmail}\nPassword: ${temporaryPassword}`)}
                variant="outline"
                className="w-full"
              >
                Copy Credentials
              </Button>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
            <Button 
              onClick={createUserAccount} 
              disabled={loading || !temporaryPassword}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}