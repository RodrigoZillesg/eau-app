# EAU Members Platform - Technical Documentation

## System Overview

The EAU (English Australia) Members Platform is a comprehensive web application built to manage members, memberships, companies, and CPD (Continuing Professional Development) activities for English Australia organization.

## Technology Stack

### Frontend
- **React 18.2** with TypeScript
- **Vite** as build tool and dev server
- **TailwindCSS** for styling
- **React Router v6** for navigation
- **Zustand** for state management
- **SweetAlert2** for notifications
- **Lucide React** for icons
- **Papa Parse** for CSV processing

### Backend & Database
- **Supabase** (PostgreSQL) as Backend-as-a-Service
- **Row Level Security (RLS)** for data protection
- **Real-time subscriptions** for live updates
- **Edge Functions** for serverless computing

### Development Tools
- **TypeScript 5.0+**
- **ESLint** for code quality
- **PostCSS** for CSS processing
- **Node.js 18+**

## Architecture

### Project Structure
```
eau-members/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── layout/         # Layout components (MainLayout, AuthLayout)
│   │   ├── shared/         # Shared components (Guards, ErrorBoundary)
│   │   └── ui/            # Base UI components (Button, Card, Input)
│   ├── features/          # Feature modules
│   │   ├── admin/         # Admin features
│   │   ├── auth/          # Authentication
│   │   ├── cpd/           # CPD management
│   │   ├── dashboard/     # Dashboard views
│   │   └── profile/       # User profile
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Core libraries
│   │   ├── supabase/      # Supabase client and services
│   │   └── notifications/ # Notification system
│   ├── stores/            # Zustand stores
│   ├── types/             # TypeScript definitions
│   └── utils/             # Utility functions
├── public/                # Static assets
├── sql/                   # Database migrations
└── import/               # CSV import files
```

## Database Schema

### Core Tables

#### 1. members
- **id**: UUID (Primary Key)
- **user_id**: UUID (FK to auth.users)
- **legacy_user_id**: INTEGER (from old system)
- **membership_id**: UUID (FK to memberships)
- **company_id**: UUID (FK to companies)
- **first_name**: VARCHAR(100)
- **last_name**: VARCHAR(100)
- **email**: VARCHAR(255) UNIQUE
- **display_name**: VARCHAR(255)
- **membership_status**: ENUM (active, inactive, suspended, expired)
- **membership_type**: ENUM (standard, premium, student, corporate)
- **title**: VARCHAR(20)
- **position**: VARCHAR(255)
- **street_address**: VARCHAR(255)
- **suburb**: VARCHAR(100)
- **postcode**: VARCHAR(20)
- **state**: VARCHAR(50)
- **country**: VARCHAR(100)
- **mobile**: VARCHAR(50)
- **bio**: TEXT
- **member_created_date**: TIMESTAMP
- **cpd_points_total**: DECIMAL
- **cpd_activities_count**: INTEGER

#### 2. companies
- **id**: UUID (Primary Key)
- **legacy_company_id**: INTEGER UNIQUE
- **company_name**: VARCHAR(255)
- **parent_company**: VARCHAR(255)
- **abn**: VARCHAR(50)
- **company_email**: VARCHAR(255)
- **company_type**: VARCHAR(100)
- **cricos_code**: VARCHAR(50)
- **address_line_1-3**: VARCHAR(255)
- **suburb**: VARCHAR(100)
- **postcode**: VARCHAR(20)
- **state**: VARCHAR(50)
- **country**: VARCHAR(100)
- **phone**: VARCHAR(50)
- **website**: VARCHAR(255)
- **courses_offered**: TEXT
- **member_since**: DATE

#### 3. memberships
- **id**: UUID (Primary Key)
- **legacy_membership_id**: INTEGER UNIQUE
- **start_date**: DATE
- **expiry_date**: DATE
- **status**: VARCHAR(50)
- **category**: VARCHAR(100)
- **membership_type**: VARCHAR(100)
- **pricing_option**: VARCHAR(100)
- **pricing_option_cost**: DECIMAL(10,2)
- **target_type**: VARCHAR(50)
- **total_members**: INTEGER
- **company_id**: UUID (FK to companies)

#### 4. member_roles
- **id**: UUID (Primary Key)
- **member_id**: UUID (FK to members)
- **role**: VARCHAR(50)
- UNIQUE(member_id, role)

#### 5. cpd_activities
- **id**: UUID (Primary Key)
- **member_id**: UUID (FK to members)
- **category_id**: UUID (FK to cpd_categories)
- **activity_name**: VARCHAR(255)
- **description**: TEXT
- **hours**: DECIMAL(4,2)
- **points**: DECIMAL(5,2)
- **activity_date**: DATE
- **status**: ENUM (pending, approved, rejected)
- **evidence_url**: TEXT

#### 6. cpd_categories
- **id**: UUID (Primary Key)
- **name**: VARCHAR(100)
- **description**: TEXT
- **points_per_hour**: DECIMAL(3,1)

#### 7. cpd_settings
- **id**: UUID (Primary Key)
- **annual_target_hours**: INTEGER
- **annual_target_points**: INTEGER
- **period_start_month**: INTEGER
- **period_end_month**: INTEGER

## Authentication & Authorization

### Authentication Flow
1. **Supabase Auth** handles user authentication
2. **JWT tokens** stored in localStorage
3. **Auto-refresh** tokens on expiry
4. **Service Role Key** for admin operations

