import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Shield, Building2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { ProfileForm } from '../components/ProfileForm'
import { PasswordChangeForm } from '../components/PasswordChangeForm'
import { AvatarUpload } from '../../../components/ui/AvatarUpload'
import { useAuthStore } from '../../../stores/authStore'
import { supabase } from '../../../lib/supabase/client'

interface InstitutionLink {
  institution_id: string
  status: 'pending' | 'approved' | 'rejected'
  institution: {
    name: string
  }
}

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [institutionLink, setInstitutionLink] = useState<InstitutionLink | null>(null)
  const [userType, setUserType] = useState<string>('member')
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    loadUserAvatar()
    loadInstitutionLink()
    loadUserType()
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

  const loadUserType = async () => {
    if (!user?.email) return

    try {
      const { data: memberData } = await supabase
        .from('members')
        .select('user_type')
        .eq('email', user.email)
        .single()

      if (memberData?.user_type) {
        setUserType(memberData.user_type)
      }
    } catch (error) {
      console.error('Error loading user type:', error)
    }
  }

  const loadInstitutionLink = async () => {
    if (!user?.email) return

    try {
      // Get member with institution data
      const { data: memberData } = await supabase
        .from('members')
        .select(`
          id,
          institution_id,
          institution:institutions(name)
        `)
        .eq('email', user.email)
        .not('institution_id', 'is', null)
        .single()

      if (memberData?.institution_id && memberData.institution) {
        // Check if there's a link request to get status
        const { data: linkRequest } = await supabase
          .from('institution_link_requests')
          .select('status')
          .eq('member_id', memberData.id)
          .eq('institution_id', memberData.institution_id)
          .single()

        setInstitutionLink({
          institution_id: memberData.institution_id,
          status: linkRequest?.status || 'approved',
          institution: memberData.institution
        } as InstitutionLink)
      }
    } catch (error) {
      console.error('Error loading institution link:', error)
    }
  }

  const handleAvatarChange = async (newAvatarUrl: string | null) => {
    setAvatarUrl(newAvatarUrl)
    // Trigger ProfileForm refresh to update member data
    setRefreshKey(prev => prev + 1)
  }

  const formatUserType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'super_admin': 'Super Admin',
      'admin': 'Admin',
      'institution_admin': 'Institution Admin',
      'member': 'Member'
    }
    return typeMap[type] || type
  }

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <p className="text-sm text-gray-500">{formatUserType(userType)}</p>
            </div>

            {/* Institution Information */}
            {institutionLink && (
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Building2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-blue-900 uppercase tracking-wide mb-1">
                      Institution
                    </p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {institutionLink.institution.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {institutionLink.status === 'approved' && (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-700 font-medium">Active Member</span>
                        </>
                      )}
                      {institutionLink.status === 'pending' && (
                        <>
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span className="text-xs text-yellow-700 font-medium">Pending Approval</span>
                        </>
                      )}
                      {institutionLink.status === 'rejected' && (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-xs text-red-700 font-medium">Not Approved</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

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
          </Card>
        </div>
      </div>
    </div>
  )
}