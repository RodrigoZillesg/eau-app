import { supabase } from '../lib/supabase/client'
import { showNotification } from '../lib/notifications'

// Types
export interface Member {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  mobile?: string
  company_name?: string
  company_id?: string
  street_address?: string
  suburb?: string
  postcode?: string
  state?: string
  country?: string
  membership_status?: string
  membership_type?: string
  user_id?: string
}

export interface DuplicateMatch {
  member1: Member
  member2: Member
  similarity_score: number
  match_details: MatchDetails
}

export interface MatchDetails {
  exact_name: boolean
  similar_name: boolean
  name_similarity_score?: number
  same_company: boolean
  similar_email: boolean
  email_domain_match?: boolean
  same_phone: boolean
  same_address: boolean
  address_components_match?: {
    street: boolean
    suburb: boolean
    postcode: boolean
    state: boolean
  }
}

export interface MemberDuplicate {
  id: string
  member1_id: string
  member2_id: string
  similarity_score: number
  match_details: MatchDetails
  status: 'pending' | 'merged' | 'not_duplicate' | 'skipped'
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  created_at: string
}

export interface MergeConfig {
  // Which member to keep as primary
  primary_member_id: string
  
  // Field selection (true = keep from primary, false = keep from secondary)
  fields_to_keep: {
    first_name: boolean
    last_name: boolean
    email: boolean
    phone: boolean
    mobile: boolean
    company_name: boolean
    company_id: boolean
    street_address: boolean
    suburb: boolean
    postcode: boolean
    state: boolean
    country: boolean
    membership_status: boolean
    membership_type: boolean
    bio?: boolean
    subscriptions?: boolean
    // Add more fields as needed
  }
  
  // How to handle relationships
  relationships: {
    merge_cpd_activities: boolean
    merge_event_registrations: boolean
    merge_payments: boolean
    sum_cpd_points: boolean
  }
}

class MemberDuplicateService {
  // Calculate Levenshtein distance between two strings
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  // Calculate name similarity score
  private calculateNameSimilarity(name1: string, name2: string): number {
    const n1 = name1.toLowerCase().trim()
    const n2 = name2.toLowerCase().trim()
    
    if (n1 === n2) return 100
    
    const distance = this.levenshteinDistance(n1, n2)
    const maxLength = Math.max(n1.length, n2.length)
    
    if (maxLength === 0) return 0
    
    return Math.max(0, 100 - (distance * 100 / maxLength))
  }

  // Check if emails are similar
  private areEmailsSimilar(email1: string, email2: string): { similar: boolean; domain_match: boolean } {
    const e1 = email1.toLowerCase().trim()
    const e2 = email2.toLowerCase().trim()
    
    if (e1 === e2) return { similar: true, domain_match: true }
    
    const domain1 = e1.split('@')[1]
    const domain2 = e2.split('@')[1]
    
    const domainMatch = domain1 === domain2
    
    // Check if the local part is similar (before @)
    const local1 = e1.split('@')[0]
    const local2 = e2.split('@')[0]
    const localSimilarity = this.calculateNameSimilarity(local1, local2)
    
    return {
      similar: domainMatch && localSimilarity > 70,
      domain_match: domainMatch
    }
  }

