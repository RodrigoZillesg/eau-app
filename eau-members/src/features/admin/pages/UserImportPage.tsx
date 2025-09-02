import React, { useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Users, Upload, AlertTriangle, CheckCircle, X, UserPlus } from 'lucide-react'
import { showNotification } from '../../../lib/notifications'
import { supabase } from '../../../lib/supabase/client'
import { supabaseAdmin, createUserWithAuth } from '../../../lib/supabase/adminClient'
import Papa from 'papaparse'

interface UserImportData {
  userId: string
  firstName: string
  lastName: string
  email: string
  activities: string
  points: string
  goalStatus: string
}

interface ValidationError {
  row: number
  field: string
  message: string
  data: Partial<UserImportData>
}

interface ImportStats {
  total: number
  successful: number
  failed: number
  skipped: number
  existing: number
}

interface ImportProgress {
  phase: 'parsing' | 'validating' | 'creating_auth' | 'creating_members' | 'complete'
  current: number
  total: number
  message: string
}

export const UserImportPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [importStats, setImportStats] = useState<ImportStats | null>(null)
  const [previewData, setPreviewData] = useState<UserImportData[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [createAuthAccounts, setCreateAuthAccounts] = useState(true)

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

  const validateUserData = (user: UserImportData, rowIndex: number): ValidationError[] => {
    const errors: ValidationError[] = []

    // Required fields validation
    if (!user.userId || user.userId.trim() === '') {
      errors.push({
        row: rowIndex,
        field: 'User Id',
        message: 'User ID is required',
        data: user
      })
    }

    if (!user.firstName || user.firstName.trim() === '') {
      errors.push({
        row: rowIndex,
        field: 'First Name',
        message: 'First Name is required',
        data: user
      })
    }

    if (!user.lastName || user.lastName.trim() === '') {
      errors.push({
        row: rowIndex,
        field: 'Last Name',
        message: 'Last Name is required',
        data: user
      })
    }

    if (!user.email || user.email.trim() === '') {
      errors.push({
        row: rowIndex,
        field: 'Email',
        message: 'Email is required',
        data: user
      })
    }

    // Email format validation
    if (user.email && user.email.trim()) {
      const emailTrimmed = user.email.trim()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
        errors.push({
          row: rowIndex,
          field: 'Email',
          message: 'Invalid email format',
          data: user
        })
      }
    }

    // Numeric validation for activities count
    if (user.activities && user.activities.trim()) {
      const activitiesNum = parseInt(user.activities.trim())
      if (isNaN(activitiesNum) || activitiesNum < 0) {
        errors.push({
          row: rowIndex,
          field: 'Activities',
          message: 'Activities must be a valid positive number',
          data: user
        })
      }
    }

    // Numeric validation for points
    if (user.points && user.points.trim()) {
      const pointsNum = parseFloat(user.points.trim())
      if (isNaN(pointsNum) || pointsNum < 0) {
        errors.push({
          row: rowIndex,
          field: 'Points',
          message: 'Points must be a valid positive number',
          data: user
        })
      }
    }

    return errors
  }

  const parseCSVFile = (file: File): Promise<UserImportData[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          try {
            const users = results.data
              .filter((row: any) => row && Object.keys(row).length > 1)
              .map((row: any) => ({
                userId: row['User Id']?.toString() || '',
                firstName: row['First Name']?.toString() || '',
                lastName: row['Last Name']?.toString() || '',
                email: (row['Email']?.toString() || '').toLowerCase(),
                activities: row['Activities']?.toString() || '0',
                points: row['Points']?.toString() || '0.00',
                goalStatus: row['Goal Status']?.toString() || '0 / 0'
              }))
            resolve(users)
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
      const users = await parseCSVFile(file)
      
      // Validate first 10 rows for preview
      const errors: ValidationError[] = []
      users.slice(0, 10).forEach((user, index) => {
        const userErrors = validateUserData(user, index + 1)
        errors.push(...userErrors)
      })

      setValidationErrors(errors)
      setPreviewData(users.slice(0, 10))
      setShowPreview(true)
    } catch (error) {
      console.error('Preview error:', error)
      showNotification('error', 'Preview failed', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsProcessing(false)
    }
  }

  const checkExistingMember = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .maybeSingle() // Use maybeSingle instead of single to avoid errors when not found
      
      if (error && !error.message?.includes('No rows')) {
        console.warn('Error checking existing member:', error)
      }
      
      return data ? true : false
    } catch (err) {
      console.warn('Error in checkExistingMember:', err)
      return false
    }
  }


  const handleImportUsers = async () => {
    if (!file) return

    try {
      setIsProcessing(true)
      setImportProgress({
        phase: 'parsing',
        current: 0,
        total: 100,
        message: 'Reading CSV file...'
      })

      const users = await parseCSVFile(file)
      
      setImportProgress({
        phase: 'validating',
        current: 0,
        total: users.length,
        message: 'Validating data...'
      })

      const stats: ImportStats = {
        total: users.length,
        successful: 0,
        failed: 0,
        skipped: 0,
        existing: 0
      }

      const errors: ValidationError[] = []

      // First pass: validation
      for (let i = 0; i < users.length; i++) {
        setImportProgress({
          phase: 'validating',
          current: i + 1,
          total: users.length,
          message: `Validating user ${i + 1} of ${users.length}...`
        })
        
        await new Promise(resolve => setTimeout(resolve, 1)) // Small delay for UI updates
        const user = users[i]
        const rowNumber = i + 1

        // Validate data
        const userErrors = validateUserData(user, rowNumber)
        if (userErrors.length > 0) {
          errors.push(...userErrors)
          stats.failed++
        }
      }

      // Second pass: importing valid records
      const validUsers = users.filter((_, index) => 
        !errors.some(error => error.row === index + 1)
      )

      setImportProgress({
        phase: createAuthAccounts ? 'creating_auth' : 'creating_members',
        current: 0,
        total: validUsers.length,
        message: createAuthAccounts ? 'Creating user accounts...' : 'Creating member records...'
      })

      // Process users with or without auth
      if (createAuthAccounts) {
        // Import WITH authentication using admin client
        setImportProgress({
          phase: 'creating_auth',
          current: 0,
          total: validUsers.length,
          message: 'Creating user accounts with authentication...'
        })

        let importedCount = 0
        
        for (let i = 0; i < validUsers.length; i++) {
          const user = validUsers[i]
          const originalIndex = users.indexOf(user)
          const rowNumber = originalIndex + 1

          setImportProgress({
            phase: 'creating_auth',
            current: importedCount + 1,
            total: validUsers.length,
            message: `Creating user ${importedCount + 1} of ${validUsers.length}...`
          })

          try {
            // Check if member already exists
            const { data: existingMember } = await supabaseAdmin
              .from('members')
              .select('id')
              .eq('email', user.email.toLowerCase())
              .maybeSingle()

            if (existingMember) {
              stats.existing++
              stats.skipped++
              importedCount++
              continue
            }

            // Create auth account with admin client
            const tempPassword = `Eau2025!${user.userId}`
            let authUserId = null

            try {
              const authUser = await createUserWithAuth(
                user.email.toLowerCase(),
                tempPassword,
                {
                  first_name: user.firstName,
                  last_name: user.lastName,
                  legacy_user_id: user.userId
                }
              )
              authUserId = authUser?.id
            } catch (authError: any) {
              console.error('Auth creation error:', authError)
              // Continue to create member even if auth fails
            }

            // Parse goal status
            const goalParts = user.goalStatus.split('/')
            const goalAchieved = parseFloat(goalParts[0]?.trim() || '0')
            const goalTarget = parseFloat(goalParts[1]?.trim() || '0')

            // Create member record using admin client
            const { error: memberError } = await supabaseAdmin
              .from('members')
              .insert({
                user_id: authUserId,
                legacy_user_id: parseInt(user.userId),
                first_name: user.firstName,
                last_name: user.lastName,
                display_name: `${user.firstName} ${user.lastName}`,
                email: user.email.toLowerCase(),
                cpd_activities_count: parseInt(user.activities || '0'),
                cpd_points_total: parseFloat(user.points || '0'),
                cpd_goal_achieved: goalAchieved,
                cpd_goal_target: goalTarget,
                membership_status: 'active',
                membership_type: 'standard',
                receive_newsletters: true,
                receive_event_notifications: true
              })

            if (memberError) {
              console.error('Member creation error:', memberError)
              errors.push({
                row: rowNumber,
                field: 'Database',
                message: memberError.message,
                data: user
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
              data: user
            })
            stats.failed++
          }

          importedCount++
          // Small delay to prevent overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      } else {
        // Process individually without auth (original logic)
        let importedCount = 0
        
        for (let i = 0; i < validUsers.length; i++) {
          const user = validUsers[i]
          const originalIndex = users.indexOf(user)
          const rowNumber = originalIndex + 1

          setImportProgress({
            phase: 'creating_members',
            current: importedCount + 1,
            total: validUsers.length,
            message: `Creating member ${importedCount + 1} of ${validUsers.length}...`
          })

          try {
            // Check if member already exists
            const exists = await checkExistingMember(user.email)
            if (exists) {
              stats.existing++
              stats.skipped++
              importedCount++
              continue
            }

            // Parse goal status
            const goalParts = user.goalStatus.split('/')
            const goalAchieved = parseFloat(goalParts[0]?.trim() || '0')
            const goalTarget = parseFloat(goalParts[1]?.trim() || '0')

            // Create member record without auth
            const { error: memberError } = await supabase
              .from('members')
              .insert({
                user_id: null, // No auth user
                legacy_user_id: parseInt(user.userId),
                first_name: user.firstName,
                last_name: user.lastName,
                display_name: `${user.firstName} ${user.lastName}`,
                email: user.email.toLowerCase(),
                cpd_activities_count: parseInt(user.activities || '0'),
                cpd_points_total: parseFloat(user.points || '0'),
                cpd_goal_achieved: goalAchieved,
                cpd_goal_target: goalTarget,
                membership_status: 'active',
                membership_type: 'standard',
                receive_newsletters: true,
                receive_event_notifications: true
              })

            if (memberError) {
              console.error('Member creation error:', memberError)
              errors.push({
                row: rowNumber,
                field: 'Database',
                message: memberError.message,
                data: user
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
              data: user
            })
            stats.failed++
          }

          importedCount++
        }
      }

      // Set completion status
      setImportProgress({
        phase: 'complete',
        current: users.length,
        total: users.length,
        message: 'Import completed!'
      })

      setValidationErrors(errors)
      setImportStats(stats)

      if (stats.successful > 0) {
        showNotification('success', `Successfully imported ${stats.successful} users!`)
      }
      
      if (stats.existing > 0) {
        showNotification('info', `${stats.existing} users already exist and were skipped.`)
      }
      
      if (stats.failed > 0) {
        showNotification('error', `${stats.failed} users failed to import. Check the errors below.`)
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
        <h1 className="text-3xl font-bold text-gray-900">Import Users</h1>
        <p className="mt-2 text-gray-600">
          Import users from CSV files exported from the legacy system
        </p>
      </div>

      <div className="space-y-6">
        {/* File Upload Section */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Upload CSV File</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Users CSV File
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
                  Size: {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={createAuthAccounts}
                  onChange={(e) => setCreateAuthAccounts(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">
                  Create authentication accounts (with temporary passwords)
                </span>
              </label>
              {createAuthAccounts && (
                <div className="ml-6 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  <strong>Note:</strong> Creating auth accounts will send confirmation emails to users. 
                  For bulk imports, consider unchecking this option and creating accounts separately.
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={handlePreviewFile}
                disabled={!file || isProcessing}
                variant="outline"
              >
                {isProcessing ? 'Processing...' : 'Preview Data'}
              </Button>
              
              <Button
                onClick={handleImportUsers}
                disabled={!file || isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {isProcessing ? 'Importing...' : 'Import Users'}
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
              <li><strong>User Id</strong> - Unique ID from legacy system</li>
              <li><strong>First Name</strong> - User's first name</li>
              <li><strong>Last Name</strong> - User's last name</li>
              <li><strong>Email</strong> - User's email address (must be unique)</li>
              <li><strong>Activities</strong> - Number of CPD activities (numeric)</li>
              <li><strong>Points</strong> - Total CPD points earned (decimal)</li>
              <li><strong>Goal Status</strong> - Format: "achieved / target" (e.g., "10 / 20")</li>
            </ul>
            <p className="mt-3 text-amber-600">
              <strong>Note:</strong> If "Create authentication accounts" is checked, temporary passwords will be generated as: Eau2025![UserID]
            </p>
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
                    <th className="border px-4 py-2 text-left">ID</th>
                    <th className="border px-4 py-2 text-left">Name</th>
                    <th className="border px-4 py-2 text-left">Email</th>
                    <th className="border px-4 py-2 text-left">Activities</th>
                    <th className="border px-4 py-2 text-left">Points</th>
                    <th className="border px-4 py-2 text-left">Goal</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((user, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border px-4 py-2 text-sm">{user.userId}</td>
                      <td className="border px-4 py-2 text-sm">{user.firstName} {user.lastName}</td>
                      <td className="border px-4 py-2 text-sm">{user.email}</td>
                      <td className="border px-4 py-2 text-sm">{user.activities}</td>
                      <td className="border px-4 py-2 text-sm">{user.points}</td>
                      <td className="border px-4 py-2 text-sm">{user.goalStatus}</td>
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
                      : importProgress.phase === 'creating_auth' || importProgress.phase === 'creating_members'
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
                <span className={`font-medium ${importProgress.phase === 'creating_auth' ? 'text-blue-600' : importProgress.phase === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                  🔐 Auth Accounts
                </span>
                <span className={`font-medium ${importProgress.phase === 'creating_members' ? 'text-blue-600' : importProgress.phase === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                  👥 Members
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
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{importStats.total}</div>
                <div className="text-sm text-blue-700">Total Records</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importStats.successful}</div>
                <div className="text-sm text-green-700">Successful</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{importStats.existing}</div>
                <div className="text-sm text-yellow-700">Already Exist</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importStats.failed}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{importStats.skipped}</div>
                <div className="text-sm text-gray-700">Skipped</div>
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