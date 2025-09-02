import { DEMO_USERS } from './mockAuth'

export const mockSupabase = {
  from: (table: string) => ({
    select: (_fields: string) => ({
      eq: (field: string, value: string) => ({
        then: (callback: (result: any) => void) => {
          // Mock user roles lookup
          if (table === 'user_roles' && field === 'user_id') {
            const user = DEMO_USERS.find(u => u.id === value)
            const roles = user?.roles.map(role => ({ role })) || []
            callback({ data: roles, error: null })
          }
          return Promise.resolve({ data: [], error: null })
        }
      })
    })
  })
}