  // Calculate duplicate score and match details
  public calculateDuplicateScore(member1: Member, member2: Member): DuplicateMatch {
    let score = 0
    const matchDetails: MatchDetails = {
      exact_name: false,
      similar_name: false,
      same_company: false,
      similar_email: false,
      same_phone: false,
      same_address: false
    }

    // Name comparison (max 40 points)
    const fullName1 = `${member1.first_name || ''} ${member1.last_name || ''}`.trim()
    const fullName2 = `${member2.first_name || ''} ${member2.last_name || ''}`.trim()
    
    const nameSimilarity = this.calculateNameSimilarity(fullName1, fullName2)
    matchDetails.name_similarity_score = nameSimilarity
    
    if (nameSimilarity === 100) {
      matchDetails.exact_name = true
      score += 40
    } else if (nameSimilarity > 80) {
      matchDetails.similar_name = true
      score += 30
    } else if (nameSimilarity > 60) {
      matchDetails.similar_name = true
      score += 20
    }

    // Company comparison (20 points)
    if (member1.company_id && member2.company_id && member1.company_id === member2.company_id) {
      matchDetails.same_company = true
      score += 20
    } else if (member1.company_name && member2.company_name) {
      const companySimilarity = this.calculateNameSimilarity(member1.company_name, member2.company_name)
      if (companySimilarity > 80) {
        matchDetails.same_company = true
        score += 15
      }
    }

    // Email comparison (15 points)
    if (member1.email && member2.email) {
      const emailCheck = this.areEmailsSimilar(member1.email, member2.email)
      matchDetails.similar_email = emailCheck.similar
      matchDetails.email_domain_match = emailCheck.domain_match
      
      if (emailCheck.similar) {
        score += 15
      } else if (emailCheck.domain_match) {
        score += 10
      }
    }

    // Phone comparison (10 points)
    const phone1 = (member1.phone || member1.mobile || '').replace(/\D/g, '')
    const phone2 = (member2.phone || member2.mobile || '').replace(/\D/g, '')
    
    if (phone1 && phone2 && phone1 === phone2) {
      matchDetails.same_phone = true
      score += 10
    }

    // Address comparison (15 points total)
    const addressMatch = {
      street: false,
      suburb: false,
      postcode: false,
      state: false
    }
    
    if (member1.street_address && member2.street_address) {
      const streetSimilarity = this.calculateNameSimilarity(member1.street_address, member2.street_address)
      addressMatch.street = streetSimilarity > 80
      if (addressMatch.street) score += 5
    }
    
    if (member1.suburb && member2.suburb && member1.suburb.toLowerCase() === member2.suburb.toLowerCase()) {
      addressMatch.suburb = true
      score += 3
    }
    
    if (member1.postcode && member2.postcode && member1.postcode === member2.postcode) {
      addressMatch.postcode = true
      score += 4
    }
    
    if (member1.state && member2.state && member1.state.toLowerCase() === member2.state.toLowerCase()) {
      addressMatch.state = true
      score += 3
    }
    
    const hasAddressMatch = Object.values(addressMatch).some(v => v)
    if (hasAddressMatch) {
      matchDetails.same_address = true
      matchDetails.address_components_match = addressMatch
    }

    return {
      member1,
      member2,
      similarity_score: Math.min(100, score),
      match_details: matchDetails
    }
  }

  // Find potential duplicates for a specific member
  async findDuplicatesForMember(memberId: string, threshold: number = 50): Promise<DuplicateMatch[]> {
    try {
      // Get the target member
      const { data: targetMember, error: targetError } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single()
      
      if (targetError || !targetMember) {
        throw new Error('Member not found')
      }

      // Get all other members to compare
      const { data: allMembers, error: membersError } = await supabase
        .from('members')
        .select('*')
        .neq('id', memberId)
      
      if (membersError) throw membersError

      const potentialDuplicates: DuplicateMatch[] = []

      for (const member of allMembers || []) {
        const match = this.calculateDuplicateScore(targetMember, member)
        if (match.similarity_score >= threshold) {
          potentialDuplicates.push(match)
        }
      }

      // Sort by score descending
      return potentialDuplicates.sort((a, b) => b.similarity_score - a.similarity_score)
    } catch (error) {
      console.error('Error finding duplicates:', error)
      throw error
    }
  }

