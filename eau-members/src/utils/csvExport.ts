/**
 * CSV Export Utility
 * Handles exporting data to CSV format
 */

export interface CSVExportOptions {
  filename?: string
  headers?: string[]
  includeHeaders?: boolean
}

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  options: CSVExportOptions = {}
): void {
  const {
    filename = `export-${new Date().toISOString().split('T')[0]}.csv`,
    headers,
    includeHeaders = true
  } = options

  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Get all unique keys from data if headers not provided
  const allKeys = headers || Array.from(
    new Set(data.flatMap(item => Object.keys(item)))
  )

  // Build CSV content
  const csvRows: string[] = []

  // Add headers if requested
  if (includeHeaders) {
    csvRows.push(allKeys.map(key => escapeCSVValue(key)).join(','))
  }

  // Add data rows
  data.forEach(item => {
    const row = allKeys.map(key => {
      const value = item[key]
      return escapeCSVValue(formatValue(value))
    })
    csvRows.push(row.join(','))
  })

  // Create CSV string
  const csvContent = csvRows.join('\n')

  // Create blob and download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up
  URL.revokeObjectURL(url)
}

function escapeCSVValue(value: string): string {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)

  // Check if value needs to be quoted
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    // Escape quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

/**
 * Export members data with formatted columns
 */
export function exportMembersToCSV(members: any[], filename?: string) {
  const formattedData = members.map(member => ({
    'First Name': member.first_name,
    'Last Name': member.last_name,
    'Email': member.email,
    'Phone': member.phone || '',
    'Membership Status': member.membership_status,
    'Membership Type': member.membership_type,
    'Interest Group': member.interest_group || '',
    'City': member.city || '',
    'State': member.state || '',
    'Country': member.country || 'Australia',
    'Profession': member.profession || '',
    'Experience Years': member.experience_years || '',
    'Qualifications': member.qualifications || '',
    'Roles': member.member_roles?.map((r: any) => r.role).join(', ') || '',
    'Member Since': member.membership_start_date ? new Date(member.membership_start_date).toLocaleDateString() : '',
    'Newsletter': member.receive_newsletters ? 'Yes' : 'No',
    'Event Notifications': member.receive_event_notifications ? 'Yes' : 'No'
  }))

  exportToCSV(formattedData, {
    filename: filename || `members-export-${new Date().toISOString().split('T')[0]}.csv`
  })
}