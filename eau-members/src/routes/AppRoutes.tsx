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
import { MembersPage } from '../features/admin/pages/MembersPage'
import { MembershipManagementPage } from '../features/admin/pages/MembershipManagementPage'
import { InstitutionsManagementPage } from '../features/admin/pages/InstitutionsManagementPage'
import { ActivityImportPage } from '../features/admin/pages/ActivityImportPage'
import { CompleteImportPage } from '../features/admin/pages/CompleteImportPage'
import { ProfilePage } from '../features/profile/pages/ProfilePage'
import { CPDPage } from '../features/cpd/pages/CPDPage'
import { CPDReviewPage } from '../features/cpd/pages/CPDReviewPage'
import { CPDSettingsPage } from '../features/cpd/pages/CPDSettingsPage'
import { CPDManagementPage } from '../features/cpd/pages/CPDManagementPage'
import { EventsListPage } from '../features/events/pages/EventsListPage'
import { EventDetailsPage } from '../features/events/pages/EventDetailsPage'
import { MyRegistrationsPage } from '../features/events/pages/MyRegistrationsPage'
import { AdminEventsPage } from '../features/events/pages/AdminEventsPage'
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
            <RoleBasedRoute permission="ACCESS_ADMIN_DASHBOARD">
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
      
      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleBasedRoute permission="ACCESS_ADMIN_DASHBOARD">
              <AdminDashboard />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/members"
        element={
          <ProtectedRoute>
            <RoleBasedRoute permission="ACCESS_ADMIN_DASHBOARD">
              <MembersPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/membership"
        element={
          <ProtectedRoute>
            <RoleBasedRoute permission="ACCESS_ADMIN_DASHBOARD">
              <MembershipManagementPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/institutions"
        element={
          <ProtectedRoute>
            <RoleBasedRoute permission="ACCESS_ADMIN_DASHBOARD">
              <InstitutionsManagementPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/openlearning"
        element={
          <ProtectedRoute>
            <RoleBasedRoute permission="ACCESS_ADMIN_DASHBOARD">
              <OpenLearningIntegrationPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/import-activities"
        element={
          <ProtectedRoute>
            <RoleBasedRoute permission="ACCESS_ADMIN_DASHBOARD">
              <ActivityImportPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/editor-test"
        element={
          <ProtectedRoute>
            <RoleBasedRoute permission="ACCESS_ADMIN_DASHBOARD">
              <EditorTestPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/rich-content-test"
        element={
          <ProtectedRoute>
            <RoleBasedRoute permission="ACCESS_ADMIN_DASHBOARD">
              <RichContentTestPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/wysiwyg-test"
        element={
          <ProtectedRoute>
            <RoleBasedRoute permission="ACCESS_ADMIN_DASHBOARD">
              <WysiwygTestPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/quill-debug"
        element={
          <ProtectedRoute>
            <RoleBasedRoute permission="ACCESS_ADMIN_DASHBOARD">
              <QuillDebugPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/overflow-test"
        element={
          <ProtectedRoute>
            <RoleBasedRoute permission="ACCESS_ADMIN_DASHBOARD">
              <OverflowTestPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/list-debug"
        element={
          <ProtectedRoute>
            <RoleBasedRoute permission="ACCESS_ADMIN_DASHBOARD">
              <ListDebugPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/import-system"
        element={
          <ProtectedRoute>
            <RoleBasedRoute permission="ACCESS_ADMIN_DASHBOARD">
              <CompleteImportPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/events"
        element={
          <ProtectedRoute>
            <RoleBasedRoute permission="ACCESS_ADMIN_DASHBOARD">
              <AdminEventsPage />
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
        path="/admin/setup-media"
        element={
          <ProtectedRoute>
            <RoleBasedRoute permission="ACCESS_ADMIN_DASHBOARD">
              <SetupMediaLibrary />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/duplicates"
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['Admin', 'AdminSuper']}>
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
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}