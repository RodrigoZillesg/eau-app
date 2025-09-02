export type UserRole = 
  | 'Admin'
  | 'AdminSuper'
  | 'Affiliates'
  | 'BoardMembers'
  | 'ConsultantsAgents'
  | 'MemberColleges'
  | 'Members'
  | 'Openlearning'
  | 'Public'

export const PERMISSIONS = {
  // CPD Management
  CREATE_CPD: ['Admin', 'AdminSuper', 'Members', 'MemberColleges', 'ConsultantsAgents', 'BoardMembers'],
  APPROVE_CPD: ['Admin', 'AdminSuper'],
  VIEW_ALL_CPDS: ['Admin', 'AdminSuper'],
  
  // Event Management
  CREATE_EVENT: ['Admin', 'AdminSuper'],
  EDIT_EVENT: ['Admin', 'AdminSuper'],
  DELETE_EVENT: ['Admin', 'AdminSuper'],
  REGISTER_EVENT: ['Admin', 'AdminSuper', 'Members', 'MemberColleges', 'ConsultantsAgents', 'BoardMembers', 'Affiliates'],
  
  // User Management
  MANAGE_USERS: ['AdminSuper'],
  ASSIGN_ROLES: ['AdminSuper'],
  VIEW_USER_REPORTS: ['Admin', 'AdminSuper'],
  
  // Dashboard Access
  ACCESS_ADMIN_DASHBOARD: ['Admin', 'AdminSuper'],
  ACCESS_MEMBER_DASHBOARD: ['Admin', 'AdminSuper', 'Members', 'MemberColleges', 'ConsultantsAgents', 'BoardMembers', 'Affiliates'],
  ACCESS_PUBLIC_CONTENT: ['Public', 'Openlearning', 'Admin', 'AdminSuper', 'Members', 'MemberColleges', 'ConsultantsAgents', 'BoardMembers', 'Affiliates'],
} as const

export type Permission = keyof typeof PERMISSIONS