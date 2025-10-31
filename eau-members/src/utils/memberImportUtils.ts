// UTILITY FUNCTIONS FOR MEMBER IMPORT WITH AUTOMATIC AUTH USER CREATION
// This ensures all imported members have user_id populated

import { supabase } from '../lib/supabase/client'
import { MembersService } from '../lib/supabase/members'

interface ImportMemberData {
  email: string
  first_name: string
  last_name: string
  [key: string]: any // Other member fields
}

/**
 * Enhanced member creation that ALWAYS ensures user_id is populated
 * Use this instead of direct supabase.from('members').insert() calls
 */
export async function createMemberWithAuth(memberData: ImportMemberData): Promise<any> {
  try {
    // Ensure we have required fields
    if (!memberData.email) {
      throw new Error('Email is required for member creation')
    }

    // Get or create auth user
    const userId = await MembersService.ensureAuthUserForMember(
      memberData.email,
      memberData.first_name || '',
      memberData.last_name || ''
    )

    // Create member with user_id
    const finalMemberData = {
      ...memberData,
      user_id: userId
    }

    const { data, error } = await supabase
      .from('members')
      .insert(finalMemberData)
      .select('id')
      .single()

    if (error) {
      throw new Error(`Failed to create member: ${error.message}`)
    }

    console.log(`✅ Created member with auth: ${memberData.email} -> ${userId}`)
    return data

  } catch (error) {
    console.error(`❌ Error creating member with auth for ${memberData.email}:`, error)
    throw error
  }
}

/**
 * Batch import members with automatic auth user creation
 * Use this for CSV imports and bulk operations
 */
export async function batchImportMembersWithAuth(
  members: ImportMemberData[],
  onProgress?: (processed: number, total: number, current: string) => void
): Promise<{ success: number; failed: number; errors: string[] }> {

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  }

  console.log(`🚀 Starting batch import of ${members.length} members with auth creation...`)

  for (let i = 0; i < members.length; i++) {
    const member = members[i]

    try {
      await createMemberWithAuth(member)
      results.success++

      // Progress callback
      onProgress?.(i + 1, members.length, member.email)

      // Small delay to prevent rate limiting
      if (i > 0 && i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }

    } catch (error) {
      results.failed++
      const errorMsg = `${member.email}: ${error instanceof Error ? error.message : 'Unknown error'}`
      results.errors.push(errorMsg)
      console.error(`❌ Failed to import member ${member.email}:`, error)
    }
  }

  console.log(`📊 Batch import complete: ${results.success} success, ${results.failed} failed`)
  return results
}

/**
 * Fix existing members without user_id
 * This should be run once to fix the current 6,056 members
 */
export async function fixExistingMembersWithoutUserId(
  onProgress?: (processed: number, total: number, current: string) => void
): Promise<{ success: number; failed: number; errors: string[] }> {

  try {
    console.log('🔍 Finding members without user_id...')

    // Get all members without user_id
    const { data: membersWithoutUserId, error } = await supabase
      .from('members')
      .select('id, email, first_name, last_name')
      .is('user_id', null)
      .not('email', 'is', null)
      .neq('email', '')

    if (error) {
      throw new Error(`Failed to fetch members: ${error.message}`)
    }

    if (!membersWithoutUserId || membersWithoutUserId.length === 0) {
      console.log('✅ All members already have user_id!')
      return { success: 0, failed: 0, errors: [] }
    }

    console.log(`📊 Found ${membersWithoutUserId.length} members without user_id`)

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Process in batches
    for (let i = 0; i < membersWithoutUserId.length; i++) {
      const member = membersWithoutUserId[i]

      try {
        // Create auth user
        const userId = await MembersService.ensureAuthUserForMember(
          member.email,
          member.first_name || '',
          member.last_name || ''
        )

        // Update member with user_id
        const { error: updateError } = await supabase
          .from('members')
          .update({ user_id: userId })
          .eq('id', member.id)

        if (updateError) {
          throw new Error(`Failed to update member: ${updateError.message}`)
        }

        results.success++
        console.log(`✅ Fixed member: ${member.email} -> ${userId}`)

        // Progress callback
        onProgress?.(i + 1, membersWithoutUserId.length, member.email)

        // Delay to prevent rate limiting
        if (i > 0 && i % 25 === 0) {
          console.log(`⏳ Processed ${i + 1}/${membersWithoutUserId.length}, pausing...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

      } catch (error) {
        results.failed++
        const errorMsg = `${member.email}: ${error instanceof Error ? error.message : 'Unknown error'}`
        results.errors.push(errorMsg)
        console.error(`❌ Failed to fix member ${member.email}:`, error)
      }
    }

    console.log(`🎉 Fix complete: ${results.success} success, ${results.failed} failed`)
    return results

  } catch (error) {
    console.error('❌ Critical error in fixExistingMembersWithoutUserId:', error)
    throw error
  }
}