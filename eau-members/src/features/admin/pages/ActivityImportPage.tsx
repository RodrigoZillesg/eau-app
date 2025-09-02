import React, { useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { FileText, Upload, AlertTriangle, CheckCircle, X } from 'lucide-react'
import { showNotification } from '../../../lib/notifications'
import { supabase } from '../../../lib/supabase/client'
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

export const ActivityImportPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [importStats, setImportStats] = useState<ImportStats | null>(null)
  const [previewData, setPreviewData] = useState<ActivityImportData[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)

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

    // Required fields validation - based on actual CSV data structure
    if (!activity.userId || activity.userId.trim() === '') {
      errors.push({
        row: rowIndex,
        field: 'User Id',
        message: 'User ID is required',
        data: activity
      })
    }

    if (!activity.email || activity.email.trim() === '') {
      errors.push({
        row: rowIndex,
        field: 'Email',
        message: 'Email is required',
        data: activity
      })
    }

    if (!activity.categorySerial || activity.categorySerial.trim() === '') {
      errors.push({
        row: rowIndex,
        field: 'Category Serial',
        message: 'Category Serial is required',
        data: activity
      })
    }

    if (!activity.category || activity.category.trim() === '') {
      errors.push({
        row: rowIndex,
        field: 'Category',
        message: 'Category is required',
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

    // Format validation - only if field has data
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

  const findUserByEmail = async (email: string) => {
    const { data: members, error } = await supabase
      .from('members')
      .select('id, user_id')
      .eq('email', email.toLowerCase())
      .single()
    
    if (error) return null
    return members
  }

  const handleImportActivities = async () => {
    if (!file) return

    try {
      setIsProcessing(true)
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

      // First pass: validation only
      for (let i = 0; i < activities.length; i++) {
        setImportProgress({
          phase: 'validating',
          current: i + 1,
          total: activities.length,
          message: `Validating row ${i + 1} of ${activities.length}...`
        })
        
        await new Promise(resolve => setTimeout(resolve, 1)) // Small delay for UI updates
        const activity = activities[i]
        const rowNumber = i + 1

        // Validate data
        const activityErrors = validateActivityData(activity, rowNumber)
        if (activityErrors.length > 0) {
          errors.push(...activityErrors)
          stats.failed++
        }
      }

      // Second pass: importing valid records
      setImportProgress({
        phase: 'importing',
        current: 0,
        total: activities.length - stats.failed,
        message: 'Importing activities...'
      })

      let importedCount = 0
      
      for (let i = 0; i < activities.length; i++) {
        const activity = activities[i]
        const rowNumber = i + 1

        // Skip if validation failed
        const hasErrors = errors.some(error => error.row === rowNumber)
        if (hasErrors) continue

        // Update progress
        setImportProgress({
          phase: 'importing',
          current: importedCount + 1,
          total: activities.length - stats.failed,
          message: `Importing activity ${importedCount + 1} of ${activities.length - stats.failed}...`
        })

        try {
          // Find user by email
          const member = await findUserByEmail(activity.email)
          if (!member) {
            errors.push({
              row: rowNumber,
              field: 'Email',
              message: `User not found with email: ${activity.email}`,
              data: activity
            })
            stats.failed++
            importedCount++
            continue
          }

          // Parse date
          const completedDate = new Date(activity.completedDate)
          if (isNaN(completedDate.getTime())) {
            errors.push({
              row: rowNumber,
              field: 'Completed Date',
              message: 'Invalid date format',
              data: activity
            })
            stats.failed++
            importedCount++
            continue
          }

          // Parse hours
          const hours = parseFloat(activity.hours)
          if (isNaN(hours) || hours < 0) {
            errors.push({
              row: rowNumber,
              field: 'Hours',
              message: 'Invalid hours value',
              data: activity
            })
            stats.failed++
            importedCount++
            continue
          }

          // Create description from available fields
          const descriptionParts = [
            activity.developmentAreas && `Development Areas: ${activity.developmentAreas}`,
            activity.personalGoal && `Personal Goal: ${activity.personalGoal}`,
            activity.keyTakeaways && `Key Takeaways: ${activity.keyTakeaways}`,
            activity.howToUse && `How to Use: ${activity.howToUse}`,
            activity.actionIntended && `Action Intended: ${activity.actionIntended}`
          ].filter(Boolean).join('\n\n')

          // Insert activity
          const { error: insertError } = await supabase
            .from('cpd_activities')
            .insert({
              member_id: member.id,
              user_id: member.user_id,
              category_id: parseInt(activity.categorySerial),
              category_name: activity.category,
              activity_title: activity.activityName,
              description: descriptionParts || null,
              date_completed: completedDate.toISOString().split('T')[0],
              hours: hours,
              evidence_url: activity.eventWebsite || null,
              status: activity.verified === '1' ? 'approved' : 'pending'
            })

          if (insertError) {
            console.error('Insert error:', insertError)
            errors.push({
              row: rowNumber,
              field: 'Database',
              message: insertError.message,
              data: activity
            })
            stats.failed++
          } else {
            stats.successful++
          }
        } catch (error) {
          console.error(`Error processing row ${rowNumber}:`, error)
          errors.push({
            row: rowNumber,
            field: 'Processing',
            message: error instanceof Error ? error.message : 'Unknown error',
            data: activity
          })
          stats.failed++
        }

        importedCount++
      }

      // Set completion status
      setImportProgress({
        phase: 'complete',
        current: activities.length,
        total: activities.length,
        message: 'Import completed!'
      })

      setValidationErrors(errors)
      setImportStats(stats)

      if (stats.successful > 0) {
        showNotification('success', `Successfully imported ${stats.successful} activities!`)
      }
      
      if (stats.failed > 0) {
        showNotification('error', `${stats.failed} activities failed to import. Check the errors below.`)
      }

    } catch (error) {
      console.error('Import error:', error)
      showNotification('error', 'Import failed', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsProcessing(false)
      // Keep progress visible for a moment
      setTimeout(() => {
        setImportProgress(null)
      }, 3000)
    }
  }

  const resetImport = () => {
    setFile(null)
    setValidationErrors([])
    setImportStats(null)
    setPreviewData([])
    setShowPreview(false)
    setImportProgress(null)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Import Activities</h1>
        <p className="mt-2 text-gray-600">
          Import CPD activities from CSV files exported from the legacy system
        </p>
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
                {isProcessing ? 'Processing...' : 'Preview Data'}
              </Button>
              
              <Button
                onClick={handleImportActivities}
                disabled={!file || isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isProcessing ? 'Importing...' : 'Import Activities'}
              </Button>

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

        {/* CSV Format Information */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Expected CSV Format</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Required Columns:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Activity Serial</li>
              <li>User Id</li>
              <li>User, First Name, Last Name</li>
              <li>Email (used to match existing members)</li>
              <li>Category Serial, Category</li>
              <li>PD activity name</li>
              <li>Development areas</li>
              <li>Completed Date (YYYY-MM-DD format)</li>
              <li>Hours of PD (decimal number)</li>
              <li>Event website (optional)</li>
              <li>Supply Evidence, Verified</li>
              <li>Personal development goal, Key take-aways, How can I use this, Action I intend to take</li>
            </ul>
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
              
              <div className="flex justify-between text-xs text-gray-500">
                <span className={`font-medium ${importProgress.phase === 'parsing' ? 'text-blue-600' : importProgress.phase === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                  📄 Parsing
                </span>
                <span className={`font-medium ${importProgress.phase === 'validating' ? 'text-yellow-600' : importProgress.phase === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                  ✅ Validating
                </span>
                <span className={`font-medium ${importProgress.phase === 'importing' ? 'text-blue-600' : importProgress.phase === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                  💾 Importing
                </span>
                <span className={`font-medium ${importProgress.phase === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                  🎉 Complete
                </span>
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

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900">Validation Errors</h3>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {validationErrors.map((error, index) => (
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