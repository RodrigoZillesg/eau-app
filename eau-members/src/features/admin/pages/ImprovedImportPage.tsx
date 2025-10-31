import React, { useState, useRef } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Building2, Users, CreditCard, Upload, Pause, Play, RotateCcw, AlertTriangle } from 'lucide-react'
import { showNotification } from '../../../lib/notifications'
import { supabase } from '../../../lib/supabase/client'
import Papa from 'papaparse'

interface ImportProgress {
  id: string
  import_type: string
  file_hash: string
  total_records: number
  processed_records: number
  successful_records: number
  failed_records: number
  status: 'pending' | 'processing' | 'paused' | 'completed' | 'failed'
  last_processed_id: string | null
  error_log: any[]
  started_at: string
  updated_at: string
  completed_at: string | null
}

export const ImprovedImportPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)

  // Generate file hash for tracking
  const generateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Check for existing import progress
  const checkExistingProgress = async (fileHash: string): Promise<ImportProgress | null> => {
    const { data, error } = await supabase
      .from('import_progress')
      .select('*')
      .eq('file_hash', fileHash)
      .single()
    
    if (error || !data) return null
    return data
  }

  // Update progress in database
  const updateProgress = async (progress: Partial<ImportProgress>) => {
    if (!progress.id) return
    
    const { error } = await supabase
      .from('import_progress')
      .update({
        ...progress,
        updated_at: new Date().toISOString()
      })
      .eq('id', progress.id)
    
    if (error) {
      console.error('Error updating progress:', error)
    }
  }

  // Process companies/institutions
  const processCompanies = async (records: any[], startFrom: string | null = null) => {
    let processed = 0
    let successful = 0
    let failed = 0
    let shouldStart = !startFrom
    
    for (const record of records) {
      // Check if should start processing
      if (!shouldStart && record.companyId === startFrom) {
        shouldStart = true
        continue // Skip this one as it was already processed
      }
      if (!shouldStart) continue
      
      // Check if paused
      if (abortControllerRef.current?.signal.aborted) {
        await updateProgress({
          id: progress?.id,
          status: 'paused',
          last_processed_id: record.companyId,
          processed_records: processed,
          successful_records: successful,
          failed_records: failed
        })
        break
      }
      
      try {
        // Check if company already exists
        const { data: existing } = await supabase
          .from('institutions')
          .select('id')
          .or(`company_email.eq.${record.companyEmail},abn.eq.${record.companyABN}`)
          .single()
        
        if (!existing) {
          // Create institution from company data
          const { error } = await supabase
            .from('institutions')
            .insert({
              name: record.companyCompanyName || record.companyName,
              parent_company: record.companyParentCompany,
              abn: record.companyABN,
              company_email: record.companyCompanyEmail || record.companyEmail,
              company_type: record.companyCompanyType,
              cricos_code: record.companyCRICOSCode,
              address_line1: record.companyAddressLine1,
              address_line2: record.companyAddressLine2,
              address_line3: record.companyAddressLine3,
              suburb: record.companySuburb,
              postcode: record.companyPostcode,
              state: record.companyState,
              country: record.companyCountry || 'Australia',
              phone: record.companyPhone,
              website: record.companyWebsite,
              courses_offered: record.companyCoursesOffered,
              member_since: record.companyMemberSince,
              cancellation_details: record.companyCancellationDetails,
              status: 'active'
            })
          
          if (error) {
            failed++
            errors.push(`Company ${record.companyId}: ${error.message}`)
          } else {
            successful++
          }
        } else {
          successful++ // Already exists, count as success
        }
      } catch (error) {
        failed++
        errors.push(`Company ${record.companyId}: ${error}`)
      }
      
      processed++
      
      // Update progress every 10 records
      if (processed % 10 === 0) {
        await updateProgress({
          id: progress?.id,
          processed_records: processed,
          successful_records: successful,
          failed_records: failed,
          last_processed_id: record.companyId
        })
        
        setProgress(prev => prev ? {
          ...prev,
          processed_records: processed,
          successful_records: successful,
          failed_records: failed
        } : null)
      }
    }
    
    return { processed, successful, failed }
  }

  // Process members and link to institutions
  const processMembers = async (records: any[], startFrom: string | null = null) => {
    let processed = 0
    let successful = 0
    let failed = 0
    let shouldStart = !startFrom
    
    for (const record of records) {
      if (!shouldStart && record.userId === startFrom) {
        shouldStart = true
        continue
      }
      if (!shouldStart) continue
      
      if (abortControllerRef.current?.signal.aborted) {
        await updateProgress({
          id: progress?.id,
          status: 'paused',
          last_processed_id: record.userId,
          processed_records: processed,
          successful_records: successful,
          failed_records: failed
        })
        break
      }
      
      try {
        // Find institution
        let institutionId = null
        if (record.companyEmail) {
          const { data } = await supabase
            .from('institutions')
            .select('id')
            .eq('company_email', record.companyEmail)
            .single()
          institutionId = data?.id
        }
        
        // Create/update member
        const { data: member, error: memberError } = await supabase
          .from('members')
          .upsert({
            legacy_user_id: parseInt(record.userId),
            email: record.memberEmail,
            first_name: record.memberFirstName,
            last_name: record.memberLastName,
            title: record.memberTitle,
            position: record.memberPosition,
            company_name: record.memberCompanyName,
            phone: record.memberMobile,
            institution_id: institutionId,
            user_type: record.primaryContactUserId === record.userId ? 'institution_admin' : 'staff'
          }, {
            onConflict: 'email'
          })
          .select()
          .single()
        
        if (memberError) throw memberError
        
        // Create member_institution relationship
        if (member && institutionId) {
          await supabase
            .from('member_institutions')
            .upsert({
              member_id: member.id,
              institution_id: institutionId,
              role: record.primaryContactUserId === record.userId ? 'admin' : 'member',
              position: record.memberPosition,
              is_primary: true
            }, {
              onConflict: 'member_id,institution_id'
            })
        }
        
        successful++
      } catch (error) {
        failed++
        errors.push(`Member ${record.userId}: ${error}`)
      }
      
      processed++
      
      if (processed % 10 === 0) {
        await updateProgress({
          id: progress?.id,
          processed_records: processed,
          successful_records: successful,
          failed_records: failed,
          last_processed_id: record.userId
        })
        
        setProgress(prev => prev ? ({
          ...prev!,
          processed_records: processed,
          successful_records: successful,
          failed_records: failed
        }) : null)
      }
    }
    
    return { processed, successful, failed }
  }

  // Main import handler
  const handleImport = async () => {
    if (!file) return
    
    try {
      setIsProcessing(true)
      setErrors([])
      
      // Generate file hash
      const fileHash = await generateFileHash(file)
      
      // Check for existing progress
      let currentProgress = await checkExistingProgress(fileHash)
      
      if (!currentProgress) {
        // Create new progress record
        const { data, error } = await supabase
          .from('import_progress')
          .insert({
            import_type: 'complete',
            file_hash: fileHash,
            status: 'processing'
          })
          .select()
          .single()
        
        if (error) throw error
        currentProgress = data
      } else if (currentProgress.status === 'completed') {
        showNotification('info', 'This file has already been imported completely')
        return
      } else if (currentProgress.status === 'paused') {
        showNotification('info', 'Resuming previous import...')
      }
      
      setProgress(currentProgress)
      
      // Parse CSV
      const records = await new Promise<any[]>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          complete: (results) => resolve(results.data),
          error: (error) => reject(error)
        })
      })
      
      // Set total records if not set
      if (!currentProgress.total_records) {
        await updateProgress({
          id: currentProgress.id,
          total_records: records.length
        })
      }
      
      // Create abort controller for pause functionality
      abortControllerRef.current = new AbortController()
      
      // Process companies first
      showNotification('info', 'Processing companies/institutions...')
      const companiesResult = await processCompanies(
        records,
        currentProgress.last_processed_id
      )
      
      // Process members
      if (!abortControllerRef.current.signal.aborted) {
        showNotification('info', 'Processing members and relationships...')
        const membersResult = await processMembers(
          records,
          currentProgress.status === 'paused' ? currentProgress.last_processed_id : null
        )
      }
      
      // Mark as completed if not paused
      if (!abortControllerRef.current.signal.aborted) {
        await updateProgress({
          id: currentProgress.id,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        showNotification('success', 'Import completed successfully!')
      }
      
    } catch (error: any) {
      console.error('Import error:', error)
      showNotification('error', error.message || 'Import failed')
      
      if (progress) {
        await updateProgress({
          id: progress.id,
          status: 'failed',
          error_log: [...(progress.error_log || []), error.message]
        })
      }
    } finally {
      setIsProcessing(false)
      setIsPaused(false)
    }
  }

  // Pause handler
  const handlePause = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsPaused(true)
      showNotification('info', 'Import paused. You can resume later.')
    }
  }

  // Resume handler
  const handleResume = () => {
    setIsPaused(false)
    handleImport()
  }

  // Reset handler
  const handleReset = async () => {
    if (progress && confirm('Are you sure you want to reset this import?')) {
      await supabase
        .from('import_progress')
        .delete()
        .eq('id', progress.id)
      
      setProgress(null)
      setErrors([])
      showNotification('info', 'Import progress reset')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Improved Import System</h1>
        <p className="text-gray-600">
          Import with pause/resume capability and full integration
        </p>
      </div>

      {/* File Upload */}
      <Card className="p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={isProcessing}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {file && (
            <div className="flex gap-2">
              {!isProcessing && (
                <Button onClick={handleImport} className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Start Import
                </Button>
              )}
              
              {isProcessing && !isPaused && (
                <Button onClick={handlePause} variant="outline" className="flex items-center gap-2">
                  <Pause className="w-4 h-4" />
                  Pause
                </Button>
              )}
              
              {isProcessing && isPaused && (
                <Button onClick={handleResume} className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Resume
                </Button>
              )}
              
              {progress && (
                <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Progress Display */}
      {progress && (
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Import Progress</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span>Overall Progress</span>
                <span>{progress.processed_records} / {progress.total_records}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${(progress.processed_records / progress.total_records) * 100}%` 
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {progress.successful_records}
                </p>
                <p className="text-sm text-gray-600">Successful</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {progress.processed_records}
                </p>
                <p className="text-sm text-gray-600">Processed</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {progress.failed_records}
                </p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
            </div>

            <div className="text-sm">
              <p><strong>Status:</strong> {progress.status}</p>
              <p><strong>Started:</strong> {new Date(progress.started_at).toLocaleString()}</p>
              {progress.completed_at && (
                <p><strong>Completed:</strong> {new Date(progress.completed_at).toLocaleString()}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Errors Display */}
      {errors.length > 0 && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 mb-2">Import Errors</h3>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.slice(0, 10).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {errors.length > 10 && (
                  <li>... and {errors.length - 10} more errors</li>
                )}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}