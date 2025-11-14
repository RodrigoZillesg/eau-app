import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Building2, Users, CreditCard, Upload, AlertTriangle, Search, Pause, Play, X, RotateCcw } from 'lucide-react'
import { showNotification } from '../../../lib/notifications'
import { supabaseAdmin } from '../../../lib/supabase/adminClient'
import { memberDuplicateService } from '../../../services/memberDuplicateService'
import Papa from 'papaparse'

interface CompleteImportData {
  // Membership fields
  membershipId: string
  startDate: string
  expiryDate: string
  lastRenewedDate: string
  status: string
  previousExpiryDate: string
  pendingStatus: string
  
  // Member fields
  userId: string
  memberTest: string
  memberEditableAddress: string
  memberTitle: string
  memberFirstName: string
  memberLastName: string
  memberEmail: string
  memberCompanyName: string
  memberCompanyNameActual: string
  memberPosition: string
  memberStreetAddress: string
  memberStreetAddressLine2: string
  memberSuburb: string
  memberPostcode: string
  memberState: string
  memberCountry: string
  memberMobile: string
  memberSubscriptions: string
  memberBio: string
  memberBoardRole: string
  memberAreaExpertise: string
  memberUnsubscribeNotes: string
  memberTeacherSince: string
  memberCoursesTaught: string
  memberInterestTags: string
  memberEmailSubscriptions: string
  memberUsername: string
  memberGroups: string
  memberCreated: string
  memberLastEdited: string
  
  // Membership details
  totalMembers: string
  category: string
  type: string
  pricingOption: string
  pricingOptionCost: string
  targetType: string
  
  // Primary contact
  primaryContactUserId: string
  primaryContactFirstName: string
  primaryContactLastName: string
  primaryContactEmail: string
  
  // Company fields
  companyId: string
  companyName: string
  companyEmail: string
  
  // Company details
  companyCompanyName: string
  companyParentCompany: string
  companyABN: string
  companyCompanyEmail: string
  companyCompanyType: string
  companyCRICOSCode: string
  companyAddressLine1: string
  companyAddressLine2: string
  companyAddressLine3: string
  companySuburb: string
  companyPostcode: string
  companyState: string
  companyCountry: string
  companyPhone: string
  companyPrimaryContact: string
  companyCoursesOffered: string
  companyLogo: string
  companyWebsite: string
  companyMemberSince: string
  companyCancellationDetails: string
}

interface ImportStats {
  companies: { total: number; created: number; existing: number; failed: number }
  memberships: { total: number; created: number; existing: number; failed: number }
  members: { total: number; created: number; existing: number; failed: number }
}

