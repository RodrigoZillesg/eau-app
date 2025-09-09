import React, { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, Check, X, Users, AlertTriangle, Loader2, Download } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { showNotification } from '../../lib/notifications'
import { memberService } from '../../services/memberService'
import { memberDuplicateService } from '../../services/memberDuplicateService'
import { supabase } from '../../lib/supabase'
import Papa from 'papaparse'

interface ImportSession {
  id?: string
  filename: string
  total_rows: number
  members_imported: number
  members_updated: number
  members_skipped: number
  duplicates_found: number
  status: 'processing' | 'completed' | 'failed'
  errors: any[]
}

interface CSVRow {
  [key: string]: string
}

interface ProcessedMember {
  first_name: string
  last_name: string
  email: string
  phone?: string
  company_name?: string
  street_address?: string
  suburb?: string
  state?: string
  postcode?: string
  country?: string
  membership_type?: string
  membership_status?: string
  original_row?: CSVRow
}

export function MemberImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<ProcessedMember[]>([])
  const [session, setSession] = useState<ImportSession | null>(null)
  const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({})
  const [duplicateCheckEnabled, setDuplicateCheckEnabled] = useState(true)
  const [duplicateThreshold, setDuplicateThreshold] = useState(70)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      showNotification('error', 'Please select a CSV file')
      return
    }

    setFile(selectedFile)
    parseCSV(selectedFile)
  }

  const parseCSV = (csvFile: File) => {
    setParsing(true)
    
    Papa.parse(csvFile, {
      complete: (result) => {
        if (result.errors.length > 0) {
          showNotification('error', 'Error parsing CSV file')
          console.error('CSV parsing errors:', result.errors)
          setParsing(false)
          return
        }

        const rows = result.data as CSVRow[]
        if (rows.length === 0) {
          showNotification('error', 'CSV file is empty')
          setParsing(false)
          return
        }

        // Auto-detect column mappings
        const headers = Object.keys(rows[0])
        const autoMapping = detectColumnMappings(headers)
        setColumnMapping(autoMapping)

        // Process rows with detected mapping
        const processed = rows.slice(0, 10).map(row => processRow(row, autoMapping))
        setPreview(processed)

        // Initialize session
        setSession({
          filename: csvFile.name,
          total_rows: rows.length,
          members_imported: 0,
          members_updated: 0,
          members_skipped: 0,
          duplicates_found: 0,
          status: 'processing',
          errors: []
        })

        setParsing(false)
      },
      header: true,
      skipEmptyLines: true
    })
  }

  const detectColumnMappings = (headers: string[]): { [key: string]: string } => {
    const mapping: { [key: string]: string } = {}
    
    const fieldMappings = {
      first_name: ['first_name', 'firstname', 'first name', 'given name', 'name'],
      last_name: ['last_name', 'lastname', 'last name', 'surname', 'family name'],
      email: ['email', 'email address', 'e-mail', 'emailaddress'],
      phone: ['phone', 'telephone', 'mobile', 'cell', 'phone number', 'contact'],
      company_name: ['company', 'company name', 'organization', 'business', 'employer'],
      street_address: ['address', 'street', 'street address', 'address line 1', 'street_address'],
      suburb: ['city', 'town', 'suburb'],
      state: ['state', 'province', 'region'],
      postcode: ['postal code', 'postcode', 'zip', 'zip code', 'postal_code'],
      country: ['country', 'nation'],
      membership_type: ['membership type', 'member type', 'category', 'membership'],
      membership_status: ['status', 'membership status', 'active']
    }

    headers.forEach(header => {
      const headerLower = header.toLowerCase().trim()
      
      for (const [field, variations] of Object.entries(fieldMappings)) {
        if (variations.some(v => headerLower.includes(v))) {
          mapping[field] = header
          break
        }
      }
    })

    // Special handling for name field if first/last not found
    if (!mapping.first_name && !mapping.last_name) {
      const nameField = headers.find(h => h.toLowerCase().includes('name'))
      if (nameField) {
        mapping.full_name = nameField
      }
    }

    return mapping
  }

  const processRow = (row: CSVRow, mapping: { [key: string]: string }): ProcessedMember => {
    const member: ProcessedMember = {
      first_name: '',
      last_name: '',
      email: '',
      original_row: row
    }

    // Handle full name splitting if needed
    if (mapping.full_name && row[mapping.full_name]) {
      const parts = row[mapping.full_name].split(' ')
      member.first_name = parts[0] || ''
      member.last_name = parts.slice(1).join(' ') || ''
    }

    // Map other fields
    Object.entries(mapping).forEach(([field, csvColumn]) => {
      if (field !== 'full_name' && row[csvColumn]) {
        (member as any)[field] = row[csvColumn].trim()
      }
    })

    // Clean up phone number
    if (member.phone) {
      member.phone = member.phone.replace(/[^\d+\s()-]/g, '')
    }

    // Normalize membership type
    if (member.membership_type) {
      const type = member.membership_type.toLowerCase()
      if (type.includes('individual')) member.membership_type = 'individual'
      else if (type.includes('student')) member.membership_type = 'student'
      else if (type.includes('corporate')) member.membership_type = 'corporate'
      else if (type.includes('institution')) member.membership_type = 'institutional'
    }

    // Normalize membership status
    if (member.membership_status) {
      const status = member.membership_status.toLowerCase()
      member.membership_status = status.includes('active') ? 'active' : 'inactive'
    } else {
      member.membership_status = 'active' // Default to active
    }

    return member
  }

  const handleImport = async () => {
    if (!file || !session) return

    setImporting(true)
    
    try {
      // Parse full file
      Papa.parse(file, {
        complete: async (result) => {
          const rows = result.data as CSVRow[]
          const totalRows = rows.length
          let imported = 0
          let updated = 0
          let skipped = 0
          let duplicatesFound = 0
          const errors: any[] = []

          // Create import session in database
          const { data: importSession, error: sessionError } = await supabase
            .from('member_import_sessions')
            .insert({
              filename: file.name,
              file_size: file.size,
              total_rows: totalRows,
              status: 'processing',
              import_config: { column_mapping: columnMapping, duplicate_check: duplicateCheckEnabled }
            })
            .select()
            .single()

          if (sessionError) {
            console.error('Error creating import session:', sessionError)
          }

          // Process each row
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            const member = processRow(row, columnMapping)

            // Validate required fields
            if (!member.email || !member.first_name || !member.last_name) {
              skipped++
              errors.push({
                row: i + 1,
                error: 'Missing required fields (email, first name, or last name)'
              })
              continue
            }

            try {
              // Check for existing member
              const { data: existingMember } = await supabase
                .from('members')
                .select('id')
                .eq('email', member.email)
                .single()

              if (existingMember) {
                // Update existing member
                await supabase
                  .from('members')
                  .update(member)
                  .eq('id', existingMember.id)
                updated++
              } else {
                // Create new member
                const { data: newMember, error: createError } = await supabase
                  .from('members')
                  .insert(member)
                  .select()
                  .single()

                if (createError) {
                  throw createError
                }

                imported++

                // Check for duplicates if enabled
                if (duplicateCheckEnabled && newMember) {
                  const duplicates = await memberDuplicateService.findDuplicatesForMember(
                    newMember.id,
                    duplicateThreshold
                  )
                  
                  if (duplicates.length > 0) {
                    duplicatesFound += duplicates.length
                    
                    // Save duplicate records
                    for (const dup of duplicates) {
                      await memberDuplicateService.saveDuplicate(dup)
                    }
                  }
                }
              }
            } catch (error) {
              console.error(`Error processing row ${i + 1}:`, error)
              skipped++
              errors.push({
                row: i + 1,
                error: error instanceof Error ? error.message : 'Unknown error'
              })
            }

            // Update progress
            if (i % 10 === 0) {
              setSession({
                ...session,
                members_imported: imported,
                members_updated: updated,
                members_skipped: skipped,
                duplicates_found: duplicatesFound,
                errors
              })
            }
          }

          // Update final session
          if (importSession) {
            await supabase
              .from('member_import_sessions')
              .update({
                status: 'completed',
                members_imported: imported,
                members_updated: updated,
                members_skipped: skipped,
                duplicates_found: duplicatesFound,
                errors,
                completed_at: new Date().toISOString()
              })
              .eq('id', importSession.id)
          }

          setSession({
            ...session,
            status: 'completed',
            members_imported: imported,
            members_updated: updated,
            members_skipped: skipped,
            duplicates_found: duplicatesFound,
            errors
          })

          showNotification('success', 
            `Import completed! ${imported} new members, ${updated} updated, ${skipped} skipped. ${duplicatesFound} potential duplicates found.`
          )
        },
        header: true,
        skipEmptyLines: true
      })
    } catch (error) {
      console.error('Import error:', error)
      showNotification('error', 'Failed to import members')
      setSession(prev => prev ? { ...prev, status: 'failed' } : null)
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const template = [
      ['first_name', 'last_name', 'email', 'phone', 'company_name', 'street_address', 'suburb', 'state', 'postcode', 'country', 'membership_type', 'membership_status'],
      ['John', 'Doe', 'john.doe@example.com', '+1234567890', 'Acme Corp', '123 Main St', 'Sydney', 'NSW', '2000', 'Australia', 'individual', 'active'],
      ['Jane', 'Smith', 'jane.smith@example.com', '+0987654321', 'Tech Inc', '456 High St', 'Melbourne', 'VIC', '3000', 'Australia', 'corporate', 'active']
    ]
    
    const csv = template.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'member_import_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Import Members</h1>
            <p className="text-gray-600 mt-1">Import members from CSV file with automatic duplicate detection</p>
          </div>
          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="mt-4 md:mt-0"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>

        {/* Upload Section */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Upload CSV File</h3>
              {file && (
                <span className="text-sm text-gray-600">
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </span>
              )}
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-500 mt-1">CSV files only</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Duplicate Detection Settings */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  checked={duplicateCheckEnabled}
                  onChange={(e) => setDuplicateCheckEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="font-medium">Enable Duplicate Detection</span>
              </label>
              
              {duplicateCheckEnabled && (
                <div className="ml-7">
                  <label className="text-sm text-gray-600">
                    Similarity Threshold: {duplicateThreshold}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={duplicateThreshold}
                    onChange={(e) => setDuplicateThreshold(Number(e.target.value))}
                    className="w-full mt-1"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Low (50%)</span>
                    <span>Medium (70%)</span>
                    <span>High (90%)</span>
                    <span>Exact (100%)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Preview Section */}
        {preview.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Preview (First 10 rows)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.map((member, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {member.first_name} {member.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {member.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {member.company_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {member.membership_type || 'individual'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          member.membership_status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.membership_status || 'active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Import Button */}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleImport}
                disabled={importing || !file}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Start Import
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Import Progress */}
        {session && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Import Progress</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{session.total_rows}</p>
                <p className="text-sm text-gray-600">Total Rows</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{session.members_imported}</p>
                <p className="text-sm text-gray-600">Imported</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{session.members_updated}</p>
                <p className="text-sm text-gray-600">Updated</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{session.members_skipped}</p>
                <p className="text-sm text-gray-600">Skipped</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{session.duplicates_found}</p>
                <p className="text-sm text-gray-600">Duplicates</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                session.status === 'completed' ? 'bg-green-100 text-green-800' :
                session.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {session.status === 'completed' ? 'Completed' :
                 session.status === 'failed' ? 'Failed' :
                 'Processing...'}
              </span>
              
              {session.duplicates_found > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.href = '/admin/duplicates'}
                >
                  Review Duplicates
                </Button>
              )}
            </div>

            {/* Errors */}
            {session.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900 mb-2">Import Errors</h4>
                    <div className="max-h-32 overflow-y-auto">
                      {session.errors.slice(0, 5).map((error, idx) => (
                        <p key={idx} className="text-sm text-red-700">
                          Row {error.row}: {error.error}
                        </p>
                      ))}
                      {session.errors.length > 5 && (
                        <p className="text-sm text-red-700 mt-2">
                          ... and {session.errors.length - 5} more errors
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}