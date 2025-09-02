// Serviço de demonstração para membros (sem Supabase)
import type { MemberWithRoles } from './members'
import type { MembershipStatus, MembershipType, MemberRole } from '../../types/supabase'

// Dados mock para demonstração
const mockMembers: MemberWithRoles[] = [
  {
    id: '1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    first_name: 'João',
    last_name: 'Silva',
    email: 'joao.silva@example.com',
    phone: '+61 123 456 789',
    date_of_birth: '1985-05-15',
    address_line1: '123 Collins Street',
    address_line2: null,
    city: 'Melbourne',
    state: 'VIC',
    postal_code: '3000',
    country: 'Australia',
    membership_status: 'active' as MembershipStatus,
    membership_type: 'premium' as MembershipType,
    membership_start_date: '2025-01-01',
    membership_end_date: null,
    profession: 'English Teacher',
    experience_years: 10,
    qualifications: 'TESOL Certified, Masters in Education',
    receive_newsletters: true,
    receive_event_notifications: true,
    created_by: 'demo-user',
    updated_by: 'demo-user',
    member_roles: [
      {
        id: '1',
        created_at: '2025-01-01T00:00:00Z',
        member_id: '1',
        role: 'member' as MemberRole
      }
    ]
  },
  {
    id: '2',
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
    first_name: 'Maria',
    last_name: 'Santos',
    email: 'maria.santos@example.com',
    phone: '+61 987 654 321',
    date_of_birth: '1990-08-22',
    address_line1: '456 Queen Street',
    address_line2: 'Apt 12',
    city: 'Sydney',
    state: 'NSW',
    postal_code: '2000',
    country: 'Australia',
    membership_status: 'active' as MembershipStatus,
    membership_type: 'standard' as MembershipType,
    membership_start_date: '2025-01-02',
    membership_end_date: null,
    profession: 'Language Coordinator',
    experience_years: 7,
    qualifications: 'CELTA Certified, Bachelor in Linguistics',
    receive_newsletters: true,
    receive_event_notifications: false,
    created_by: 'demo-user',
    updated_by: 'demo-user',
    member_roles: [
      {
        id: '2',
        created_at: '2025-01-02T00:00:00Z',
        member_id: '2',
        role: 'member' as MemberRole
      },
      {
        id: '3',
        created_at: '2025-01-02T00:00:00Z',
        member_id: '2',
        role: 'moderator' as MemberRole
      }
    ]
  },
  {
    id: '3',
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
    first_name: 'Peter',
    last_name: 'Johnson',
    email: 'peter.johnson@example.com',
    phone: null,
    date_of_birth: null,
    address_line1: null,
    address_line2: null,
    city: null,
    state: null,
    postal_code: null,
    country: 'Australia',
    membership_status: 'inactive' as MembershipStatus,
    membership_type: 'student' as MembershipType,
    membership_start_date: '2025-01-15',
    membership_end_date: '2025-12-31',
    profession: 'Student',
    experience_years: 2,
    qualifications: 'Currently studying TESOL',
    receive_newsletters: false,
    receive_event_notifications: true,
    created_by: 'demo-user',
    updated_by: 'demo-user',
    member_roles: [
      {
        id: '4',
        created_at: '2025-01-15T00:00:00Z',
        member_id: '3',
        role: 'member' as MemberRole
      }
    ]
  }
]

export class MembersDemoService {
  private static members: MemberWithRoles[] = [...mockMembers]
  private static nextId = 4

  // Simular delay de rede
  private static delay(ms: number = 300) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  static async getAllMembers(): Promise<MemberWithRoles[]> {
    await this.delay()
    return [...this.members]
  }

  static async getMemberById(id: string): Promise<MemberWithRoles | null> {
    await this.delay()
    return this.members.find(m => m.id === id) || null
  }

  static async getMemberByEmail(email: string): Promise<MemberWithRoles | null> {
    await this.delay()
    return this.members.find(m => m.email === email) || null
  }

