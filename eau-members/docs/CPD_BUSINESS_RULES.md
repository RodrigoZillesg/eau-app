# CPD System - Business Rules Documentation

## Overview
The Continuing Professional Development (CPD) system allows English Australia members to track their professional development activities and earn points based on completion hours and activity types.

## 1. CPD Activities Management

### 1.1 Activity Categories
The system supports 15 predefined activity categories, each with specific point values:

| Category ID | Activity Name | Default Points/Hour |
|-------------|---------------|-------------------|
| 25 | Learning Circle Interactive Course | 1.0 |
| 24 | Mentor TESOL teacher | 1.0 |
| 23 | Attend industry webinar | 1.0 |
| 15 | Attend industry PD event | 1.0 |
| 14 | Attend English Australia PD event | 1.0 |
| 17 | Present at industry event (include preparation time) | 2.0 |
| 21 | Attend in-house PD or Training event | 1.0 |
| 22 | Present at in-house PD event (include preparation time) | 2.0 |
| 9 | Attend English Australia webinar | 1.0 |
| 12 | Watch recorded webinar | 1.0 |
| 18 | Peer-observe someone's lesson | 1.0 |
| 19 | Be observed teaching (including feedback) | 1.0 |
| 20 | Complete professional course | 1.0 |
| 10 | Attend Industry Training | 1.0 |
| 13 | Read journal article | 0.5 |
| 11 | Read professional article | 0.5 |

### 1.2 Activity Submission Rules

#### Required Fields
- **Category**: Must select from predefined list
- **Activity Title**: Descriptive title of the activity
- **Date Completed**: When the activity was completed
- **Duration**: Hours and minutes spent on the activity
- **Description**: Optional detailed description
- **Provider**: Optional organization/provider name
- **Evidence**: Optional file upload for verification

#### Point Calculation
- Points = (Hours + Minutes/60) × Points_Per_Hour_For_Category
- Example: 2 hours 30 minutes of "Present at industry event" = 2.5 × 2.0 = 5.0 points

#### File Upload
- Evidence files stored in Supabase Storage under `cpd-evidence/` bucket
- File naming: `cpd-evidence-{user_id}-{timestamp}.{extension}`
- Original filename preserved in database for display

### 1.3 Activity Status Workflow

#### Status Types
1. **Pending**: Awaiting admin review (default for manual approval)
2. **Approved**: Activity accepted, points awarded
3. **Rejected**: Activity rejected with reason provided

#### Status Transitions
- **Submission**: New activities start as 'pending' (unless auto-approval enabled)
- **Auto-Approval**: If enabled, activities automatically become 'approved'
- **Manual Review**: Admins can approve or reject pending activities
- **Rejection**: Must include reason, activity becomes 'rejected'

## 2. Admin Configuration System

### 2.1 Global Settings

#### Auto-Approval Toggle
- **Enabled**: All new activities automatically approved
- **Disabled**: All new activities require manual admin review
- **Default**: Disabled (manual review required)

#### Settings Storage
- Single record in `cpd_settings` table
- Creates new record if none exists
- Updates existing record by ID

### 2.2 Category Configuration

#### Points Per Hour Management
- Admins can customize points per hour for each category
- Real-time inline editing in settings interface
- Changes apply to future activity submissions
- Existing approved activities retain original point values

#### Category Status
- All categories active by default (`is_active = true`)
- Future enhancement: ability to disable categories

## 3. Dashboard Integration

### 3.1 Statistics Display
- **Total Activities**: Count of all CPD activities
- **Pending Review**: Count of activities awaiting approval
- **Approved Activities**: Count of approved activities
- **Rejected Activities**: Count of rejected activities

### 3.2 Real-Time Updates
- Dashboard counters update dynamically
- "Pending Actions" section shows actual pending activities
- Click-through navigation to review pages

## 4. User Access Control

### 4.1 Member Access
- Submit new CPD activities
- View their own activity history
- See total points earned (approved activities only)
- View yearly point totals

### 4.2 Admin Access
- All member capabilities plus:
- Review pending activities (approve/reject)
- Configure global auto-approval settings
- Modify points per hour for categories
- View system-wide statistics
- Access CPD management pages

### 4.3 Permission Requirements
- CPD submission: Authenticated users
- CPD review: `ACCESS_ADMIN_DASHBOARD` permission
- CPD settings: `ACCESS_ADMIN_DASHBOARD` permission

## 5. Data Persistence Rules

### 5.1 Activity Records
- Permanent storage of all activities regardless of status
- Audit trail: creation timestamp, creator ID
- Approval tracking: approver ID, approval timestamp
- Rejection reason stored for rejected activities

### 5.2 Settings History
- Global settings changes tracked with timestamps
- Category configuration changes tracked
- No historical versioning (current state only)

### 5.3 File Management
- Evidence files stored permanently in Supabase Storage
- File cleanup not implemented (future enhancement)
- Original filename preserved for user reference

## 6. Business Logic Flows

### 6.1 Activity Submission Flow
1. User selects category and fills form
2. System validates required fields
3. File upload (if evidence provided)
4. Point calculation based on category settings
5. Status determination (auto-approval or pending)
6. Database record creation
7. User notification of submission status

### 6.2 Review Process Flow
1. Admin accesses review page
2. System displays pending activities with member details
3. Admin reviews activity details and evidence
4. Admin approves (adds approval metadata) or rejects (requires reason)
5. System updates activity status
6. Dashboard statistics refresh
7. User notification (future enhancement)

### 6.3 Configuration Update Flow
1. Admin accesses settings page
2. Modifies auto-approval toggle or category points
3. System validates changes
4. Database update with audit information
5. Settings applied to new activity submissions
6. Admin confirmation notification

## 7. Error Handling & Fallbacks

### 7.1 Database Fallbacks
- If settings tables don't exist, use hardcoded defaults
- Show user-friendly errors with setup instructions
- Graceful degradation when services unavailable

### 7.2 File Upload Failures
- Activity submission continues without evidence
- Error logged but doesn't block submission
- User informed of upload failure

### 7.3 Point Calculation
- Primary: Database category settings
- Fallback 1: Hardcoded category definitions
- Fallback 2: Default 1.0 points per hour

## 8. Future Enhancement Areas

### 8.1 Notification System
- Email notifications for status changes
- Admin alerts for new submissions
- Deadline reminders for pending reviews

### 8.2 Reporting & Analytics
- Member progress reports
- Category usage analytics
- Point distribution analysis
- Export capabilities

### 8.3 Advanced Configuration
- Custom activity categories
- Point validation rules
- Bulk approval operations
- Automated rejection rules

### 8.4 User Experience
- Activity templates
- Bulk submission
- Mobile optimization
- Evidence preview/download

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-06  
**Next Review**: To be scheduled based on system evolution