### Role-Based Access Control (RBAC)
- **Members**: Basic access to own profile and CPD
- **Admin**: Manage members and review CPD
- **AdminSuper**: Full system access including imports

### Permissions System
```typescript
const PERMISSIONS = {
  ACCESS_MEMBER_DASHBOARD: ['Members', 'Admin', 'AdminSuper'],
  ACCESS_ADMIN_DASHBOARD: ['Admin', 'AdminSuper'],
  MANAGE_MEMBERS: ['Admin', 'AdminSuper'],
  IMPORT_DATA: ['AdminSuper'],
  CREATE_CPD: ['Members', 'Admin', 'AdminSuper'],
  REVIEW_CPD: ['Admin', 'AdminSuper']
}
```

## Key Features Implementation

### 1. Member Management
- **CRUD operations** for members
- **Bulk import** from CSV (CompleteImportPage)
- **Pagination** with 20 items per page
- **Search with debounce** (500ms delay)
- **Bulk selection and deletion**
- **Role assignment** (automatic 'member' role on creation)

### 2. CPD System
- **Activity tracking** with categories
- **Points calculation** based on hours and category
- **Approval workflow** (pending → approved/rejected)
- **Annual targets** configurable per organization
- **Progress tracking** with visual indicators
- **File evidence** upload support

### 3. Import System
- **Three-phase import**: Companies → Memberships → Members
- **Legacy data mapping** from old system
- **Date validation** and formatting
- **Progress tracking** with real-time updates
- **Error handling** with detailed feedback
- **Bulk operations** using Supabase admin client

### 4. Dashboard
- **Real-time statistics** for members and CPD
- **Pending approvals** notification
- **Quick actions** for common tasks
- **Role-based content** display

## Performance Optimizations

### 1. Database
- **Indexes** on frequently queried columns
- **CASCADE DELETE** for referential integrity
- **Bulk operations** using IN clauses
- **Count queries** with { count: 'exact' }

### 2. Frontend
- **Debounced search** to reduce API calls
- **Pagination** to limit data transfer
- **Lazy loading** of components
- **Memoization** of expensive calculations
- **Virtual scrolling** for large lists (planned)

### 3. Caching
- **Browser cache** management
- **Supabase query cache**
- **Session storage** for temporary data

## Security Measures

### 1. Row Level Security (RLS)
- All tables have RLS enabled
- Policies based on auth.uid()
- Admin override via service role key

### 2. Input Validation
- **Frontend validation** for immediate feedback
- **Backend validation** via database constraints
- **SQL injection prevention** via parameterized queries
- **XSS prevention** via React's default escaping

### 3. Authentication Security
- **Secure password requirements**
- **Email verification** for new accounts
- **Session timeout** handling
- **HTTPS only** in production

## API Integration

### Supabase Client Configuration
```typescript
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseAnonKey = 'your-anon-key'
const supabaseServiceKey = 'your-service-key' // For admin operations

// Regular client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
```

## Development Workflow

### Environment Setup
1. Node.js 18+ required
2. Clone repository
3. Install dependencies: `npm install`
4. Configure `.env` with Supabase credentials
5. Run development server: `npm run dev`

### Port Management
- **Development port**: 5180 (fixed)
- **Kill existing processes** before starting
- **Auto-refresh** on file changes

### Database Migrations
1. SQL scripts in `/sql` directory
2. Execute in Supabase SQL Editor
3. Version control all schema changes

## Testing Strategy

### Unit Tests (Planned)
- Component testing with React Testing Library
- Service layer testing with Jest
- Mock Supabase client for isolation

### Integration Tests (Planned)
- API endpoint testing
- Database transaction testing
- Authentication flow testing

### E2E Tests (Planned)
- Cypress for user journey testing
- Critical path coverage

## Deployment

### Build Process
```bash
npm run build  # Creates dist/ directory
npm run preview  # Test production build locally
```

### Environment Variables
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`

### Hosting Options
- **Vercel** (recommended)
- **Netlify**
- **AWS Amplify**
- **Traditional hosting** with nginx

## Monitoring & Logging

### Error Tracking
- Console logging in development
- Sentry integration (planned)
- Supabase logs for database

### Performance Monitoring
- Browser DevTools
- Lighthouse audits
- Bundle size analysis

## Known Issues & Limitations

1. **Member history** foreign key constraints during deletion (fixed)
2. **Cache invalidation** requires manual refresh sometimes
3. **Large CSV imports** (>1000 rows) may timeout
4. **Email sending** limited by Supabase quotas

## Future Enhancements

1. **Event Management System**
2. **Payment Integration**
3. **Advanced Reporting**
4. **Mobile App**
5. **Multi-language Support**
6. **Automated Backups**
7. **API Documentation (OpenAPI)**
8. **Webhook Integration**

## Support & Maintenance

### Regular Tasks
- Database backups (weekly)
- Security updates (monthly)
- Performance monitoring (ongoing)
- User feedback collection

### Troubleshooting Guide
1. **Login Issues**: Clear browser cache
2. **Import Failures**: Check CSV format
3. **Permission Errors**: Verify user roles
4. **Data Not Loading**: Check Supabase connection

## Version History

- **v1.0.0** - Initial release with member management
- **v1.1.0** - CPD system implementation
- **v1.2.0** - Bulk import features
- **v1.3.0** - Complete system import (Members, Companies, Memberships)

---

*Last Updated: January 2025*