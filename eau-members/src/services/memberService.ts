import { supabase } from '../lib/supabase'

export const memberService = {
  async getMemberById(id: string) {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        cpd_activities_count:cpd_activities(count),
        events_count:event_registrations(count)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    // Transform the counts
    const member = {
      ...data,
      cpd_activities_count: data.cpd_activities_count?.[0]?.count || 0,
      events_count: data.events_count?.[0]?.count || 0,
      payments_count: 0 // Placeholder for now
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