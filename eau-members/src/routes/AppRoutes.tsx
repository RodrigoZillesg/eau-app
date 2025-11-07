import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { SignupPage } from '../features/auth/pages/SignupPage'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { UnauthorizedPage } from '../components/shared/UnauthorizedPage'
import { RoleBasedRoute } from '../components/shared/RoleBasedRoute'
import { MainLayout } from '../components/layout/MainLayout'
import { useAuthStore } from '../stores/authStore'
import { AdminDashboard } from '../features/admin/components/AdminDashboard'
import { MemberDashboard } from '../features/dashboard/components/MemberDashboard'
import { MembersPage } from '../features/admin/pages/MembersPage'
import { MembershipManagementPage } from '../features/admin/pages/MembershipManagementPage'
import { MembershipFeesPage } from '../features/admin/pages/MembershipFeesPage'
import { InstitutionsManagementPage } from '../features/admin/pages/InstitutionsManagementPage'
import { ActivityImportPage } from '../features/admin/pages/ActivityImportPage'
import { ActivityImportPageFixed } from '../features/admin/pages/ActivityImportPageFixed'
import CompleteImportPageFixed from '../features/admin/pages/CompleteImportPageFixed'
import { ProfilePage } from '../features/profile/pages/ProfilePage'
import { CPDPage } from '../features/cpd/pages/CPDPage'
import { CPDReviewPage } from '../features/cpd/pages/CPDReviewPage'
import { CPDSettingsPage } from '../features/cpd/pages/CPDSettingsPage'
import { CPDManagementPage } from '../features/cpd/pages/CPDManagementPage'
import { CPDCategoriesPage } from '../features/admin/pages/CPDCategoriesPage'
import { EventsListPage } from '../features/events/pages/EventsListPage'
import { EventDetailsPage } from '../features/events/pages/EventDetailsPage'
import { MyRegistrationsPage } from '../features/events/pages/MyRegistrationsPage'
import { AdminEventsPage } from '../features/events/pages/AdminEventsPage'
import PendingPaymentsPage from '../features/admin/pages/PendingPaymentsPage'
import { SMTPSettingsPage } from '../features/admin/pages/SMTPSettingsPage'
import EmailJSConfigPage from '../features/admin/pages/EmailJSConfigPage'
import { EmailTemplatesPage } from '../features/admin/pages/EmailTemplatesPage'
import { EventReminderSettingsPage } from '../features/admin/pages/EventReminderSettingsPage'
import { SetupMediaLibrary } from '../pages/admin/SetupMediaLibrary'
import { EditorTestPage } from '../features/admin/pages/EditorTestPage'
import { RichContentTestPage } from '../features/admin/pages/RichContentTestPage'
import { WysiwygTestPage } from '../features/admin/pages/WysiwygTestPage'
import { QuillDebugPage } from '../features/admin/pages/QuillDebugPage'
import { OverflowTestPage } from '../features/admin/pages/OverflowTestPage'
import { ListDebugPage } from '../features/admin/pages/ListDebugPage'
import { MemberDuplicatesPage } from '../pages/admin/MemberDuplicatesPage'
import { BulkManagementPage } from '../features/admin/pages/BulkManagementPage'
import { OpenLearningIntegrationPage } from '../features/admin/pages/OpenLearningIntegrationPage'
import { CertificateBatchPage } from '../features/admin/pages/CertificateBatchPage'
import { CertificateTestPage } from '../features/admin/pages/CertificateTestPage'
import { PaymentHistoryPage } from '../features/membership/pages/PaymentHistoryPage'
import { WelcomeEmailPage } from '../features/admin/pages/WelcomeEmailPage'
import { MembershipApplicationsPage } from '../features/admin/pages/MembershipApplicationsPage'
import { JoinPage } from '../pages/public/JoinPage'
import { ReportBuilderPage } from '../features/admin/pages/ReportBuilderPage'
// import ScheduledReportsPage from '../features/admin/pages/ScheduledReportsPage' // Temporarily disabled
import { StandardReportsPage } from '../features/admin/pages/StandardReportsPage'
import OpenLearningSyncPage from '../features/admin/pages/OpenLearningSyncPage'
import EmailLogsPage from '../features/admin/pages/EmailLogsPage'
import OpenLearningSSOTestPage from '../features/admin/pages/OpenLearningSSOTestPage'
import OpenLearningCoursesManagement from '../features/admin/pages/OpenLearningCoursesManagement'
import MemberImpersonationPage from '../features/admin/pages/MemberImpersonationPage'
import { SystemSettingsPage } from '../features/admin/pages/SystemSettingsPage'
import { InstitutionLinkPage } from '../features/institutions/pages/InstitutionLinkPage'
import { InstitutionLinkRequestsPage } from '../features/institutions/pages/InstitutionLinkRequestsPage'
import InstitutionCPDReportPage from '../features/admin/pages/InstitutionCPDReportPage'
import TestLogin from '../pages/TestLogin'
import DebugLogin from '../pages/DebugLogin'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuthStore()
  
  console.log('🟦 PROTECTED ROUTE: isLoading:', isLoading, 'user:', !!user)
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <MainLayout>{children}</MainLayout>
}

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuthStore()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      
      <Route 
        path="/forgot-password" 
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        } 
      />
      
      <Route 
        path="/signup" 
        element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        } 
      />
      
      <Route
        path="/join"
        element={<JoinPage />}
      />

      <Route
        path="/test-login"
        element={<TestLogin />}
      />

      <Route
        path="/debug-login"
        element={<DebugLogin />}
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Error Pages */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      
      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleBasedRoute permission="ACCESS_MEMBER_DASHBOARD">
              <DashboardPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      {/* Member Dashboard Route - accessible by all authenticated users */}
      <Route
        path="/member-dashboard"
        element={
          <ProtectedRoute>
            <MemberDashboard />
          </ProtectedRoute>
        }
      />
      
      {/* Membership Routes */}
      <Route
        path="/membership/payment-history"
        element={
          <ProtectedRoute>
            <PaymentHistoryPage />
          </ProtectedRoute>
        }
      />
      
      {/* CPD Routes */}
      <Route
        path="/cpd"
        element={
          <ProtectedRoute>
            <RoleBasedRoute permission="CREATE_CPD">
              <CPDPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/cpd/review"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper', 'Admin', 'InstitutionAdmin']}>
              <CPDReviewPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/cpd/settings"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <CPDSettingsPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/cpd/management"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['Admin', 'AdminSuper']}>
              <CPDManagementPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/cpd-categories"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <CPDCategoriesPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      {/* Events Routes */}
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <RoleBasedRoute permission="REGISTER_EVENT">
              <EventsListPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/events/:slug"
        element={
          <ProtectedRoute>
            <RoleBasedRoute permission="REGISTER_EVENT">
              <EventDetailsPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/my-registrations"
        element={
          <ProtectedRoute>
            <RoleBasedRoute permission="REGISTER_EVENT">
              <MyRegistrationsPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      {/* Profile Route */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Institution Linking */}
      <Route
        path="/institutions/link"
        element={
          <ProtectedRoute>
            <InstitutionLinkPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper', 'Admin', 'InstitutionAdmin']}>
              <AdminDashboard />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/members"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper', 'Admin', 'InstitutionAdmin']}>
              <MembersPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/membership"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <MembershipManagementPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/membership-fees"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <MembershipFeesPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/institutions"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <InstitutionsManagementPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/institution-links"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper', 'Admin', 'InstitutionAdmin']}>
              <InstitutionLinkRequestsPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/institution/cpd-report"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['InstitutionAdmin']}>
              <InstitutionCPDReportPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/openlearning"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper', 'Admin']}>
              <OpenLearningIntegrationPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/openlearning/sync"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper', 'Admin']}>
              <OpenLearningSyncPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/openlearning/sso-test"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper', 'Admin']}>
              <OpenLearningSSOTestPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/openlearning/courses"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper', 'Admin']}>
              <OpenLearningCoursesManagement />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/certificates"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper', 'Admin']}>
              <CertificateBatchPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/certificates/test"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper', 'Admin']}>
              <CertificateTestPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/import-activities"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper', 'Admin']}>
              <ActivityImportPageFixed />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/editor-test"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <EditorTestPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/rich-content-test"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <RichContentTestPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/wysiwyg-test"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <WysiwygTestPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/quill-debug"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <QuillDebugPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/overflow-test"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <OverflowTestPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/list-debug"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <ListDebugPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/import-system"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <CompleteImportPageFixed />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/events"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper', 'Admin']}>
              <AdminEventsPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/payments"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper', 'Admin']}>
              <PendingPaymentsPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/smtp-settings"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <SMTPSettingsPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/emailjs-config"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <EmailJSConfigPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/email-templates"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <EmailTemplatesPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/event-reminders"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <EventReminderSettingsPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/email-logs"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['Admin', 'AdminSuper']}>
              <EmailLogsPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/welcome-emails"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper', 'Admin']}>
              <WelcomeEmailPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/applications"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['Admin', 'AdminSuper']}>
              <MembershipApplicationsPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['Admin', 'AdminSuper']}>
              <ReportBuilderPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      {/* Temporarily disabled due to import issues
      <Route
        path="/admin/scheduled-reports"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['Admin', 'AdminSuper']}>
              <ScheduledReportsPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      */}
      <Route
        path="/admin/standard-reports"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['Admin', 'AdminSuper']}>
              <StandardReportsPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/membership-applications"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper', 'Admin']}>
              <MembershipApplicationsPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/setup-media"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <SetupMediaLibrary />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/duplicates"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <MemberDuplicatesPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/bulk-management"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <BulkManagementPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/member-impersonation"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <MemberImpersonationPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      {/* System Settings - SuperAdmin Only */}
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['AdminSuper']}>
              <SystemSettingsPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}