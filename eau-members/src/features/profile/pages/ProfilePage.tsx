import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Shield, Bell } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { ProfileForm } from '../components/ProfileForm'
import { PasswordChangeForm } from '../components/PasswordChangeForm'
import { AvatarUpload } from '../../../components/ui/AvatarUpload'
import { useAuthStore } from '../../../stores/authStore'
import { supabase } from '../../../lib/supabase/client'

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications'>('profile')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    loadUserAvatar()
  }, [user])

  const loadUserAvatar = async () => {
    if (!user?.email) return
    
    try {
      const { data: memberData } = await supabase
        .from('members')
        .select('avatar_url')
        .eq('email', user.email)
        .single()
      
      if (memberData?.avatar_url) {
        setAvatarUrl(memberData.avatar_url)
      }
    } catch (error) {
      console.error('Error loading avatar:', error)
    }
  }

  const handleAvatarChange = async (newAvatarUrl: string | null) => {
    setAvatarUrl(newAvatarUrl)
    // Trigger ProfileForm refresh to update member data
    setRefreshKey(prev => prev + 1)
  }

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="p-4">
            <div className="flex flex-col items-center mb-6">
              <AvatarUpload
                currentAvatar={avatarUrl}
                onAvatarChange={handleAvatarChange}
                size="lg"
              />
              <h2 className="font-semibold mt-4">{user.email}</h2>
              <p className="text-sm text-gray-500 capitalize">Member</p>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'profile' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <User className="w-4 h-4" />
                Personal Information
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'password' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <Shield className="w-4 h-4" />
                Change Password
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'notifications' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <Bell className="w-4 h-4" />
                Notifications
              </button>
            </nav>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="p-6">
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
                <ProfileForm key={refreshKey} />
              </div>
            )}

            {activeTab === 'password' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Change Password</h2>
                <PasswordChangeForm />
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                    <span>Receive email newsletters</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                    <span>Event notifications</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4" />
                    <span>CPD reminders</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                    <span>Important system updates</span>
                  </label>
                </div>
                <Button className="mt-6">Save Preferences</Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}