export const CompleteImportPage: React.FC = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const [importSessionId, setImportSessionId] = useState<string | null>(null)
  const [canResume, setCanResume] = useState(false)
  const [importStats, setImportStats] = useState<ImportStats | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [progress, setProgress] = useState({ phase: '', message: '', current: 0, total: 0 })
  const [duplicatesFound, setDuplicatesFound] = useState(0)
  const [lastProcessedIndex, setLastProcessedIndex] = useState(-1)
  const [savedFileContent, setSavedFileContent] = useState<string | null>(null)
  
  // Refs para controle de pause/cancel
  const abortControllerRef = useRef<AbortController | null>(null)
  const pauseRequestedRef = useRef(false)
  const processedItemsRef = useRef<Set<string>>(new Set())
  
  // Load saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('importSessionState')
    if (savedState) {
      try {
        const state = JSON.parse(savedState)
        if (state.importSessionId) {
          setImportSessionId(state.importSessionId)
          setCanResume(true)
          setProgress(state.progress || { phase: '', message: '', current: 0, total: 0 })
          setImportStats(state.importStats || null)
          setLastProcessedIndex(state.lastProcessedIndex || -1)
          setErrors(state.errors || [])
          setSavedFileContent(state.fileContent || null)
          if (state.processedItems) {
            processedItemsRef.current = new Set(state.processedItems)
          }
          showNotification('info', 'Previous import session found', 'You can resume from where you left off')
        }
      } catch (error) {
        console.error('Failed to load saved import state:', error)
      }
    }
  }, [])
  
  // Save state when paused
  const saveImportState = useCallback(() => {
    if (importSessionId && isPaused) {
      const state = {
        importSessionId,
        progress,
        importStats,
        lastProcessedIndex,
        errors,
        processedItems: Array.from(processedItemsRef.current),
        fileContent: savedFileContent,
        savedAt: new Date().toISOString()
      }
      localStorage.setItem('importSessionState', JSON.stringify(state))
    }
  }, [importSessionId, progress, importStats, lastProcessedIndex, errors, isPaused, savedFileContent])
  
  // Save state when paused
  useEffect(() => {
    if (isPaused) {
      saveImportState()
    }
  }, [isPaused, saveImportState])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setImportStats(null)
      setErrors([])
      // Read file content for persistence
      const reader = new FileReader()
      reader.onload = (e) => {
        setSavedFileContent(e.target?.result as string)
      }
      reader.readAsText(selectedFile)
      setCanResume(false)
    }
  }

  const parseCSVFile = (file: File): Promise<CompleteImportData[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          try {
            const data = results.data
              .filter((row: any) => row && Object.keys(row).length > 1)
              .map((row: any) => ({
                // Membership
                membershipId: row['ID'] || '',
                startDate: row['Start Date'] || '',
                expiryDate: row['Expiry Date'] || '',
                lastRenewedDate: row['Last Renewed Date'] || '',
                status: row['Status'] || '',
                previousExpiryDate: row['Previous Expiry Date'] || '',
                pendingStatus: row['Pending Status'] || '',
                
                // Member
                userId: row['UserId'] || '',
                memberTest: row['Member Test'] || '',
                memberEditableAddress: row['Member Editable Address'] || '',
                memberTitle: row['Member Title'] || '',
                memberFirstName: row['Member First Name'] || '',
                memberLastName: row['Member Last Name'] || '',
                memberEmail: row['Member Email Address'] || '',
                memberCompanyName: row['Member Company Name'] || '',
                memberCompanyNameActual: row['Member Company Name (Actual name)'] || '',
                memberPosition: row['Member Position'] || '',
                memberStreetAddress: row['Member Street Address'] || '',
                memberStreetAddressLine2: row['Member Street Address Line 2'] || '',
                memberSuburb: row['Member Suburb'] || '',
                memberPostcode: row['Member Postcode'] || '',
                memberState: row['Member State'] || '',
                memberCountry: row['Member Country'] || '',
                memberMobile: row['Member Mobile'] || '',
                memberSubscriptions: row['Member Subscriptions'] || '',
                memberBio: row['Member Bio'] || '',
                memberBoardRole: row['Member Board Member Role'] || '',
                memberAreaExpertise: row['Member Area of Expertise'] || '',
                memberUnsubscribeNotes: row['Member Unsubscribe Notes'] || '',
                memberTeacherSince: row['Member Teacher Since'] || '',
                memberCoursesTaught: row['Member Courses Taught'] || '',
                memberInterestTags: row['Member Interest Tags'] || '',
                memberEmailSubscriptions: row['Member Email Subscriptions'] || '',
                memberUsername: row['Member Username'] || '',
                memberGroups: row['Member Groups'] || '',
                memberCreated: row['Member Created'] || '',
                memberLastEdited: row['Member Last Edited'] || '',
                
                // Membership details
                totalMembers: row['Total Members'] || '1',
                category: row['Category'] || '',
                type: row['Type'] || '',
                pricingOption: row['Pricing Option'] || '',
                pricingOptionCost: row['Pricing Option Cost'] || '0',
                targetType: row['Target (Individual/Organisation)'] || '',
                
                // Primary contact
                primaryContactUserId: row["Primary Contact's User ID"] || '',
                primaryContactFirstName: row["Primary Contact's First Name"] || '',
                primaryContactLastName: row["Primary Contact's Last Name"] || '',
                primaryContactEmail: row["Primary Contact's Email"] || '',
                
                // Company
                companyId: row['Company ID'] || '',
                companyName: row['Company Name'] || '',
                companyEmail: row['Company Email'] || '',
                
                // Company details
                companyCompanyName: row['Company Company Name'] || '',
                companyParentCompany: row['Company Parent Company'] || '',
                companyABN: row['Company ABN'] || '',
                companyCompanyEmail: row['Company Company Email Address'] || '',
                companyCompanyType: row['Company Company Type'] || '',
                companyCRICOSCode: row['Company CRICOS Code'] || '',
                companyAddressLine1: row['Company Company Address Line 1'] || '',
                companyAddressLine2: row['Company Company Address Line 2'] || '',
                companyAddressLine3: row['Company Company Address Line 3'] || '',
                companySuburb: row['Company Company Suburb'] || '',
                companyPostcode: row['Company Company Postcode'] || '',
                companyState: row['Company Company State'] || '',
                companyCountry: row['Company Company Country'] || '',
                companyPhone: row['Company Company Phone'] || '',
                companyPrimaryContact: row['Company Primary Contact'] || '',
                companyCoursesOffered: row['Company Courses Offered'] || '',
                companyLogo: row['Company Logo'] || '',
                companyWebsite: row['Company Website'] || '',
                companyMemberSince: row['Company Member Since: (Date)'] || '',
                companyCancellationDetails: row['Company Membership Cancellation Details'] || ''
              }))
            resolve(data)
          } catch (error) {
            reject(new Error('Failed to parse CSV file'))
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`))
        }
      })
    })
  }

  // Função para pausar importação
  const handlePause = () => {
    pauseRequestedRef.current = true
    setIsPaused(true)
    showNotification('info', 'Import paused. You can resume later.')
  }

  // Função para resumir importação
  const handleResume = () => {
    pauseRequestedRef.current = false
    setIsPaused(false)
    // Resume from where we left off
    if (file && lastProcessedIndex > -1) {
      handleImport()
    }
  }

  // Função para cancelar importação
  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel the import? You can resume it later.')) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      setIsCancelled(true)
      setIsProcessing(false)
      setIsPaused(false)
      showNotification('warning', 'Import cancelled')
    }
  }

  // Função para resetar e começar do zero
  const handleReset = () => {
    if (confirm('Are you sure you want to reset? This will clear all progress.')) {
      processedItemsRef.current.clear()
      setImportSessionId(null)
      setCanResume(false)
      setIsPaused(false)
      setIsCancelled(false)
      setProgress({ phase: '', message: '', current: 0, total: 0 })
      setImportStats(null)
      setErrors([])
      setLastProcessedIndex(-1)
      setSavedFileContent(null)
      localStorage.removeItem('importSessionState')
      showNotification('info', 'Import reset. You can start fresh.')
    }
  }

  const handleImport = async () => {
    if (!file && !savedFileContent) {
      showNotification('error', 'No file selected or saved session to resume')
      return
    }

    try {
      setIsProcessing(true)
      setIsCancelled(false)
      pauseRequestedRef.current = false
      setErrors([])
      
      // Generate unique session ID if not resuming
      if (!importSessionId) {
        const sessionId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        setImportSessionId(sessionId)
      }
      
      const stats: ImportStats = importStats || {
        companies: { total: 0, created: 0, existing: 0, failed: 0 },
        memberships: { total: 0, created: 0, existing: 0, failed: 0 },
        members: { total: 0, created: 0, existing: 0, failed: 0 }
      }

      // Helper function to validate and format dates
      const formatDate = (dateStr: string | null | undefined): string | null => {
        if (!dateStr || dateStr === '' || dateStr === '0000-00-00' || dateStr === '0000-00-00 00:00:00') {
          return null
        }
        // Check if date is valid
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) {
          return null
        }
        // Return in YYYY-MM-DD format
        return dateStr.split(' ')[0] // Get just the date part
      }

      // Parse CSV - use saved content if resuming without file
      setProgress({ phase: 'parsing', message: 'Reading CSV file...', current: 0, total: 100 })
      let records: CompleteImportData[] = []
      
      if (file) {
        records = await parseCSVFile(file)
      } else if (canResume && savedFileContent) {
        // Parse saved content if resuming without file
        records = await new Promise<CompleteImportData[]>((resolve, reject) => {
          Papa.parse(savedFileContent, {
            header: true,
            complete: (results) => {
              try {
                const data = results.data
                  .filter((row: any) => row && Object.keys(row).length > 1)
                  .map((row: any) => ({
                    // Same mapping as parseCSVFile
                    membershipId: row['ID'] || '',
                    startDate: row['Start Date'] || '',
                    expiryDate: row['Expiry Date'] || '',
                    lastRenewedDate: row['Last Renewed Date'] || '',
                    status: row['Status'] || '',
                    previousExpiryDate: row['Previous Expiry Date'] || '',
                    pendingStatus: row['Pending Status'] || '',
                    userId: row['UserId'] || '',
                    memberTest: row['Member Test'] || '',
                    memberEditableAddress: row['Member Editable Address'] || '',
                    memberTitle: row['Member Title'] || '',
                    memberFirstName: row['Member First Name'] || '',
                    memberLastName: row['Member Last Name'] || '',
                    memberEmail: row['Member Email'] || '',
                    memberCompanyName: row['Member Company Name'] || '',
                    memberCompanyNameActual: row['Member Company Name Actual'] || '',
                    memberPosition: row['Member Position'] || '',
                    memberStreetAddress: row['Member Street Address'] || '',
                    memberStreetAddressLine2: row['Member Street Address Line 2'] || '',
                    memberSuburb: row['Member Suburb'] || '',
                    memberPostcode: row['Member Postcode'] || '',
                    memberState: row['Member State'] || '',
                    memberCountry: row['Member Country'] || '',
                    memberMobile: row['Member Mobile'] || '',
                    memberSubscriptions: row['Member Subscriptions'] || '',
                    memberBio: row['Member Bio'] || '',
                    memberBoardRole: row['Member Board Member Role'] || '',
                    memberAreaExpertise: row['Member Area Expertise'] || '',
                    memberUnsubscribeNotes: row['Member Unsubscribe Notes'] || '',
                    memberTeacherSince: row['Member Teacher Since'] || '',
                    memberCoursesTaught: row['Member Courses Taught'] || '',
                    memberInterestTags: row['Member Interest Tags'] || '',
                    memberEmailSubscriptions: row['Member Email Subscriptions'] || '',
                    memberUsername: row['Member Username'] || '',
                    memberGroups: row['Member Groups'] || '',
                    memberCreated: row['Member Created'] || '',
                    memberLastEdited: row['Member Last Edited'] || '',
                    totalMembers: row['Total Members'] || '',
                    category: row['Category'] || '',
                    type: row['Type'] || '',
                    pricingOption: row['Pricing Option'] || '',
                    pricingOptionCost: row['Pricing Option Cost'] || '',
                    targetType: row['Target Type'] || '',
                    primaryContactUserId: row['Primary Contact User Id'] || '',
                    primaryContactFirstName: row['Primary Contact First Name'] || '',
                    primaryContactLastName: row['Primary Contact Last Name'] || '',
                    primaryContactEmail: row['Primary Contact Email'] || '',
                    companyId: row['Company Id'] || '',
                    companyName: row['Company Name'] || '',
                    companyEmail: row['Company Email'] || '',
                    companyCompanyName: row['Company Company Name'] || '',
                    companyParentCompany: row['Company Parent Company'] || '',
                    companyABN: row['Company ABN'] || '',
                    companyCompanyEmail: row['Company Company Email'] || '',
                    companyCompanyType: row['Company Company Type'] || '',
                    companyCRICOSCode: row['Company CRICOS Code'] || '',
                    companyAddressLine1: row['Company Address Line1'] || '',
                    companyAddressLine2: row['Company Address Line2'] || '',
                    companyAddressLine3: row['Company Address Line3'] || '',
                    companySuburb: row['Company Suburb'] || '',
                    companyPostcode: row['Company Postcode'] || '',
                    companyState: row['Company State'] || '',
                    companyCountry: row['Company Country'] || '',
                    companyPhone: row['Company Phone'] || '',
                    companyPrimaryContact: row['Company Primary Contact'] || '',
                    companyCoursesOffered: row['Company Courses Offered'] || '',
                    companyLogo: row['Company Logo'] || '',
                    companyWebsite: row['Company Website'] || '',
                    companyMemberSince: row['Company Member Since'] || '',
                    companyCancellationDetails: row['Company Cancellation Details'] || ''
                  }))
                resolve(data as CompleteImportData[])
              } catch (error) {
                reject(new Error('Failed to parse CSV file'))
              }
            },
            error: (error) => {
              reject(new Error(`CSV parsing error: ${error.message}`))
            }
          })
        })
      } else {
        throw new Error('No file or saved content available')
      }
      
      // Track unique companies and memberships
      const companiesMap = new Map<string, any>()
      const membershipsMap = new Map<string, any>()
      
      // Process records to extract unique companies
      setProgress({ phase: 'companies', message: 'Processing companies...', current: 0, total: records.length })
      
      // Resume from last position if applicable
      const startIndex = canResume && lastProcessedIndex > -1 ? lastProcessedIndex : 0
      
      for (let i = startIndex; i < records.length; i++) {
        const record = records[i]
        
        // Check if pause was requested
        if (pauseRequestedRef.current) {
          setProgress({ 
            phase: 'companies', 
            message: 'Import paused', 
            current: i + 1, 
            total: records.length 
          })
          setLastProcessedIndex(i)
          setImportStats(stats)
          setCanResume(true)
          setIsProcessing(false)
          return // Exit to allow resume later
        }
        
        if (record.companyId && !companiesMap.has(record.companyId)) {
          companiesMap.set(record.companyId, {
            legacy_company_id: parseInt(record.companyId),
            company_name: record.companyCompanyName || record.companyName,
            parent_company: record.companyParentCompany,
            abn: record.companyABN,
            company_email: record.companyCompanyEmail || record.companyEmail,
            company_type: record.companyCompanyType,
            cricos_code: record.companyCRICOSCode,
            address_line_1: record.companyAddressLine1,
            address_line_2: record.companyAddressLine2,
            address_line_3: record.companyAddressLine3,
            suburb: record.companySuburb,
            postcode: record.companyPostcode,
            state: record.companyState,
            country: record.companyCountry || 'Australia',
            phone: record.companyPhone,
            website: record.companyWebsite,
            courses_offered: record.companyCoursesOffered,
            member_since: formatDate(record.companyMemberSince),
            membership_cancellation_details: record.companyCancellationDetails
          })
        }
      }
      
      // Create companies
      stats.companies.total = companiesMap.size
      for (const [companyId, companyData] of companiesMap) {
        try {
          // Check if company exists
          const { data: existing } = await supabaseAdmin
            .from('companies')
            .select('id')
            .eq('legacy_company_id', companyData.legacy_company_id)
            .maybeSingle()
          
          if (existing) {
            stats.companies.existing++
          } else {
            const { error } = await supabaseAdmin
              .from('companies')
              .insert(companyData)
            
            if (error) {
              stats.companies.failed++
              setErrors(prev => [...prev, `Company ${companyId}: ${error.message}`])
            } else {
              stats.companies.created++
            }
          }
        } catch (error) {
          stats.companies.failed++
          setErrors(prev => [...prev, `Company ${companyId}: ${error}`])
        }
      }
      
      // Process memberships
      setProgress({ phase: 'memberships', message: 'Processing memberships...', current: 0, total: records.length })
      
      // Resume from last position if applicable
      const membershipStartIndex = canResume && progress?.phase === 'memberships' && lastProcessedIndex > -1 ? lastProcessedIndex : 0
      
      for (let i = membershipStartIndex; i < records.length; i++) {
        const record = records[i]
        
        // Check if pause was requested
        if (pauseRequestedRef.current) {
          setProgress({ 
            phase: 'memberships', 
            message: 'Import paused', 
            current: stats.memberships.created + stats.memberships.failed, 
            total: records.length 
          })
          setLastProcessedIndex(i)
          return
        }
        
        if (record.membershipId && !membershipsMap.has(record.membershipId)) {
          // Get company UUID if exists
          let companyUuid = null
          if (record.companyId) {
            const { data } = await supabaseAdmin
              .from('companies')
              .select('id')
              .eq('legacy_company_id', parseInt(record.companyId))
              .maybeSingle()
            companyUuid = data?.id
          }
          
          membershipsMap.set(record.membershipId, {
            legacy_membership_id: parseInt(record.membershipId),
            start_date: formatDate(record.startDate),
            expiry_date: formatDate(record.expiryDate),
            last_renewed_date: formatDate(record.lastRenewedDate),
            previous_expiry_date: formatDate(record.previousExpiryDate),
            status: record.status || 'Active',
            pending_status: record.pendingStatus,
            category: record.category,
            membership_type: record.type,
            pricing_option: record.pricingOption,
            pricing_option_cost: parseFloat(record.pricingOptionCost) || 0,
            target_type: record.targetType,
            total_members: parseInt(record.totalMembers) || 1,
            company_id: companyUuid,
            primary_contact_user_id: record.primaryContactUserId ? parseInt(record.primaryContactUserId) : null
          })
        }
      }
      
      // Create memberships
      stats.memberships.total = membershipsMap.size
      for (const [membershipId, membershipData] of membershipsMap) {
        try {
          const { data: existing } = await supabaseAdmin
            .from('memberships')
            .select('id')
            .eq('legacy_membership_id', membershipData.legacy_membership_id)
            .maybeSingle()
          
          if (existing) {
            stats.memberships.existing++
          } else {
            const { error } = await supabaseAdmin
              .from('memberships')
              .insert(membershipData)
            
            if (error) {
              stats.memberships.failed++
              setErrors(prev => [...prev, `Membership ${membershipId}: ${error.message}`])
            } else {
              stats.memberships.created++
            }
          }
        } catch (error) {
          stats.memberships.failed++
          setErrors(prev => [...prev, `Membership ${membershipId}: ${error}`])
        }
      }
      
      // Process members
      setProgress({ phase: 'members', message: 'Processing members...', current: 0, total: records.length })
      stats.members.total = records.length
      
      // Resume from last position if applicable
      const memberStartIndex = canResume && progress?.phase === 'members' && lastProcessedIndex > -1 ? lastProcessedIndex : 0
      
      for (let i = memberStartIndex; i < records.length; i++) {
        const record = records[i]
        
        // Check if pause was requested
        if (pauseRequestedRef.current) {
          setProgress({ 
            phase: 'members', 
            message: 'Import paused', 
            current: i + 1, 
            total: records.length 
          })
          setLastProcessedIndex(i)
          return
        }
        
        setProgress({ 
          phase: 'members', 
          message: `Processing member ${i + 1} of ${records.length}...`, 
          current: i + 1, 
          total: records.length 
        })
        
        try {
          // Check if member exists
          const { data: existingMember } = await supabaseAdmin
            .from('members')
            .select('id')
            .eq('legacy_user_id', parseInt(record.userId))
            .maybeSingle()
          
          if (existingMember) {
            stats.members.existing++
            continue
          }
          
          // Get membership UUID
          let membershipUuid = null
          if (record.membershipId) {
            const { data } = await supabaseAdmin
              .from('memberships')
              .select('id')
              .eq('legacy_membership_id', parseInt(record.membershipId))
              .maybeSingle()
            membershipUuid = data?.id
          }
          
          // Get company UUID
          let companyUuid = null
          if (record.companyId) {
            const { data } = await supabaseAdmin
              .from('companies')
              .select('id')
              .eq('legacy_company_id', parseInt(record.companyId))
              .maybeSingle()
            companyUuid = data?.id
          }
          
          /**
           * Determine user_type based on Member Groups hierarchy
           *
           * ✅ SIMPLIFIED USER TYPE SYSTEM (Nov 2025)
           * Only 4 types: member, institution_admin, admin, super_admin
           *
           * Priority (highest to lowest):
           * 1. "super_admin" in Member Groups → 'super_admin'
           * 2. "admin" in Member Groups → 'admin'
           * 3. Primary Contact → 'institution_admin'
           * 4. All others (Board Members, Affiliates, etc.) → 'member'
           */
          let userType = 'member' // Default

          // Parse Member Groups
          const memberGroups = record.memberGroups ? record.memberGroups.split(',').map(g => g.trim().toLowerCase()) : []

          // Check hierarchy from highest to lowest
          if (memberGroups.includes('super_admin') || memberGroups.includes('super admin')) {
            userType = 'super_admin'
            console.log(`✅ Super Admin detected: ${record.memberEmail}`)
          } else if (memberGroups.includes('admin')) {
            userType = 'admin'
            console.log(`✅ System Admin detected: ${record.memberEmail}`)
          } else if (record.primaryContactUserId && parseInt(record.userId) === parseInt(record.primaryContactUserId)) {
            userType = 'institution_admin'
            console.log(`✅ Institution Admin detected: ${record.memberEmail}`)
          } else {
            // All other types (Board Members, Affiliates, etc.) are regular members
            userType = 'member'
            if (memberGroups.length > 0) {
              console.log(`ℹ️ Member with groups [${record.memberGroups}]: ${record.memberEmail} → user_type: member`)
            }
          }

          // Create member
          const memberData = {
            legacy_user_id: parseInt(record.userId),
            membership_id: membershipUuid,
            company_id: companyUuid,
            title: record.memberTitle,
            first_name: record.memberFirstName?.trim() || '',
            last_name: record.memberLastName?.trim() || '',
            email: record.memberEmail?.toLowerCase() || '',
            position: record.memberPosition,
            street_address: record.memberStreetAddress,
            street_address_line_2: record.memberStreetAddressLine2,
            suburb: record.memberSuburb,
            postcode: record.memberPostcode,
            state: record.memberState,
            country: record.memberCountry || 'Australia',
            mobile: record.memberMobile,
            bio: record.memberBio,
            board_member_role: record.memberBoardRole,
            area_of_expertise: record.memberAreaExpertise,
            teacher_since: formatDate(record.memberTeacherSince),
            courses_taught: record.memberCoursesTaught,
            interest_tags: record.memberInterestTags,
            subscriptions: record.memberSubscriptions,
            email_subscriptions: record.memberEmailSubscriptions,
            unsubscribe_notes: record.memberUnsubscribeNotes,
            username: record.memberUsername || record.memberEmail,
            groups: record.memberGroups,
            is_test_member: record.memberTest === '1',
            is_editable_address: record.memberEditableAddress === '1',
            member_created_date: formatDate(record.memberCreated),
            member_last_edited: formatDate(record.memberLastEdited),
            company_name: record.memberCompanyName,
            company_name_actual: record.memberCompanyNameActual,
            display_name: `${record.memberFirstName} ${record.memberLastName}`.trim(),
            membership_status: (record.status || 'active').toLowerCase(),
            user_type: userType  // ✅ CORREÇÃO: Atribuir user_type correto baseado em Primary Contact
          }

          const { data: newMember, error } = await supabaseAdmin
            .from('members')
            .insert(memberData)
            .select('id, user_type, email')
            .single()

          if (error) {
            stats.members.failed++
            setErrors(prev => [...prev, `Member ${record.memberEmail}: ${error.message}`])
          } else {
            stats.members.created++
            // Logs de verificação já foram feitos acima durante a detecção do role
          }
        } catch (error) {
          stats.members.failed++
          setErrors(prev => [...prev, `Member ${record.memberEmail}: ${error}`])
        }
        
        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      
      setImportStats(stats)
      
      // Run duplicate detection after import
      if (stats.members.created > 0) {
        setProgress({ phase: 'complete', message: 'Scanning for duplicates...', current: 95, total: 100 })
        try {
          const foundDuplicates = await memberDuplicateService.scanForDuplicates()
          setDuplicatesFound(foundDuplicates)
          if (foundDuplicates > 0) {
            showNotification('info', `Found ${foundDuplicates} potential duplicate members`, 
              'Review them in the Duplicates Management page')
          }
        } catch (error) {
          console.warn('Duplicate scan failed:', error)
          // Don't fail the import if duplicate scan fails
        }
      }
      
      setProgress({ phase: 'complete', message: 'Import completed!', current: 100, total: 100 })
      
      // Clear saved state on completion
      localStorage.removeItem('importSessionState')
      setSavedFileContent(null)
      setCanResume(false)
      
      // Show notifications
      if (stats.companies.created > 0) {
        showNotification('success', `Created ${stats.companies.created} companies`)
      }
      if (stats.memberships.created > 0) {
        showNotification('success', `Created ${stats.memberships.created} memberships`)
      }
      if (stats.members.created > 0) {
        showNotification('success', `Created ${stats.members.created} members`)
      }
      
    } catch (error) {
      console.error('Import error:', error)
      showNotification('error', 'Import failed', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Import System</h1>
        <p className="mt-2 text-gray-600">
          Import members, companies, and memberships from the complete CSV export
        </p>
      </div>

      <div className="space-y-6">
        {/* File Upload */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Complete CSV</h2>
          
          <div className="space-y-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
              disabled={isProcessing}
            />
            
            {(file || canResume) && (
              <div className="bg-gray-50 p-4 rounded-lg">
                {file && (
                  <p className="text-sm text-gray-700">
                    <strong>Selected File:</strong> {file.name}
                  </p>
                )}
                {canResume && !file && (
                  <div className="text-sm">
                    <p className="text-blue-700 font-semibold mb-1">
                      Previous import session found!
                    </p>
                    <p className="text-gray-600">
                      Progress: {progress.current} of {progress.total} records processed
                    </p>
                    <p className="text-gray-600">
                      Click "Resume Previous Import" to continue or "Reset" to start fresh.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Control Buttons */}
            <div className="flex gap-2">
              {!isProcessing && !isPaused && (
                <Button
                  onClick={handleImport}
                  disabled={!file && !canResume}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {canResume ? 'Resume Previous Import' : 'Start Import'}
                </Button>
              )}
              
              {isProcessing && !isPaused && (
                <>
                  <Button
                    onClick={handlePause}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              )}
              
              {isPaused && (
                <>
                  <Button
                    onClick={handleResume}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Resume
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="border-gray-600 text-gray-600 hover:bg-gray-50"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Progress */}
        {progress.phase && (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Import Progress</h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">{progress.message}</p>
              {progress.total > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Import Stats */}
        {importStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Building2 className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Companies</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p>Total: {importStats.companies.total}</p>
                <p className="text-green-600">Created: {importStats.companies.created}</p>
                <p className="text-yellow-600">Existing: {importStats.companies.existing}</p>
                <p className="text-red-600">Failed: {importStats.companies.failed}</p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CreditCard className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-medium text-gray-900">Memberships</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p>Total: {importStats.memberships.total}</p>
                <p className="text-green-600">Created: {importStats.memberships.created}</p>
                <p className="text-yellow-600">Existing: {importStats.memberships.existing}</p>
                <p className="text-red-600">Failed: {importStats.memberships.failed}</p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-medium text-gray-900">Members</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p>Total: {importStats.members.total}</p>
                <p className="text-green-600">Created: {importStats.members.created}</p>
                <p className="text-yellow-600">Existing: {importStats.members.existing}</p>
                <p className="text-red-600">Failed: {importStats.members.failed}</p>
              </div>
            </Card>
          </div>
        )}

        {/* Duplicates Found */}
        {duplicatesFound > 0 && (
          <Card className="p-6 border-2 border-yellow-400 bg-yellow-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <Search className="h-6 w-6 text-yellow-600" />
                  <h3 className="text-lg font-medium text-gray-900">Duplicates Detected</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Found {duplicatesFound} potential duplicate members that need review
                </p>
              </div>
              <Button
                onClick={() => navigate('/admin/duplicates')}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Review Duplicates
              </Button>
            </div>
          </Card>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900">Import Errors</h3>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {errors.map((error, index) => (
                <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}