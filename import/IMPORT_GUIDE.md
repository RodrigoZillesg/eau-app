# Activity Import Guide

This guide explains how to use the Activity Import functionality for super administrators.

## Overview

The Activity Import feature allows super administrators to import CPD activities from CSV files exported from the legacy system. The import process includes validation, preview functionality, and detailed error reporting.

## Access

1. Log in as a super administrator
2. Navigate to Admin Dashboard
3. Click on "Import Activities" card or go to `/admin/import-activities`

## CSV Format Requirements

The CSV file must contain the following columns (exact names):

### Required Columns:
- `Activity Serial` - Unique identifier for the activity
- `User Id` - Internal user ID from legacy system  
- `User` - Full user name
- `First Name` - User's first name
- `Last Name` - User's last name
- `Email` - User's email address (used to match existing members)
- `Category Serial` - Numeric category ID
- `Category` - Category name/description
- `PD activity name` - Title of the activity
- `Development areas` - Areas of professional development
- `Completed Date` - Date when activity was completed (YYYY-MM-DD format)
- `Hours of PD (anything below 60 minutes can be entered as a decimal, e.g. 30 mins = 0.5)` - Hours spent on activity
- `Event website (where possible)` - Optional website URL
- `Supply Evidence (e.g. attendance statement)` - Evidence description
- `Verified` - Verification status (0 or 1)
- `Personal development goal this activity addresses` - Personal development goals
- `Key take-aways/reflections` - Key learnings
- `How can I use this in my own teaching?` - Application notes
- `Action I intend to take to experiment with this idea` - Action plan

## Import Process

### 1. File Selection
- Click "Choose File" and select your CSV file
- Only CSV files are accepted
- File size limit: Approximately 8MB

### 2. Preview Data (Optional)
- Click "Preview Data" to see the first 10 rows
- Review the data format and check for obvious issues
- Validation errors will be shown for preview rows

### 3. Import Activities
- Click "Import Activities" to start the import process
- The system will:
  - Validate all rows
  - Match users by email address
  - Check for required fields
  - Validate data formats
  - Insert valid activities into the database

### 4. Review Results
- After import, you'll see statistics:
  - Total records processed
  - Successful imports
  - Failed imports
  - Skipped records

## Data Mapping

The CSV data is mapped to the CPD activities table as follows:

| CSV Column | Database Field | Notes |
|------------|----------------|--------|
| Category Serial | category_id | Must be valid integer |
| Category | category_name | Text description |
| PD activity name | activity_title | Main activity title |
| Development areas | description | Combined with other text fields |
| Completed Date | date_completed | Must be valid date (YYYY-MM-DD) |
| Hours of PD | hours | Must be positive number |
| Event website | evidence_url | Optional URL |
| Verified | status | 1 = approved, 0 = pending |
| Email | user_id/member_id | Used to find existing member |

The description field combines multiple text fields from the CSV:
- Development areas
- Personal development goal
- Key take-aways/reflections
- How can I use this in my own teaching?
- Action I intend to take to experiment with this idea

## Validation Rules

### Required Fields:
- User Id
- Email (valid format)
- Category Serial (numeric)
- Category
- PD activity name
- Completed Date (valid date format)
- Hours (positive number)

### Data Format Requirements:
- Email: Must be valid email format
- Date: YYYY-MM-DD format
- Hours: Positive decimal number
- User: Must exist in the members table

## Error Handling

The system provides detailed error reporting:

### Common Errors:
1. **User not found**: Email doesn't match any existing member
2. **Invalid date format**: Date is not in YYYY-MM-DD format
3. **Invalid hours**: Hours is not a positive number
4. **Missing required field**: Required field is empty
5. **Invalid email format**: Email format is incorrect

### Error Display:
- Errors are grouped by row number
- Each error shows the field name and description
- User email is shown for context
- All errors must be fixed in the source CSV before re-importing

## Best Practices

1. **Test with small files first**: Start with a subset of data to verify the process
2. **Clean your data**: Ensure all required fields are populated
3. **Verify member emails**: Make sure all users exist in the system before importing
4. **Use preview**: Always preview data before importing
5. **Backup**: Keep a backup of your CSV file
6. **Check results**: Review import statistics and error reports carefully

## Troubleshooting

### Import fails completely:
- Check file format (must be CSV)
- Verify column names match exactly
- Ensure file is not corrupted

### High number of failures:
- Check email addresses match existing members
- Verify date formats
- Ensure hours are numeric
- Check for empty required fields

### Performance issues:
- Large files may take time to process
- Consider breaking very large files into smaller chunks
- Monitor browser memory usage

## Support

For technical issues or questions about the import process, contact the system administrator.