  static async createMember(memberData: any): Promise<any> {
    await this.delay()
    
    const newMember: MemberWithRoles = {
      id: this.nextId.toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      first_name: memberData.first_name,
      last_name: memberData.last_name,
      email: memberData.email,
      phone: memberData.phone,
      date_of_birth: memberData.date_of_birth,
      address_line1: memberData.address_line1,
      address_line2: memberData.address_line2,
      city: memberData.city,
      state: memberData.state,
      postal_code: memberData.postal_code,
      country: memberData.country || 'Australia',
      membership_status: memberData.membership_status || 'active',
      membership_type: memberData.membership_type || 'standard',
      membership_start_date: memberData.membership_start_date || new Date().toISOString().split('T')[0],
      membership_end_date: memberData.membership_end_date,
      profession: memberData.profession,
      experience_years: memberData.experience_years,
      qualifications: memberData.qualifications,
      receive_newsletters: memberData.receive_newsletters ?? true,
      receive_event_notifications: memberData.receive_event_notifications ?? true,
      created_by: 'demo-user',
      updated_by: 'demo-user',
      member_roles: [{
        id: (this.nextId + 100).toString(),
        created_at: new Date().toISOString(),
        member_id: this.nextId.toString(),
        role: 'member' as MemberRole
      }]
    }

    this.members.push(newMember)
    this.nextId++
    
    return {
      id: newMember.id,
      created_at: newMember.created_at,
      updated_at: newMember.updated_at,
      first_name: newMember.first_name,
      last_name: newMember.last_name,
      email: newMember.email,
      phone: newMember.phone,
      date_of_birth: newMember.date_of_birth,
      address_line1: newMember.address_line1,
      address_line2: newMember.address_line2,
      city: newMember.city,
      state: newMember.state,
      postal_code: newMember.postal_code,
      country: newMember.country,
      membership_status: newMember.membership_status,
      membership_type: newMember.membership_type,
      membership_start_date: newMember.membership_start_date,
      membership_end_date: newMember.membership_end_date,
      profession: newMember.profession,
      experience_years: newMember.experience_years,
      qualifications: newMember.qualifications,
      receive_newsletters: newMember.receive_newsletters,
      receive_event_notifications: newMember.receive_event_notifications,
      created_by: newMember.created_by,
      updated_by: newMember.updated_by
    }
  }

  static async updateMember(id: string, updates: any): Promise<any> {
    await this.delay()
    
    const memberIndex = this.members.findIndex(m => m.id === id)
    if (memberIndex === -1) {
      throw new Error('Membro não encontrado')
    }

    this.members[memberIndex] = {
      ...this.members[memberIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    return this.members[memberIndex]
  }

  static async deleteMember(id: string): Promise<void> {
    await this.delay()
    
    const memberIndex = this.members.findIndex(m => m.id === id)
    if (memberIndex === -1) {
      throw new Error('Membro não encontrado')
    }

    this.members.splice(memberIndex, 1)
  }

  static async searchMembers(filters: {
    search?: string
    status?: MembershipStatus
    type?: MembershipType
    limit?: number
    offset?: number
  }): Promise<MemberWithRoles[]> {
    await this.delay()
    
    let filtered = [...this.members]

    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(m => 
        m.first_name.toLowerCase().includes(search) ||
        m.last_name.toLowerCase().includes(search) ||
        m.email.toLowerCase().includes(search)
      )
    }

    if (filters.status) {
      filtered = filtered.filter(m => m.membership_status === filters.status)
    }

    if (filters.type) {
      filtered = filtered.filter(m => m.membership_type === filters.type)
    }

    if (filters.offset) {
      filtered = filtered.slice(filters.offset)
    }

    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit)
    }

    return filtered
  }

  static async addMemberRole(memberId: string, role: MemberRole): Promise<void> {
    await this.delay()
    
    const member = this.members.find(m => m.id === memberId)
    if (!member) {
      throw new Error('Membro não encontrado')
    }

    const hasRole = member.member_roles.some(r => r.role === role)
    if (!hasRole) {
      member.member_roles.push({
        id: (Date.now()).toString(),
        created_at: new Date().toISOString(),
        member_id: memberId,
        role
      })
    }
  }

  static async removeMemberRole(memberId: string, role: MemberRole): Promise<void> {
    await this.delay()
    
    const member = this.members.find(m => m.id === memberId)
    if (!member) {
      throw new Error('Membro não encontrado')
    }

    member.member_roles = member.member_roles.filter(r => r.role !== role)
  }

  static async addMemberHistory(_memberId: string, _action: string, _details: any): Promise<void> {
    await this.delay()
    // Em modo demo, apenas simula a operação
  }

  static async getMemberHistory(_memberId: string) {
    await this.delay()
    return []
  }

  static async getMemberStats() {
    await this.delay()
    
    const total = this.members.length
    const active = this.members.filter(m => m.membership_status === 'active').length
    const thisMonth = new Date()
    thisMonth.setMonth(thisMonth.getMonth())
    const newThisMonth = this.members.filter(m => 
      new Date(m.created_at) >= new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)
    ).length

    return {
      total,
      active,
      newThisMonth,
      inactive: total - active
    }
  }
}