  // Find all potential duplicates in the system
  async findAllDuplicates(threshold: number = 50): Promise<DuplicateMatch[]> {
    try {
      const { data: allMembers, error } = await supabase
        .from('members')
        .select('*')
        .order('last_name', { ascending: true })
      
      if (error) throw error

      const potentialDuplicates: DuplicateMatch[] = []
      const processed = new Set<string>()

      for (let i = 0; i < (allMembers?.length || 0); i++) {
        for (let j = i + 1; j < (allMembers?.length || 0); j++) {
          const member1 = allMembers![i]
          const member2 = allMembers![j]
          
          // Skip if we've already processed this pair
          const pairKey = [member1.id, member2.id].sort().join('-')
          if (processed.has(pairKey)) continue
          processed.add(pairKey)

          const match = this.calculateDuplicateScore(member1, member2)
          if (match.similarity_score >= threshold) {
            potentialDuplicates.push(match)
          }
        }
      }

      return potentialDuplicates.sort((a, b) => b.similarity_score - a.similarity_score)
    } catch (error) {
      console.error('Error finding all duplicates:', error)
      throw error
    }
  }

  // Save duplicate to database
  async saveDuplicate(match: DuplicateMatch): Promise<void> {
    try {
      const { error } = await supabase
        .from('member_duplicates')
        .upsert({
          member1_id: match.member1.id,
          member2_id: match.member2.id,
          similarity_score: match.similarity_score,
          match_details: match.match_details,
          status: 'pending'
        }, {
          onConflict: 'member1_id,member2_id'
        })
      
      if (error) throw error
    } catch (error) {
      console.error('Error saving duplicate:', error)
      throw error
    }
  }

