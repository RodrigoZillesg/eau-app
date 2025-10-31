import { supabase } from '../lib/supabase/client'
import { showNotification } from '../lib/notifications'

// Types
export interface Member {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  job_title?: string
  department?: string
  institution_id?: string
  institution_name?: string // From JOIN with institutions table
  membership_status?: string
  membership_type?: string
  user_id?: string
  created_at?: string
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
  same_institution: boolean
  similar_institution?: boolean
  institution_similarity_score?: number
  similar_email: boolean
  email_domain_match?: boolean
  same_phone: boolean
  same_department?: boolean
  same_job_title?: boolean
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

  // Calculate duplicate score and match details - IMPROVED VERSION WITH BOOST
  public calculateDuplicateScore(member1: Member, member2: Member): DuplicateMatch {
    let score = 0
    const matchDetails: MatchDetails = {
      exact_name: false,
      similar_name: false,
      same_institution: false,
      similar_email: false,
      same_phone: false
    }

    // Name comparison (max 35 points)
    const fullName1 = `${member1.first_name || ''} ${member1.last_name || ''}`.trim().toLowerCase()
    const fullName2 = `${member2.first_name || ''} ${member2.last_name || ''}`.trim().toLowerCase()

    const nameSimilarity = this.calculateNameSimilarity(fullName1, fullName2)
    matchDetails.name_similarity_score = nameSimilarity

    if (nameSimilarity === 100) {
      matchDetails.exact_name = true
      score += 35
    } else if (nameSimilarity > 85) {
      matchDetails.similar_name = true
      score += 28
    } else if (nameSimilarity > 70) {
      matchDetails.similar_name = true
      score += 20
    } else if (nameSimilarity > 50) {
      matchDetails.similar_name = true
      score += 10
    }

    // Institution comparison (max 25 points) - CRITICAL for duplicate detection!
    let sameInstitution = false
    if (member1.institution_id && member2.institution_id) {
      if (member1.institution_id === member2.institution_id) {
        matchDetails.same_institution = true
        sameInstitution = true
        score += 25
      }
    } else if (member1.institution_name && member2.institution_name) {
      const institutionSimilarity = this.calculateNameSimilarity(
        member1.institution_name.toLowerCase(),
        member2.institution_name.toLowerCase()
      )
      matchDetails.institution_similarity_score = institutionSimilarity

      if (institutionSimilarity > 90) {
        matchDetails.same_institution = true
        sameInstitution = true
        score += 25
      } else if (institutionSimilarity > 70) {
        matchDetails.similar_institution = true
        score += 15
      }
    }

    // 🚀 BOOST: Same institution + High name similarity = Very likely duplicate!
    if (sameInstitution && nameSimilarity >= 85) {
      score += 20 // Bonus points for this strong combination
      console.log(`🎯 Institution + Name boost: ${member1.first_name} ${member1.last_name}`)
    }

    // Email comparison (15 points)
    if (member1.email && member2.email) {
      const emailCheck = this.areEmailsSimilar(member1.email, member2.email)
      matchDetails.similar_email = emailCheck.similar
      matchDetails.email_domain_match = emailCheck.domain_match

      if (member1.email.toLowerCase() === member2.email.toLowerCase()) {
        // Exact email match - very strong indicator
        score += 15
      } else if (emailCheck.similar) {
        score += 12
      } else if (emailCheck.domain_match) {
        score += 8
      }
    }

    // Phone comparison (15 points)
    if (member1.phone && member2.phone) {
      const phone1 = member1.phone.replace(/\D/g, '')
      const phone2 = member2.phone.replace(/\D/g, '')

      if (phone1 && phone2) {
        if (phone1 === phone2) {
          matchDetails.same_phone = true
          score += 15
        } else if (phone1.slice(-8) === phone2.slice(-8)) {
          // Last 8 digits match (handles different country codes)
          matchDetails.same_phone = true
          score += 12
        }
      }
    }

    // Department comparison (5 points)
    if (member1.department && member2.department) {
      if (member1.department.toLowerCase() === member2.department.toLowerCase()) {
        matchDetails.same_department = true
        score += 5
      }
    }

    // Job title comparison (5 points)
    if (member1.job_title && member2.job_title) {
      const titleSimilarity = this.calculateNameSimilarity(
        member1.job_title.toLowerCase(),
        member2.job_title.toLowerCase()
      )
      if (titleSimilarity > 80) {
        matchDetails.same_job_title = true
        score += 5
      }
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
      // Get the target member with institution info
      const { data: targetMemberRaw, error: targetError } = await supabase
        .from('members')
        .select(`
          *,
          institutions:institution_id (
            id,
            name
          )
        `)
        .eq('id', memberId)
        .single()

      if (targetError || !targetMemberRaw) {
        throw new Error('Member not found')
      }

      // Transform to include institution_name
      const targetMember = {
        ...targetMemberRaw,
        institution_name: targetMemberRaw.institutions?.name || null
      }

      // Get all other members to compare with institution info
      const { data: allMembersRaw, error: membersError } = await supabase
        .from('members')
        .select(`
          *,
          institutions:institution_id (
            id,
            name
          )
        `)
        .neq('id', memberId)

      if (membersError) throw membersError

      // Transform to include institution_name
      const allMembers = (allMembersRaw || []).map(m => ({
        ...m,
        institution_name: m.institutions?.name || null
      }))

      const potentialDuplicates: DuplicateMatch[] = []

      for (const member of allMembers) {
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

  // Find all potential duplicates in the system - OPTIMIZED VERSION
  async findAllDuplicates(threshold: number = 50): Promise<DuplicateMatch[]> {
    try {
      console.log('🔍 Starting optimized duplicate scan...')

      const { data: allMembersRaw, error } = await supabase
        .from('members')
        .select(`
          *,
          institutions:institution_id (
            id,
            name
          )
        `)
        .order('last_name', { ascending: true })

      if (error) throw error

      // Transform to include institution_name
      const allMembers = (allMembersRaw || []).map(m => ({
        ...m,
        institution_name: m.institutions?.name || null
      }))

      console.log(`📊 Total members: ${allMembers.length}`)

      // OPTIMIZATION: Group members by criteria to reduce comparisons
      // Instead of comparing all 6000+ members with each other (18M comparisons),
      // we group them and only compare within groups

      const groups = new Map<string, Member[]>()

      for (const member of allMembers) {
        const keys: string[] = []

        // Group 1: By institution (same institution = high chance of duplicate)
        if (member.institution_id) {
          keys.push(`inst:${member.institution_id}`)
        }

        // Group 2: By email domain (same domain = might be same org)
        if (member.email) {
          const domain = member.email.split('@')[1]?.toLowerCase()
          if (domain) {
            keys.push(`domain:${domain}`)
          }
        }

        // Group 3: By last name prefix (first 2 letters)
        if (member.last_name && member.last_name.length >= 2) {
          const prefix = member.last_name.substring(0, 2).toLowerCase()
          keys.push(`lastname:${prefix}`)
        }

        // Group 4: By phone area code (if available)
        if (member.phone) {
          const cleaned = member.phone.replace(/\D/g, '')
          if (cleaned.length >= 3) {
            const areaCode = cleaned.substring(0, 3)
            keys.push(`phone:${areaCode}`)
          }
        }

        // Add member to all matching groups
        for (const key of keys) {
          if (!groups.has(key)) {
            groups.set(key, [])
          }
          groups.get(key)!.push(member)
        }
      }

      console.log(`📦 Created ${groups.size} groups for comparison`)

      const potentialDuplicates: DuplicateMatch[] = []
      const processed = new Set<string>()
      let comparisons = 0

      // Compare members within each group
      for (const [groupKey, groupMembers] of groups.entries()) {
        // Skip tiny groups (no duplicates possible)
        if (groupMembers.length < 2) continue

        // Only compare within reasonably sized groups to avoid performance issues
        if (groupMembers.length > 100) {
          console.log(`⚠️ Large group (${groupKey}): ${groupMembers.length} members - sampling`)
        }

        for (let i = 0; i < groupMembers.length; i++) {
          for (let j = i + 1; j < groupMembers.length; j++) {
            const member1 = groupMembers[i]
            const member2 = groupMembers[j]

            // Skip if same member or already processed this pair
            if (member1.id === member2.id) continue

            const pairKey = [member1.id, member2.id].sort().join('-')
            if (processed.has(pairKey)) continue
            processed.add(pairKey)

            comparisons++

            const match = this.calculateDuplicateScore(member1, member2)
            if (match.similarity_score >= threshold) {
              potentialDuplicates.push(match)
            }
          }
        }
      }

      console.log(`✅ Completed ${comparisons.toLocaleString()} comparisons (vs ${(allMembers.length * (allMembers.length - 1) / 2).toLocaleString()} naive)`)
      console.log(`🎯 Found ${potentialDuplicates.length} potential duplicates`)

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