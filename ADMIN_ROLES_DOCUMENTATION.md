# Admin Roles Documentation

## Role Hierarchy

### 🔴 SuperAdmin (AdminSuper)
**Purpose**: Technical administration and system configuration
**Access Level**: FULL SYSTEM ACCESS

#### Exclusive Permissions:
- **SMTP Configuration** - Configure email server settings
- **User Role Management** - Create/modify SuperAdmin users
- **System Settings** - Access to all technical configurations
- **Database Management** - Direct database operations
- **API Configuration** - Manage API keys and integrations
- **Deployment Settings** - Access deployment configurations
- **Email Templates** - Modify system email templates
- **Security Settings** - Configure security parameters

#### Can do everything Admin can do, plus technical tasks

---

### 🟠 Admin
**Purpose**: Daily operational management
**Access Level**: OPERATIONAL ACCESS

#### Permissions:
- **Member Management**
  - ✅ View all members
  - ✅ Edit member profiles
  - ✅ Approve/reject registrations
  - ✅ Assign Member/MemberColleges roles
  - ❌ Cannot assign Admin/SuperAdmin roles

- **CPD Management**
  - ✅ Review and approve CPD activities (only when auto-approval is disabled)
  - ❌ Cannot manage CPD categories and settings
  - ❌ Cannot configure CPD points and rules
  - ✅ Export CPD reports

- **Event Management**
  - ✅ Create/edit/delete events
  - ✅ Manage event registrations
  - ❌ Cannot configure event reminder settings
  - ✅ View event analytics

- **Content Management**
  - ✅ Manage announcements
  - ✅ Update content pages
  - ✅ Manage resources

- **Reports & Analytics**
  - ✅ View all reports
  - ✅ Export data
  - ✅ View analytics

#### Hidden from Admin:
- ❌ SMTP Settings page
- ❌ Email Templates configuration
- ❌ CPD Settings & Configuration
- ❌ Event Reminder Settings
- ❌ CPD Review (when auto-approval is enabled)
- ❌ SuperAdmin user creation
- ❌ System configuration pages
- ❌ Technical error logs
- ❌ Database operations
- ❌ API key management

---

### 🟡 Members
**Purpose**: Regular platform users
**Access Level**: USER ACCESS

#### Permissions:
- ✅ View own profile
- ✅ Submit CPD activities
- ✅ Register for events
- ✅ View announcements
- ✅ Access member resources

---

### 🔵 MemberColleges
**Purpose**: College member users
**Access Level**: EXTENDED USER ACCESS

#### Permissions:
- All Member permissions, plus:
- ✅ Access college-specific resources
- ✅ View college-specific events

---

## Implementation Strategy

### 1. Permission Guards
```typescript
// For SuperAdmin only features
<PermissionGuard roles={['AdminSuper']}>
  <SMTPSettings />
</PermissionGuard>

// For both Admin types
<PermissionGuard roles={['Admin', 'AdminSuper']}>
  <MemberManagement />
</PermissionGuard>
```

### 2. Menu Visibility
Admin menu items will be conditionally rendered based on role:
- SuperAdmin sees ALL menu items
- Admin sees only operational items

### 3. Route Protection
Routes will check permissions before rendering:
- Technical routes require SuperAdmin
- Operational routes accept both Admin and SuperAdmin

## Testing Matrix

| Feature | SuperAdmin | Admin | Member |
|---------|------------|-------|---------|
| SMTP Settings | ✅ | ❌ | ❌ |
| Email Templates | ✅ | ❌ | ❌ |
| CPD Settings | ✅ | ❌ | ❌ |
| Event Reminders | ✅ | ❌ | ❌ |
| Create SuperAdmin | ✅ | ❌ | ❌ |
| Manage Members | ✅ | ✅ | ❌ |
| Approve CPD | ✅ | ✅* | ❌ |
| Create Events | ✅ | ✅ | ❌ |
| Submit CPD | ✅ | ✅ | ✅ |
| View Own Profile | ✅ | ✅ | ✅ |

*Admin only sees CPD Review when auto-approval is disabled