  // Get pending duplicates
  async getPendingDuplicates(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('pending_duplicates_view')
        .select('*')
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching pending duplicates:', error)
      throw error
    }
  }

  // Mark duplicate as reviewed
  async reviewDuplicate(
    duplicateId: string, 
    status: 'merged' | 'not_duplicate' | 'skipped',
    notes?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('member_duplicates')
        .update({
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes
        })
        .eq('id', duplicateId)
      
      if (error) throw error
      
      showNotification('success', `Duplicate marked as ${status.replace('_', ' ')}`)
    } catch (error) {
      console.error('Error reviewing duplicate:', error)
      showNotification('error', 'Failed to review duplicate')
      throw error
    }
  }

  // Merge two members
  async mergeMembers(duplicateId: string, config: MergeConfig): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Get the duplicate record
      const { data: duplicate, error: dupError } = await supabase
        .from('member_duplicates')
        .select('*')
        .eq('id', duplicateId)
        .single()
      
      if (dupError) throw dupError

      const primaryId = config.primary_member_id
      const secondaryId = primaryId === duplicate.member1_id 
        ? duplicate.member2_id 
        : duplicate.member1_id

      // Get both members
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('*')
        .in('id', [primaryId, secondaryId])
      
      if (membersError) throw membersError
      
      const primaryMember = members.find(m => m.id === primaryId)
      const secondaryMember = members.find(m => m.id === secondaryId)

      if (!primaryMember || !secondaryMember) {
        throw new Error('Members not found')
      }

      // Build update object based on config
      const updates: any = {}
      for (const [field, keepFromPrimary] of Object.entries(config.fields_to_keep)) {
        if (!keepFromPrimary && secondaryMember[field]) {
          updates[field] = secondaryMember[field]
        }
      }

      // Update primary member with selected fields
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('members')
          .update(updates)
          .eq('id', primaryId)
        
        if (updateError) throw updateError
      }

      // Transfer relationships if configured
      if (config.relationships.merge_cpd_activities) {
        const { error: cpdError } = await supabase
          .from('cpd_activities')
          .update({ member_id: primaryId })
          .eq('member_id', secondaryId)
        
        if (cpdError) console.error('Error transferring CPD activities:', cpdError)
      }

      if (config.relationships.merge_event_registrations) {
        try {
          // Precisa pegar o user_id dos membros, não o member_id
          // Primeiro, pega os user_ids associados aos membros
          const { data: member1Data } = await supabase
            .from('members')
            .select('user_id')
            .eq('id', primaryId)
            .single()
          
          const { data: member2Data } = await supabase
            .from('members')
            .select('user_id')
            .eq('id', secondaryId)
            .single()
          
          if (member1Data?.user_id && member2Data?.user_id) {
            // Verifica se existem registros para transferir
            const { data: registrations, error: checkError } = await supabase
              .from('event_registrations')
              .select('id')
              .eq('user_id', member2Data.user_id)
              .limit(1)
            
            // Se houver registros, transfere
            if (!checkError && registrations && registrations.length > 0) {
              const { data: allRegs } = await supabase
                .from('event_registrations')
                .select('count', { count: 'exact', head: true })
                .eq('user_id', member2Data.user_id)
              
              const { error: eventError } = await supabase
                .from('event_registrations')
                .update({ user_id: member1Data.user_id })
                .eq('user_id', member2Data.user_id)
              
              if (eventError) {
                console.log('Event registrations transfer warning:', eventError.message || 'Unknown error')
              } else {
                console.log(`Transferred ${allRegs?.count || 0} event registrations`)
              }
            } else if (!checkError) {
              console.log('No event registrations to transfer')
            }
          } else {
            console.log('Members do not have associated user accounts, skipping event transfer')
          }
        } catch (error) {
          console.log('Event registrations transfer error:', error)
        }
      }

      // Transfer payments if requested and table exists
      if (config.relationships.merge_payments) {
        try {
          // Primeiro verifica se existem pagamentos para transferir
          const { data: payments, error: checkError } = await supabase
            .from('payments')
            .select('id')
            .eq('member_id', secondaryId)
            .limit(1)
          
          // Se não houver erro de tabela inexistente e houver pagamentos, transfere
          if (!checkError && payments && payments.length > 0) {
            const { error: paymentError } = await supabase
              .from('payments')
              .update({ member_id: primaryId })
              .eq('member_id', secondaryId)
            
            if (paymentError) {
              console.log('Payments transfer warning:', paymentError.message || 'Unknown error')
            } else {
              console.log(`Transferred ${payments.length} payments`)
            }
          } else if (checkError && (checkError.code === '42P01' || checkError.message?.includes('does not exist'))) {
            console.log('Payments table not configured, skipping transfer')
          }
        } catch (error) {
          console.log('Payments transfer skipped')
        }
      }

      // Save merge history
      const { error: historyError } = await supabase
        .from('member_merge_history')
        .insert({
          kept_member_id: primaryId,
          deleted_member_id: secondaryId,
          deleted_member_data: secondaryMember,
          merge_data: config,
          relationships_transferred: config.relationships,
          performed_by: user?.id
        })
      
      if (historyError) console.error('Error saving merge history:', historyError)

      // Delete secondary member
      const { error: deleteError } = await supabase
        .from('members')
        .delete()
        .eq('id', secondaryId)
      
      if (deleteError) throw deleteError

      // Update duplicate status
      await this.reviewDuplicate(duplicateId, 'merged', 'Members successfully merged')

      showNotification('success', 'Members merged successfully')
    } catch (error) {
      console.error('Error merging members:', error)
      showNotification('error', 'Failed to merge members')
      throw error
    }
  }

  // Undo a merge (within 30 days)
  async undoMerge(mergeHistoryId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Get merge history
      const { data: history, error: historyError } = await supabase
        .from('member_merge_history')
        .select('*')
        .eq('id', mergeHistoryId)
        .single()
      
      if (historyError) throw historyError
      
      if (!history.can_undo || history.undone) {
        throw new Error('This merge cannot be undone')
      }

      if (new Date(history.undo_deadline) < new Date()) {
        throw new Error('Undo deadline has passed')
      }

      // Restore deleted member
      const { error: restoreError } = await supabase
        .from('members')
        .insert(history.deleted_member_data)
      
      if (restoreError) throw restoreError

      // TODO: Restore relationships based on history.relationships_transferred

      // Mark as undone
      const { error: updateError } = await supabase
        .from('member_merge_history')
        .update({
          undone: true,
          undone_by: user?.id,
          undone_at: new Date().toISOString()
        })
        .eq('id', mergeHistoryId)
      
      if (updateError) throw updateError

      showNotification('success', 'Merge undone successfully')
    } catch (error) {
      console.error('Error undoing merge:', error)
      showNotification('error', 'Failed to undo merge')
      throw error
    }
  }
}

export const memberDuplicateService = new MemberDuplicateService()