import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Building2, Users, Upload, AlertTriangle, FileSpreadsheet, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react'
import { showNotification } from '../../../lib/notifications'
import { createClient } from '@supabase/supabase-js'
import Papa from 'papaparse'

// Use Supabase Cloud with Service Role Key for admin operations
const supabaseUrl = 'https://ypsvoxelitgceclohxfu.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwc3ZveGVsaXRnY2VjbG9oeGZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcwMTc1NSwiZXhwIjoyMDc0Mjc3NzU1fQ.y_k4b4TlAev9R4TTFqHA08EjdZA-7Ymm5V1zMl-CYhA'

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface ImportStats {
  institutions: { total: number; created: number; existing: number; failed: number }
  members: { total: number; created: number; existing: number; failed: number }
}

export default function CompleteImportPageFixed() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState<any>(null)
  const [importStats, setImportStats] = useState<ImportStats | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        showNotification('error', 'Please select a CSV file')
        return
      }
      setFile(selectedFile)
      setErrors([])
      setImportStats(null)
    }
  }

  const parseCSVFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data)
        },
        error: (error) => {
          reject(error)
        }
      })
    })
  }

  const handleImport = async () => {
    if (!file) {
      showNotification('error', 'Please select a file first')
      return
    }

    setImporting(true)
    setErrors([])

    const stats: ImportStats = {
      institutions: { total: 0, created: 0, existing: 0, failed: 0 },
      members: { total: 0, created: 0, existing: 0, failed: 0 }
    }

    try {
      // Parse CSV
      setProgress({ message: 'Reading CSV file...', current: 0, total: 100 })
      const records = await parseCSVFile(file)

      console.log('CSV Columns:', records.length > 0 ? Object.keys(records[0]) : [])

      // Track unique institutions
      const institutionsMap = new Map()
      const membersToImport = []

      // Process records
      for (const record of records) {
        // Extract institution data - handle different column name formats
        const institutionName =
          record['Company Name'] ||
          record['Company Company Name'] ||
          record['Member Company Name (Actual name)'] ||
          record['Institution'] || ''

        if (institutionName && institutionName.trim()) {
          if (!institutionsMap.has(institutionName)) {
            institutionsMap.set(institutionName, {
              name: institutionName,
              address: record['Company Company Address Line 1'] || record['Company Address Line1'] || '',
              city: record['Company Company Suburb'] || record['Company Suburb'] || '',
              state: record['Company Company State'] || record['Company State'] || '',
              postal_code: record['Company Company Postcode'] || record['Company Postcode'] || '',
              country: record['Company Company Country'] || record['Company Country'] || 'Australia',
              phone: record['Company Company Phone'] || record['Company Phone'] || '',
              email: record['Company Company Email Address'] || record['Company Email'] || '',
              website: record['Company Website'] || ''
            })
          }
        }

        // Extract member data
        const firstName = record['Member First Name'] || record['First Name'] || ''
        const lastName = record['Member Last Name'] || record['Last Name'] || ''
        const email = record['Member Email Address'] || record['Member Email'] || record['Email'] || ''

        if (firstName && lastName && email) {
          membersToImport.push({
            first_name: firstName,
            last_name: lastName,
            email: email.toLowerCase(),
            phone: record['Member Phone'] || record['Phone'] || '',
            job_title: record['Member Position'] || record['Position'] || '',
            institution: institutionName,
            membership_type: record['Type'] || record['Membership Type'] || null,
            membership_status: record['Status'] === 'Active' ? 'active' : 'inactive',
            user_type: 'member'
          })
        }
      }

      console.log(`Found ${institutionsMap.size} institutions and ${membersToImport.length} members`)

      // Step 1: Import Institutions
      setProgress({ message: 'Importing institutions...', current: 0, total: institutionsMap.size })
      stats.institutions.total = institutionsMap.size

      const institutionIdMap = new Map()
      let institutionCount = 0

      for (const [name, institution] of institutionsMap) {
        institutionCount++
        setProgress({
          message: `Importing institution ${institutionCount}/${institutionsMap.size}`,
          current: institutionCount,
          total: institutionsMap.size
        })

        try {
          // Check if institution exists
          const { data: existing } = await supabaseAdmin
            .from('institutions')
            .select('id')
            .eq('name', name)
            .single()

          if (existing) {
            stats.institutions.existing++
            institutionIdMap.set(name, existing.id)
          } else {
            // Create new institution
            const { data: newInstitution, error } = await supabaseAdmin
              .from('institutions')
              .insert({
                name: institution.name,
                address: institution.address,
                city: institution.city,
                state: institution.state,
                postal_code: institution.postal_code,
                country: institution.country,
                phone: institution.phone,
                email: institution.email,
                website: institution.website,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single()

            if (error) {
              stats.institutions.failed++
              setErrors(prev => [...prev, `Institution ${name}: ${error.message}`])
            } else if (newInstitution) {
              stats.institutions.created++
              institutionIdMap.set(name, newInstitution.id)
            }
          }
        } catch (error: any) {
          stats.institutions.failed++
          setErrors(prev => [...prev, `Institution ${name}: ${error.message || error}`])
        }
      }

      // Step 2: Import Members
      setProgress({ message: 'Importing members...', current: 0, total: membersToImport.length })
      stats.members.total = membersToImport.length

      let memberCount = 0
      for (const member of membersToImport) {
        memberCount++
        setProgress({
          message: `Importing member ${memberCount}/${membersToImport.length}`,
          current: memberCount,
          total: membersToImport.length
        })

        try {
          // Check if member exists
          const { data: existing } = await supabaseAdmin
            .from('members')
            .select('id')
            .eq('email', member.email)
            .single()

          if (existing) {
            stats.members.existing++
            continue
          }

          // Get institution ID
          const institutionId = member.institution ? institutionIdMap.get(member.institution) : null

          // Create member
          const { data: newMember, error } = await supabaseAdmin
            .from('members')
            .insert({
              first_name: member.first_name,
              last_name: member.last_name,
              email: member.email,
              phone: member.phone,
              job_title: member.job_title,
              institution_id: institutionId,
              user_type: member.user_type,
              membership_type: member.membership_type,
              membership_status: member.membership_status,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()

          if (error) {
            stats.members.failed++
            setErrors(prev => [...prev, `Member ${member.email}: ${error.message}`])
          } else if (newMember) {
            stats.members.created++

            // Create auth user
            try {
              const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!'

              const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: member.email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                  first_name: member.first_name,
                  last_name: member.last_name,
                  member_id: newMember.id
                }
              })

              if (!authError && authUser) {
                // Update member with user_id
                await supabaseAdmin
                  .from('members')
                  .update({ user_id: authUser.user.id })
                  .eq('id', newMember.id)
              }
            } catch (authError: any) {
              console.error('Auth user creation failed:', authError)
              // Don't fail the member import if auth fails
            }
          }
        } catch (error: any) {
          stats.members.failed++
          setErrors(prev => [...prev, `Member ${member.email}: ${error.message || error}`])
        }
      }

      setImportStats(stats)
      setProgress(null)

      showNotification('success', `Import completed! Institutions: ${stats.institutions.created} created, Members: ${stats.members.created} created`)

    } catch (error: any) {
      console.error('Import error:', error)
      showNotification('error', `Import failed: ${error.message || error}`)
      setProgress(null)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/admin')}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Import System</h1>
            <p className="mt-2 text-sm text-gray-600">
              Import members and institutions from CSV files
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload Card */}
            <Card>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <FileSpreadsheet className="h-5 w-5 text-indigo-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">CSV File Upload</h2>
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {!file ? (
                      <div>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Drop your CSV file here, or{' '}
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-indigo-600 hover:text-indigo-500 font-medium"
                            disabled={importing}
                          >
                            browse
                          </button>
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          CSV files up to 10MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                        <p className="mt-2 text-sm font-medium text-gray-900">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                        <button
                          onClick={() => {
                            setFile(null)
                            setImportStats(null)
                            setErrors([])
                          }}
                          className="mt-2 text-sm text-red-600 hover:text-red-500"
                          disabled={importing}
                        >
                          Remove file
                        </button>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleImport}
                    disabled={!file || importing}
                    className="w-full"
                    size="lg"
                  >
                    {importing ? (
                      <>
                        <Clock className="h-5 w-5 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 mr-2" />
                        Start Import
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Progress Card */}
            {progress && (
              <Card className="border-indigo-200 bg-indigo-50">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-indigo-900">
                      {progress.message}
                    </span>
                    {progress.total > 0 && (
                      <span className="text-sm text-indigo-700">
                        {progress.current} / {progress.total}
                      </span>
                    )}
                  </div>
                  {progress.total > 0 && (
                    <div className="w-full bg-indigo-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Results Card */}
            {importStats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <Building2 className="h-5 w-5 text-indigo-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">Institutions</h3>
                    </div>
                    <dl className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <dt className="text-gray-500">Total Processed:</dt>
                        <dd className="font-medium text-gray-900">{importStats.institutions.total}</dd>
                      </div>
                      <div className="flex justify-between text-sm">
                        <dt className="text-gray-500">Created:</dt>
                        <dd className="font-medium text-green-600">{importStats.institutions.created}</dd>
                      </div>
                      <div className="flex justify-between text-sm">
                        <dt className="text-gray-500">Already Existed:</dt>
                        <dd className="font-medium text-blue-600">{importStats.institutions.existing}</dd>
                      </div>
                      {importStats.institutions.failed > 0 && (
                        <div className="flex justify-between text-sm">
                          <dt className="text-gray-500">Failed:</dt>
                          <dd className="font-medium text-red-600">{importStats.institutions.failed}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <Users className="h-5 w-5 text-indigo-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">Members</h3>
                    </div>
                    <dl className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <dt className="text-gray-500">Total Processed:</dt>
                        <dd className="font-medium text-gray-900">{importStats.members.total}</dd>
                      </div>
                      <div className="flex justify-between text-sm">
                        <dt className="text-gray-500">Created:</dt>
                        <dd className="font-medium text-green-600">{importStats.members.created}</dd>
                      </div>
                      <div className="flex justify-between text-sm">
                        <dt className="text-gray-500">Already Existed:</dt>
                        <dd className="font-medium text-blue-600">{importStats.members.existing}</dd>
                      </div>
                      {importStats.members.failed > 0 && (
                        <div className="flex justify-between text-sm">
                          <dt className="text-gray-500">Failed:</dt>
                          <dd className="font-medium text-red-600">{importStats.members.failed}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </Card>
              </div>
            )}

            {/* Errors Card */}
            {errors.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <div className="p-6">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-800 mb-2">
                        Import Errors ({errors.length})
                      </h3>
                      <div className="text-sm text-red-700 space-y-1 max-h-60 overflow-y-auto">
                        {errors.map((error, index) => (
                          <div key={index} className="flex items-start">
                            <span className="text-red-400 mr-2">•</span>
                            <span className="text-xs">{error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Instructions */}
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Import Instructions
                </h3>
                <div className="space-y-4 text-sm text-gray-600">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">File Format</h4>
                    <p>Upload a CSV file with member and institution data.</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Required Columns</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Member First Name</li>
                      <li>Member Last Name</li>
                      <li>Member Email Address</li>
                      <li>Company Name (optional)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Import Process</h4>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Institutions are imported first</li>
                      <li>Members are linked to institutions</li>
                      <li>Auth accounts are created</li>
                      <li>Duplicates are skipped</li>
                    </ol>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      For large files (&gt;1000 records), consider using the command-line import tool for better performance.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <div className="p-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Need Help?
                </h3>
                <p className="text-xs text-blue-700 mb-3">
                  Check the documentation for detailed instructions and troubleshooting.
                </p>
                <Button
                  onClick={() => window.open('/docs/import-system', '_blank')}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  View Documentation
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}