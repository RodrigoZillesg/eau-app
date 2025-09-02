import type { UserRole } from '../../types/permissions'

// Mock users for demo purposes
export const DEMO_USERS = [
  {
    id: '1',
    email: 'admin@englishaustralia.com.au',
    password: 'admin123',
    user_metadata: { full_name: 'Admin User' },
    roles: ['AdminSuper', 'Admin'] as UserRole[]
  },
  {
    id: '2', 
    email: 'member@englishaustralia.com.au',
    password: 'member123',
    user_metadata: { full_name: 'Member User' },
    roles: ['Members'] as UserRole[]
  },
  {
    id: '3',
    email: 'teacher@englishaustralia.com.au', 
    password: 'teacher123',
    user_metadata: { full_name: 'Teacher User' },
    roles: ['MemberColleges', 'Members'] as UserRole[]
  }
]

export const mockAuth = {
  signIn: async (email: string, password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const user = DEMO_USERS.find(u => u.email === email && u.password === password)
    
    if (!user) {
      return { 
        data: { user: null, session: null }, 
        error: { message: 'Invalid email or password' } 
      }
    }
    
    const mockUser = {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
      aud: 'authenticated',
      role: 'authenticated'
    }
    
    return { 
      data: { 
        user: mockUser, 
        session: { user: mockUser, access_token: 'mock-token' } 
      }, 
      error: null 
    }
  },
  
  signOut: async () => {
    return { error: null }
  },
  
  getSession: async () => {
    return { data: { session: null }, error: null }
  },
  
  onAuthStateChange: (_callback: any) => {
    return { data: { subscription: { unsubscribe: () => {} } } }
  }
}