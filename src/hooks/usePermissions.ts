import { useAppContext } from '../context/AppContext'

export type UserRole = 'admin' | 'manager' | 'team-member' | 'client'

interface PermissionConfig {
  roles: UserRole[]
  redirect?: string
}

interface Permissions {
  // Navigation permissions
  canAccessUserManagement: boolean
  canAccessAllProjects: boolean
  canAccessFinancialData: boolean
  canAccessReports: boolean
  canAccessSettings: boolean
  canAccessTimeTracker: boolean
  canAccessInvoices: boolean
  canAccessClients: boolean
  
  // Action permissions
  canCreateProjects: boolean
  canEditProjects: boolean
  canDeleteProjects: boolean
  canCreateTasks: boolean
  canEditTasks: boolean
  canDeleteTasks: boolean
  canCreateClients: boolean
  canEditClients: boolean
  canDeleteClients: boolean
  canManageUsers: boolean
  canViewAllTimeEntries: boolean
  canEditTimeEntries: boolean
  canGenerateInvoices: boolean
  canViewFinancialReports: boolean
  canManageSettings: boolean
  
  // Data access permissions
  canViewUserProfiles: boolean
  canEditUserProfiles: boolean
  canViewAllTasks: boolean
  canViewOwnTasks: boolean
  canViewClientData: boolean
}

export const usePermissions = (): Permissions => {
  const { currentUser } = useAppContext()
  
  if (!currentUser) {
    // Return default permissions for unauthenticated users
    return {
      canAccessUserManagement: false,
      canAccessAllProjects: false,
      canAccessFinancialData: false,
      canAccessReports: false,
      canAccessSettings: false,
      canAccessTimeTracker: false,
      canAccessInvoices: false,
      canAccessClients: false,
      canCreateProjects: false,
      canEditProjects: false,
      canDeleteProjects: false,
      canCreateTasks: false,
      canEditTasks: false,
      canDeleteTasks: false,
      canCreateClients: false,
      canEditClients: false,
      canDeleteClients: false,
      canManageUsers: false,
      canViewAllTimeEntries: false,
      canEditTimeEntries: false,
      canGenerateInvoices: false,
      canViewFinancialReports: false,
      canManageSettings: false,
      canViewUserProfiles: false,
      canEditUserProfiles: false,
      canViewAllTasks: false,
      canViewOwnTasks: false,
      canViewClientData: false
    }
  }

  const { role } = currentUser

  const isAdmin = role === 'admin'
  const isManager = role === 'manager'
  const isTeamMember = role === 'team-member'
  const isClient = role === 'client'

  return {
    // Navigation permissions
    canAccessUserManagement: isAdmin,
    canAccessAllProjects: isAdmin || isManager,
    canAccessFinancialData: isAdmin || isManager,
    canAccessReports: isAdmin || isManager || isTeamMember,
    canAccessSettings: isAdmin || isManager,
    canAccessTimeTracker: isAdmin || isManager || isTeamMember,
    canAccessInvoices: isAdmin || isManager || isClient,
    canAccessClients: isAdmin || isManager,
    
    // Action permissions
    canCreateProjects: isAdmin || isManager,
    canEditProjects: isAdmin || isManager,
    canDeleteProjects: isAdmin,
    canCreateTasks: isAdmin || isManager,
    canEditTasks: isAdmin || isManager || isTeamMember,
    canDeleteTasks: isAdmin || isManager,
    canCreateClients: isAdmin || isManager,
    canEditClients: isAdmin || isManager,
    canDeleteClients: isAdmin,
    canManageUsers: isAdmin,
    canViewAllTimeEntries: isAdmin || isManager,
    canEditTimeEntries: isAdmin || isManager || isTeamMember,
    canGenerateInvoices: isAdmin || isManager,
    canViewFinancialReports: isAdmin || isManager,
    canManageSettings: isAdmin || isManager,
    
    // Data access permissions
    canViewUserProfiles: isAdmin || isManager,
    canEditUserProfiles: isAdmin,
    canViewAllTasks: isAdmin || isManager,
    canViewOwnTasks: true, // All authenticated users can view their own tasks
    canViewClientData: isAdmin || isManager || isClient
  }
}

export const hasPermission = (userRole: UserRole | null, requiredRoles: UserRole[]): boolean => {
  if (!userRole) return false
  return requiredRoles.includes(userRole)
}

export const getPermissionConfig = (page: string): PermissionConfig => {
  const configs: Record<string, PermissionConfig> = {
    'user-management': {
      roles: ['admin'],
      redirect: '/dashboard'
    },
    'all-projects': {
      roles: ['admin', 'manager'],
      redirect: '/dashboard'
    },
    'financial': {
      roles: ['admin', 'manager'],
      redirect: '/dashboard'
    },
    'settings': {
      roles: ['admin', 'manager'],
      redirect: '/dashboard'
    },
    'time-tracker': {
      roles: ['admin', 'manager', 'team-member'],
      redirect: '/dashboard'
    },
    'reports': {
      roles: ['admin', 'manager', 'team-member'],
      redirect: '/dashboard'
    },
    'invoices': {
      roles: ['admin', 'manager', 'client'],
      redirect: '/dashboard'
    },
    'clients': {
      roles: ['admin', 'manager'],
      redirect: '/dashboard'
    }
  }
  
  return configs[page] || { roles: ['admin', 'manager', 'team-member', 'client'] }
}
