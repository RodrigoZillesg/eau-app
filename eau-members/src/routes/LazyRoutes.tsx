import React, { lazy } from 'react';

// Lazy load all admin pages
export const AdminDashboard = lazy(() =>
  import('../features/admin/components/AdminDashboard').then(m => ({ default: m.AdminDashboard }))
);

export const MembersPage = lazy(() =>
  import('../features/admin/pages/MembersPage').then(m => ({ default: m.MembersPage }))
);

export const MembershipManagementPage = lazy(() =>
  import('../features/admin/pages/MembershipManagementPage').then(m => ({ default: m.MembershipManagementPage }))
);

export const MembershipFeesPage = lazy(() =>
  import('../features/admin/pages/MembershipFeesPage').then(m => ({ default: m.MembershipFeesPage }))
);

export const InstitutionsManagementPage = lazy(() =>
  import('../features/admin/pages/InstitutionsManagementPage').then(m => ({ default: m.InstitutionsManagementPage }))
);

export const ActivityImportPage = lazy(() =>
  import('../features/admin/pages/ActivityImportPage').then(m => ({ default: m.ActivityImportPage }))
);

export const CompleteImportPage = lazy(() =>
  import('../features/admin/pages/CompleteImportPage').then(m => ({ default: m.CompleteImportPage }))
);

export const AdminEventsPage = lazy(() =>
  import('../features/events/pages/AdminEventsPage').then(m => ({ default: m.AdminEventsPage }))
);

export const SMTPSettingsPage = lazy(() =>
  import('../features/admin/pages/SMTPSettingsPage').then(m => ({ default: m.SMTPSettingsPage }))
);

export const EmailTemplatesPage = lazy(() =>
  import('../features/admin/pages/EmailTemplatesPage').then(m => ({ default: m.EmailTemplatesPage }))
);

export const EventReminderSettingsPage = lazy(() =>
  import('../features/admin/pages/EventReminderSettingsPage').then(m => ({ default: m.EventReminderSettingsPage }))
);

export const EmailLogsPage = lazy(() =>
  import('../features/admin/pages/EmailLogsPage').then(m => ({ default: m.EmailLogsPage }))
);

export const CertificateBatchPage = lazy(() =>
  import('../features/admin/pages/CertificateBatchPage').then(m => ({ default: m.CertificateBatchPage }))
);

export const CertificateTestPage = lazy(() =>
  import('../features/admin/pages/CertificateTestPage').then(m => ({ default: m.CertificateTestPage }))
);

export const WelcomeEmailPage = lazy(() =>
  import('../features/admin/pages/WelcomeEmailPage').then(m => ({ default: m.WelcomeEmailPage }))
);

export const MembershipApplicationsPage = lazy(() =>
  import('../features/admin/pages/MembershipApplicationsPage').then(m => ({ default: m.MembershipApplicationsPage }))
);

export const ReportBuilderPage = lazy(() =>
  import('../features/admin/pages/ReportBuilderPage').then(m => ({ default: m.ReportBuilderPage }))
);

export const StandardReportsPage = lazy(() =>
  import('../features/admin/pages/StandardReportsPage').then(m => ({ default: m.StandardReportsPage }))
);

export const OpenLearningIntegrationPage = lazy(() =>
  import('../features/admin/pages/OpenLearningIntegrationPage').then(m => ({ default: m.OpenLearningIntegrationPage }))
);

export const OpenLearningSyncPage = lazy(() =>
  import('../features/admin/pages/OpenLearningSyncPage')
);

export const OpenLearningSSOTestPage = lazy(() =>
  import('../features/admin/pages/OpenLearningSSOTestPage')
);

export const BulkManagementPage = lazy(() =>
  import('../features/admin/pages/BulkManagementPage').then(m => ({ default: m.BulkManagementPage }))
);

// Lazy load CPD pages
export const CPDPage = lazy(() =>
  import('../features/cpd/pages/CPDPage').then(m => ({ default: m.CPDPage }))
);

export const CPDReviewPage = lazy(() =>
  import('../features/cpd/pages/CPDReviewPage').then(m => ({ default: m.CPDReviewPage }))
);

export const CPDSettingsPage = lazy(() =>
  import('../features/cpd/pages/CPDSettingsPage').then(m => ({ default: m.CPDSettingsPage }))
);

export const CPDManagementPage = lazy(() =>
  import('../features/cpd/pages/CPDManagementPage').then(m => ({ default: m.CPDManagementPage }))
);

// Lazy load Events pages
export const EventsListPage = lazy(() =>
  import('../features/events/pages/EventsListPage').then(m => ({ default: m.EventsListPage }))
);

export const EventDetailsPage = lazy(() =>
  import('../features/events/pages/EventDetailsPage').then(m => ({ default: m.EventDetailsPage }))
);

export const MyRegistrationsPage = lazy(() =>
  import('../features/events/pages/MyRegistrationsPage').then(m => ({ default: m.MyRegistrationsPage }))
);

// Lazy load test pages
export const EditorTestPage = lazy(() =>
  import('../features/admin/pages/EditorTestPage').then(m => ({ default: m.EditorTestPage }))
);

export const RichContentTestPage = lazy(() =>
  import('../features/admin/pages/RichContentTestPage').then(m => ({ default: m.RichContentTestPage }))
);

export const WysiwygTestPage = lazy(() =>
  import('../features/admin/pages/WysiwygTestPage').then(m => ({ default: m.WysiwygTestPage }))
);

export const QuillDebugPage = lazy(() =>
  import('../features/admin/pages/QuillDebugPage').then(m => ({ default: m.QuillDebugPage }))
);

export const OverflowTestPage = lazy(() =>
  import('../features/admin/pages/OverflowTestPage').then(m => ({ default: m.OverflowTestPage }))
);

export const ListDebugPage = lazy(() =>
  import('../features/admin/pages/ListDebugPage').then(m => ({ default: m.ListDebugPage }))
);

// Lazy load other pages
export const MemberDuplicatesPage = lazy(() =>
  import('../pages/admin/MemberDuplicatesPage').then(m => ({ default: m.MemberDuplicatesPage }))
);

export const SetupMediaLibrary = lazy(() =>
  import('../pages/admin/SetupMediaLibrary').then(m => ({ default: m.SetupMediaLibrary }))
);

export const EmailJSConfigPage = lazy(() =>
  import('../features/admin/pages/EmailJSConfigPage')
);

export const PaymentHistoryPage = lazy(() =>
  import('../features/membership/pages/PaymentHistoryPage').then(m => ({ default: m.PaymentHistoryPage }))
);

export const ProfilePage = lazy(() =>
  import('../features/profile/pages/ProfilePage').then(m => ({ default: m.ProfilePage }))
);