import React from 'react'
import { useAppContext } from '../context/AppContext'
import { usePermissions } from '../hooks/usePermissions'
import { 
  Clock, 
  Users, 
  BarChart3, 
  FileText, 
  Settings,
  Building,
  Target,
  DollarSign,
  Home,
  TrendingUp,
  Calendar,
  Archive,
  Kanban
} from 'lucide-react'

export interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<any>
  color?: string
  badge?: string | number
  disabled?: boolean
  description?: string
}

export const useRoleBasedNavigation = () => {
  const { currentUser } = useAppContext()
  const permissions = usePermissions()
  
  if (!currentUser) return []
  
  const items: NavigationItem[] = []
  
  // Dashboard - Always available
  items.push({
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    color: 'text-blue-500',
    description: 'Overview and key metrics'
  })
  
  // Admin-specific navigation
  if (permissions.canAccessUserManagement) {
    items.push({
      id: 'users',
      label: 'User Management',
      icon: Users,
      color: 'text-purple-500',
      description: 'Manage team members and permissions'
    })
  }
  
  // Time Tracker - Team members and above
  if (permissions.canAccessTimeTracker) {
    items.push({
      id: 'timetracker',
      label: 'Time Tracker',
      icon: Clock,
      color: 'text-green-500',
      description: 'Track time and manage tasks'
    })
  }
  
  // Projects - Role-based access
  if (permissions.canAccessAllProjects) {
    items.push({
      id: 'projects',
      label: 'All Projects',
      icon: FileText,
      color: 'text-indigo-500',
      description: 'Manage all projects and tasks'
    })
  } else {
    items.push({
      id: 'projects',
      label: 'Projects',
      icon: FileText,
      color: 'text-indigo-500',
      description: 'View your assigned projects'
    })
  }
  
  // Tasks - Team members and above
  if (currentUser.role !== 'client') {
    items.push({
      id: 'tasks',
      label: currentUser.role === 'team-member' ? 'My Tasks' : 'Tasks',
      icon: Target,
      color: 'text-orange-500',
      description: 'Manage tasks and assignments'
    })
    
    // Task Board - Kanban-style board for drag & drop
    items.push({
      id: 'taskboard',
      label: 'Task Board',
      icon: Kanban,
      color: 'text-pink-500',
      description: currentUser.role === 'admin' || currentUser.role === 'manager' 
        ? 'Drag & drop task management for all team tasks'
        : 'Drag & drop task management (your tasks only)'
    })
  }
  
  // Clients - Admin and Manager only
  if (permissions.canAccessClients) {
    items.push({
      id: 'clients',
      label: 'Clients',
      icon: Building,
      color: 'text-teal-500',
      description: 'Manage client relationships'
    })
  }
  
  // Reports - All except clients get different access
  if (permissions.canAccessReports) {
    items.push({
      id: 'reports',
      label: currentUser.role === 'client' ? 'Time Reports' : 'Reports',
      icon: BarChart3,
      color: 'text-red-500',
      description: 'View analytics and reports'
    })
  }
  
  // Invoices - Admin, Manager, and Client
  if (permissions.canAccessInvoices) {
    items.push({
      id: 'invoices',
      label: 'Invoices',
      icon: DollarSign,
      color: 'text-yellow-500',
      description: currentUser.role === 'client' ? 'View your invoices' : 'Manage invoices'
    })
  }
  
  // Financial Dashboard - Admin and Manager only
  if (permissions.canAccessFinancialData) {
    items.push({
      id: 'financial',
      label: 'Financial',
      icon: TrendingUp,
      color: 'text-emerald-500',
      description: 'Financial overview and analytics'
    })
  }
  
  // Settings - Admin and Manager only
  if (permissions.canAccessSettings) {
    items.push({
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      color: 'text-gray-500',
      description: 'System settings and configuration'
    })
  }
  
  return items
}

export const getQuickActions = (role: string) => {
  const actions: NavigationItem[] = []
  
  switch (role) {
    case 'admin':
      actions.push(
        { id: 'create-user', label: 'Add User', icon: Users, color: 'text-blue-500' },
        { id: 'create-project', label: 'New Project', icon: FileText, color: 'text-green-500' },
        { id: 'generate-report', label: 'Generate Report', icon: BarChart3, color: 'text-purple-500' },
        { id: 'system-settings', label: 'System Settings', icon: Settings, color: 'text-gray-500' }
      )
      break
      
    case 'manager':
      actions.push(
        { id: 'create-project', label: 'New Project', icon: FileText, color: 'text-green-500' },
        { id: 'assign-task', label: 'Assign Task', icon: Target, color: 'text-orange-500' },
        { id: 'create-client', label: 'Add Client', icon: Building, color: 'text-teal-500' },
        { id: 'generate-invoice', label: 'Generate Invoice', icon: DollarSign, color: 'text-yellow-500' }
      )
      break
      
    case 'team-member':
      actions.push(
        { id: 'start-timer', label: 'Start Timer', icon: Clock, color: 'text-green-500' },
        { id: 'create-task', label: 'Create Task', icon: Target, color: 'text-orange-500' },
        { id: 'view-schedule', label: 'View Schedule', icon: Calendar, color: 'text-blue-500' },
        { id: 'time-report', label: 'Time Report', icon: BarChart3, color: 'text-purple-500' }
      )
      break
      
    case 'client':
      actions.push(
        { id: 'view-projects', label: 'View Projects', icon: FileText, color: 'text-indigo-500' },
        { id: 'time-reports', label: 'Time Reports', icon: Clock, color: 'text-green-500' },
        { id: 'view-invoices', label: 'View Invoices', icon: DollarSign, color: 'text-yellow-500' },
        { id: 'project-archive', label: 'Project Archive', icon: Archive, color: 'text-gray-500' }
      )
      break
      
    default:
      break
  }
  
  return actions
}
