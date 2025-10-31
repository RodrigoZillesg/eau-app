import React, { useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { FileText, Upload, AlertTriangle, CheckCircle, X } from 'lucide-react'
import { showNotification } from '../../../lib/notifications'
import { supabase } from '../../../lib/supabase/client'
import { useSessionRefresh } from '../../../hooks/useSessionRefresh'
import Papa from 'papaparse'

interface ActivityImportData {
  activitySerial: string
  userId: string
  user: string
  firstName: string
  lastName: string
  email: string
  categorySerial: string
  category: string
  activityName: string
  developmentAreas: string
  completedDate: string
  eventWebsite: string
  hours: string
  supplyEvidence: string
  verified: string
  personalGoal: string
  keyTakeaways: string
  howToUse: string
  actionIntended: string
}

interface ValidationError {
  row: number
  field: string
  message: string
  data: Partial<ActivityImportData>
}

interface ImportStats {
  total: number
  successful: number
  failed: number
  skipped: number
}

interface ImportProgress {
  phase: 'parsing' | 'validating' | 'importing' | 'complete'
  current: number
  total: number
  message: string
}

export const ActivityImportPageFixed: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [importStats, setImportStats] = useState<ImportStats | null>(null)
  const [previewData, setPreviewData] = useState<ActivityImportData[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  // Session refresh hook - activates during import processing to prevent timeouts
  const { refreshSession } = useSessionRefresh(isProcessing, 30) // Refresh every 30 minutes during imports

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        showNotification('error', 'Please select a valid CSV file.')
        return
      }
      setFile(selectedFile)
      setValidationErrors([])
      setImportStats(null)
      setPreviewData([])
      setShowPreview(false)
      setImportProgress(null)
    }
  }

  const validateActivityData = (activity: ActivityImportData, rowIndex: number): ValidationError[] => {
    const errors: ValidationError[] = []

    // Required fields validation
    if (!activity.email || activity.email.trim() === '') {
      errors.push({
        row: rowIndex,
        field: 'Email',
        message: 'Email is required',
        data: activity
      })
    }

    if (!activity.activityName || activity.activityName.trim() === '') {
      errors.push({
        row: rowIndex,
        field: 'PD activity name',
        message: 'Activity name is required',
        data: activity
      })
    }

    if (!activity.completedDate || activity.completedDate.trim() === '') {
      errors.push({
        row: rowIndex,
        field: 'Completed Date',
        message: 'Completed date is required',
        data: activity
      })
    }

    if (!activity.hours || activity.hours.trim() === '') {
      errors.push({
        row: rowIndex,
        field: 'Hours',
        message: 'Hours is required',
        data: activity
      })
    }

    // Format validation
    if (activity.email && activity.email.trim()) {
      const emailTrimmed = activity.email.trim()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
        errors.push({
          row: rowIndex,
          field: 'Email',
          message: 'Invalid email format',
          data: activity
        })
      }
    }

    if (activity.completedDate && activity.completedDate.trim()) {
      const dateTrimmed = activity.completedDate.trim()
      if (isNaN(Date.parse(dateTrimmed))) {
        errors.push({
          row: rowIndex,
          field: 'Completed Date',
          message: 'Invalid date format (expected YYYY-MM-DD)',
          data: activity
        })
      }
    }

    if (activity.hours && activity.hours.trim()) {
      const hoursTrimmed = activity.hours.trim()
      const hoursNum = parseFloat(hoursTrimmed)
      if (isNaN(hoursNum) || hoursNum < 0) {
        errors.push({
          row: rowIndex,
          field: 'Hours',
          message: 'Hours must be a valid positive number',
          data: activity
        })
      }
    }

    return errors
  }

  const parseCSVFile = (file: File): Promise<ActivityImportData[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          try {
            const activities = results.data
              .filter((row: any) => row && Object.keys(row).length > 1)
              .map((row: any) => ({
                activitySerial: row['Activity Serial']?.toString() || '',
                userId: row['User Id']?.toString() || '',
                user: row['User']?.toString() || '',
                firstName: row['First Name']?.toString() || '',
                lastName: row['Last Name']?.toString() || '',
                email: (row['Email']?.toString() || '').toLowerCase(),
                categorySerial: row['Category Serial']?.toString() || '',
                category: row['Category']?.toString() || '',
                activityName: row['PD activity name']?.toString() || '',
                developmentAreas: row['Development areas']?.toString() || '',
                completedDate: row['Completed Date']?.toString() || '',
                eventWebsite: row['Event website (where possible)']?.toString() || '',
                hours: row['Hours of PD (anything below 60 minutes can be entered as a decimal, e.g. 30 mins = 0.5)']?.toString() || '',
                supplyEvidence: row['Supply Evidence (e.g. attendance statement)']?.toString() || '',
                verified: row['Verified']?.toString() || '',
                personalGoal: row['Personal development goal this activity addresses']?.toString() || '',
                keyTakeaways: row['Key take-aways/reflections']?.toString() || '',
                howToUse: row['How can I use this in my own teaching?']?.toString() || '',
                actionIntended: row['Action I intend to take to experiment with this idea']?.toString() || ''
              }))
            resolve(activities)
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

  const handlePreviewFile = async () => {
    if (!file) return

    try {
      setIsProcessing(true)
      const activities = await parseCSVFile(file)

      // Validate first 10 rows for preview
      const errors: ValidationError[] = []
      activities.slice(0, 10).forEach((activity, index) => {
        const activityErrors = validateActivityData(activity, index + 1)
        errors.push(...activityErrors)
      })

      setValidationErrors(errors)
      setPreviewData(activities.slice(0, 10))
      setShowPreview(true)
    } catch (error) {
      console.error('Preview error:', error)
      showNotification('error', 'Preview failed', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImportActivities = async () => {
    if (!file) return

    try {
      setIsProcessing(true)
      const controller = new AbortController()
      setAbortController(controller)

      // Refresh session before starting import to ensure we have a fresh token
      console.log('🔄 Refreshing session before starting import...')
      await refreshSession()

      setImportProgress({
        phase: 'parsing',
        current: 0,
        total: 100,
        message: 'Reading CSV file...'
      })

      const activities = await parseCSVFile(file)

      setImportProgress({
        phase: 'validating',
        current: 0,
        total: activities.length,
        message: 'Validating data...'
      })

      const stats: ImportStats = {
        total: activities.length,
        successful: 0,
        failed: 0,
        skipped: 0
      }

      const errors: ValidationError[] = []
      const BATCH_SIZE = 50 // Process in batches for better performance

      // First: Collect all unique emails
      const uniqueEmails = [...new Set(activities.map(a => a.email.toLowerCase().trim()))]

      console.log('🔍 Searching for', uniqueEmails.length, 'unique emails')
      console.log('📧 Sample emails:', uniqueEmails.slice(0, 5))

      // IMPROVED: Fetch members in smaller batches to avoid timeouts with large databases
      const members: any[] = []
      const FETCH_BATCH_SIZE = 500 // Fetch 500 members at a time

      try {
        // First, get total count
        const { count } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })

        console.log(`📊 Total members in database: ${count}`)

        // Fetch in batches
        for (let offset = 0; offset < (count || 0); offset += FETCH_BATCH_SIZE) {
          console.log(`📥 Fetching members ${offset} to ${offset + FETCH_BATCH_SIZE}...`)

          const { data: batch, error: batchError } = await supabase
            .from('members')
            .select('id, email, user_id, first_name, last_name')
            .range(offset, offset + FETCH_BATCH_SIZE - 1)

          if (batchError) {
            console.error(`Error fetching batch at offset ${offset}:`, batchError)
            throw new Error(`Failed to fetch members batch: ${batchError.message}`)
          }

          if (batch) {
            members.push(...batch)
          }

          // Small delay to prevent overwhelming the database
          if (offset + FETCH_BATCH_SIZE < (count || 0)) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
      } catch (error: any) {
        console.error('Error fetching members:', error)
        throw new Error(`Failed to fetch members: ${error.message}`)
      }

      console.log('👥 Successfully fetched', members.length, 'total members')

      // DEBUG: Check user_id distribution
      const membersWithUserId = members.filter(m => m.user_id)
      const membersWithoutUserId = members.filter(m => !m.user_id)
      const membersWithEmail = members.filter(m => m.email)
      const membersWithoutEmail = members.filter(m => !m.email)

      console.log('🔍 DEBUG: Member analysis:')
      console.log('  - Total members:', members.length)
      console.log('  - With user_id:', membersWithUserId.length)
      console.log('  - Without user_id:', membersWithoutUserId.length)
      console.log('  - With email:', membersWithEmail.length)
      console.log('  - Without email:', membersWithoutEmail.length)

      // Sample members without user_id
      if (membersWithoutUserId.length > 0) {
        console.log('🧪 Sample members without user_id:')
        membersWithoutUserId.slice(0, 3).forEach(m => {
          console.log(`  - ${m.email} | ${m.first_name} ${m.last_name} | user_id: ${m.user_id}`)
        })
      }

      // Create email to user mapping with normalization
      const emailToUser = new Map()

      if (members) {
        members.forEach(member => {
          if (member.email && member.user_id) {
            const normalizedEmail = member.email.toLowerCase().trim()
            emailToUser.set(normalizedEmail, {
              id: member.id,
              user_id: member.user_id,
              email: member.email, // Keep original email for debugging
              name: `${member.first_name} ${member.last_name}`
            })
          }
        })
      }

      console.log('🗺️ Created email mapping for', emailToUser.size, 'members with user_id')

      // Debug: Check if some sample emails exist in mapping
      const sampleChecks = uniqueEmails.slice(0, 5).map(email => ({
        email,
        found: emailToUser.has(email)
      }))
      console.log('🧪 Sample email checks:', sampleChecks)

      // Process activities in batches
      let lastSessionRefresh = Date.now()
      const SESSION_REFRESH_INTERVAL = 30000 // Refresh session every 30 seconds

      for (let i = 0; i < activities.length; i += BATCH_SIZE) {
        // Check if import was cancelled
        if (controller.signal.aborted) {
          showNotification('info', 'Import cancelled by user')
          break
        }

        // Keep session alive during long imports
        if (Date.now() - lastSessionRefresh > SESSION_REFRESH_INTERVAL) {
          console.log('🔄 Refreshing session to prevent timeout...')
          try {
            await refreshSession()
            lastSessionRefresh = Date.now()
          } catch (error) {
            console.error('Failed to refresh session:', error)
          }
        }

        const batch = activities.slice(i, Math.min(i + BATCH_SIZE, activities.length))
        const batchInserts: any[] = []

        setImportProgress({
          phase: 'importing',
          current: i,
          total: activities.length,
          message: `Importing activities ${i + 1} to ${Math.min(i + BATCH_SIZE, activities.length)} of ${activities.length}...`
        })

        for (const activity of batch) {
          const rowNumber = activities.indexOf(activity) + 1

          // Validate
          const activityErrors = validateActivityData(activity, rowNumber)
          if (activityErrors.length > 0) {
            errors.push(...activityErrors)
            stats.failed++
            continue
          }

          // Find user
          const normalizedActivityEmail = activity.email.toLowerCase().trim()
          const userInfo = emailToUser.get(normalizedActivityEmail)

          if (!userInfo || !userInfo.user_id) {
            // Additional debugging info
            const debugInfo = {
              searchEmail: normalizedActivityEmail,
              emailLength: normalizedActivityEmail.length,
              hasSpaces: normalizedActivityEmail.includes(' '),
              foundInMap: emailToUser.has(normalizedActivityEmail)
            }

            errors.push({
              row: rowNumber,
              field: 'Email',
              message: `User not found or no auth account for email: ${activity.email} (normalized: ${normalizedActivityEmail})`,
              data: { ...activity, debug: debugInfo }
            })
            stats.failed++
            continue
          }

          // Parse date and hours
          const completedDate = new Date(activity.completedDate)
          const hours = parseFloat(activity.hours)

          if (isNaN(completedDate.getTime()) || isNaN(hours)) {
            stats.failed++
            continue
          }

          // Prepare insert data based on actual database structure
          const descriptionParts = [
            activity.developmentAreas && `Development Areas: ${activity.developmentAreas}`,
            activity.personalGoal && `Personal Goal: ${activity.personalGoal}`,
            activity.keyTakeaways && `Key Takeaways: ${activity.keyTakeaways}`,
            activity.howToUse && `How to Use: ${activity.howToUse}`,
            activity.actionIntended && `Action Intended: ${activity.actionIntended}`
          ].filter(Boolean).join('\n\n')

          // Use the ACTUAL database structure based on the indexes
          const insertData: any = {
            user_id: userInfo.user_id,
            activity_type: 'professional_development', // Required field
            activity_title: activity.activityName,
            description: descriptionParts || null,
            activity_date: completedDate.toISOString().split('T')[0], // CORRECT field name
            cpd_points: Math.ceil(hours), // CORRECT field name for points (calculated from hours)
            status: 'approved' // SEMPRE aprovado na importação
          }

          // Add category using the CORRECT field name
          if (activity.category) {
            insertData.cpd_category = activity.category // CORRECT field name
          }

          // Add evidence and provider
          if (activity.eventWebsite) {
            insertData.evidence_url = activity.eventWebsite
            insertData.provider = 'External'
          } else {
            insertData.provider = 'Self-directed'
          }

          batchInserts.push(insertData)
        }

        // Batch insert
        if (batchInserts.length > 0) {
          console.log(`📦 Attempting to insert batch of ${batchInserts.length} activities`)

          const { error: insertError } = await supabase
            .from('cpd_activities')
            .insert(batchInserts)

          if (insertError) {
            console.error('❌ Batch insert error:', insertError)
            console.log('Failed batch data sample:', batchInserts[0])
            stats.failed += batchInserts.length

            // Add detailed error for each item in the batch
            const batchStartIndex = i
            batchInserts.forEach((item, idx) => {
              const rowNumber = batchStartIndex + idx + 1
              errors.push({
                row: rowNumber,
                field: 'Database',
                message: `Database error: ${insertError.message}`,
                data: activities[batchStartIndex + idx]
              })
            })
          } else {
            console.log(`✅ Successfully inserted batch of ${batchInserts.length} activities`)
            stats.successful += batchInserts.length
          }
        } else {
          console.log('⚠️ No valid activities in this batch - all had validation errors')
        }

        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Set completion status
      setImportProgress({
        phase: 'complete',
        current: activities.length,
        total: activities.length,
        message: 'Import completed!'
      })

      // Final logging
      console.log('📊 FINAL IMPORT STATS:')
      console.log(`✅ Successful: ${stats.successful}`)
      console.log(`❌ Failed: ${stats.failed}`)
      console.log(`📋 Total: ${stats.total}`)
      console.log(`🔍 Errors logged: ${errors.length}`)

      setValidationErrors(errors)
      setImportStats(stats)

      if (stats.successful > 0) {
        showNotification('success', `Successfully imported ${stats.successful} of ${stats.total} activities!`)
      }

      if (stats.failed > 0) {
        const realErrors = errors.filter(e => e.field !== 'Email' || !e.message.includes('User not found'))
        if (realErrors.length > 0) {
          showNotification('error', `${stats.failed} activities failed to import. Check the errors below.`)
        } else {
          showNotification('info', `${stats.failed} activities skipped (users not found in current system). ${stats.successful} imported successfully.`)
        }
      }

      if (stats.successful === 0 && stats.failed === 0) {
        showNotification('warning', 'No activities were processed. Check the console for details.')
      }

    } catch (error) {
      console.error('Import error:', error)
      showNotification('error', 'Import failed', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsProcessing(false)
      setAbortController(null)
      // Keep progress visible for a moment
      setTimeout(() => {
        setImportProgress(null)
      }, 3000)
    }
  }

  const handleCancelImport = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      showNotification('info', 'Cancelling import...')
    }
  }

  const resetImport = () => {
    setFile(null)
    setValidationErrors([])
    setImportStats(null)
    setPreviewData([])
    setShowPreview(false)
    setImportProgress(null)
    setAbortController(null)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Import Activities (Fixed Version)</h1>
        <p className="mt-2 text-gray-600">
          Optimized import for CPD activities from CSV files
        </p>
        <div className="mt-4 space-y-2">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Improvements:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-blue-700 mt-2">
              <li>Batch processing for faster imports (50 activities at a time)</li>
              <li>Cancel button to stop long-running imports</li>
              <li>Fixed database structure issues (uses user_id correctly)</li>
              <li>Pre-loads all member data for better performance</li>
              <li>Hours converted to CPD points (1 hour = 1 point, rounded up)</li>
              <li><strong>All imported activities are automatically approved</strong></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* File Upload Section */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Upload CSV File</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Activities CSV File
              </label>
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
            </div>

            {file && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Selected File:</strong> {file.name}
                </p>
                <p className="text-sm text-gray-600">
                  Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            <div className="flex space-x-4">
              <Button
                onClick={handlePreviewFile}
                disabled={!file || isProcessing}
                variant="outline"
              >
                {isProcessing && !importProgress ? 'Processing...' : 'Preview Data'}
              </Button>

              <Button
                onClick={handleImportActivities}
                disabled={!file || isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isProcessing && importProgress ? 'Importing...' : 'Import Activities'}
              </Button>

              {isProcessing && abortController && (
                <Button
                  onClick={handleCancelImport}
                  variant="outline"
                  className="bg-red-50 hover:bg-red-100 text-red-700"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel Import
                </Button>
              )}

              {(validationErrors.length > 0 || importStats) && (
                <Button
                  onClick={resetImport}
                  variant="outline"
                  disabled={isProcessing}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Preview Data */}
        {showPreview && previewData.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Data Preview (First 10 rows)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border px-4 py-2 text-left">Email</th>
                    <th className="border px-4 py-2 text-left">Category</th>
                    <th className="border px-4 py-2 text-left">Activity Name</th>
                    <th className="border px-4 py-2 text-left">Date</th>
                    <th className="border px-4 py-2 text-left">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((activity, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border px-4 py-2 text-sm">{activity.email}</td>
                      <td className="border px-4 py-2 text-sm">{activity.category}</td>
                      <td className="border px-4 py-2 text-sm">{activity.activityName}</td>
                      <td className="border px-4 py-2 text-sm">{activity.completedDate}</td>
                      <td className="border px-4 py-2 text-sm">{activity.hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Progress Bar */}
        {importProgress && (
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Upload className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">Import Progress</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {importProgress.message}
                </span>
                <span className="text-sm text-gray-500">
                  {importProgress.current} / {importProgress.total}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    importProgress.phase === 'complete'
                      ? 'bg-green-600'
                      : importProgress.phase === 'importing'
                        ? 'bg-blue-600'
                        : 'bg-yellow-600'
                  }`}
                  style={{
                    width: `${Math.min(100, (importProgress.current / importProgress.total) * 100)}%`
                  }}
                ></div>
              </div>

              {importProgress.phase === 'complete' && (
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">Import completed successfully!</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Import Statistics */}
        {importStats && (
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-medium text-gray-900">Import Results</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{importStats.total}</div>
                <div className="text-sm text-blue-700">Total Records</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importStats.successful}</div>
                <div className="text-sm text-green-700">Successful</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importStats.failed}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{importStats.skipped}</div>
                <div className="text-sm text-yellow-700">Skipped</div>
              </div>
            </div>
          </Card>
        )}

        {/* Validation Errors (Limited to first 100) */}
        {validationErrors.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Validation Errors {validationErrors.length > 100 && `(Showing first 100 of ${validationErrors.length})`}
              </h3>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {validationErrors.slice(0, 100).map((error, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="flex items-start space-x-2">
                    <X className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">
                        Row {error.row}: {error.field}
                      </p>
                      <p className="text-sm text-red-700">{error.message}</p>
                      {error.data.email && (
                        <p className="text-xs text-red-600 mt-1">
                          Email: {error.data.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}