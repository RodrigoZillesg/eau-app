export type UserRole =
  | 'AdminSuper'        // Developer - full access including technical settings
  | 'Admin'             // System owner - all business functions, no technical settings
  | 'InstitutionAdmin'  // Institution admin - only their institution's data
  | 'Members'           // Regular members - only their own data
  | 'Affiliates'
  | 'BoardMembers'
  | 'ConsultantsAgents'
  | 'MemberColleges'
  | 'Openlearning'
  | 'Public'

export const PERMISSIONS = {
  // CPD Management
  CREATE_CPD: ['Admin', 'AdminSuper', 'InstitutionAdmin', 'Members', 'MemberColleges', 'ConsultantsAgents', 'BoardMembers'],
  APPROVE_CPD: ['Admin', 'AdminSuper', 'InstitutionAdmin'], // Institution admin can approve for their institution
  VIEW_ALL_CPDS: ['Admin', 'AdminSuper'], // Only Admin and SuperAdmin see ALL CPDs
  VIEW_INSTITUTION_CPDS: ['InstitutionAdmin'], // Institution admin sees only their institution's CPDs

  // Event Management
  CREATE_EVENT: ['Admin', 'AdminSuper'], // InstitutionAdmin will be controlled by system settings
  EDIT_EVENT: ['Admin', 'AdminSuper', 'InstitutionAdmin'], // Can edit their own events
  DELETE_EVENT: ['Admin', 'AdminSuper'], // Only Admin+ can delete
  REGISTER_EVENT: ['Admin', 'AdminSuper', 'InstitutionAdmin', 'Members', 'MemberColleges', 'ConsultantsAgents', 'BoardMembers', 'Affiliates'],

  // User Management
  MANAGE_USERS: ['Admin', 'AdminSuper'], // InstitutionAdmin manages through their institution view
  ASSIGN_ROLES: ['AdminSuper'], // Only SuperAdmin assigns roles
  VIEW_USER_REPORTS: ['Admin', 'AdminSuper'],

  // Technical Settings (SuperAdmin only)
  MANAGE_SYSTEM_SETTINGS: ['AdminSuper'],
  MANAGE_SMTP_SETTINGS: ['AdminSuper'],
  BULK_OPERATIONS: ['AdminSuper'],
  IMPORT_EXPORT: ['AdminSuper'],

  // Dashboard Access
  ACCESS_ADMIN_DASHBOARD: ['Admin', 'AdminSuper', 'InstitutionAdmin'],
  ACCESS_MEMBER_DASHBOARD: ['Admin', 'AdminSuper', 'InstitutionAdmin', 'Members', 'MemberColleges', 'ConsultantsAgents', 'BoardMembers', 'Affiliates'],
  ACCESS_PUBLIC_CONTENT: ['Public', 'Openlearning', 'Admin', 'AdminSuper', 'InstitutionAdmin', 'Members', 'MemberColleges', 'ConsultantsAgents', 'BoardMembers', 'Affiliates'],
} as const

export type Permission = keyof typeof PERMISSIONS