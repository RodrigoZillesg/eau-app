import { supabase } from '../lib/supabase'

export const memberService = {
  async getMemberById(id: string) {
    // Get member data
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    // Try to get counts separately (more reliable than joins)
    let cpd_count = 0
    let events_count = 0

    try {
      const { count: cpdCount } = await supabase
        .from('cpd_activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', data.user_id)
      cpd_count = cpdCount || 0
    } catch (e) {
      console.warn('Could not fetch CPD count:', e)
    }

    try {
      const { count: eventCount } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', data.user_id)
      events_count = eventCount || 0
    } catch (e) {
      console.warn('Could not fetch event count:', e)
    }

    const member = {
      ...data,
      cpd_activities_count: cpd_count,
      events_count: events_count,
      payments_count: 0 // Payments table doesn't exist yet
    }

    return member
  },

  async searchMembers(searchTerm: string) {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .limit(10)
    
    if (error) throw error
    return data
  },

  async getAllMembers() {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }
}