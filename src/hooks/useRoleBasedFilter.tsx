import { useAppContext } from '../context/AppContext'
import { usePermissions } from '../hooks/usePermissions'

interface RoleBasedFilterProps {
  data: any[]
  filterType: 'projects' | 'tasks' | 'clients' | 'timeEntries' | 'invoices'
}

export const useRoleBasedFilter = ({ data, filterType }: RoleBasedFilterProps) => {
  const { currentUser } = useAppContext()

  if (!currentUser || !data) return []

  const { role } = currentUser
  const isAdmin = role === 'admin'
  const isManager = role === 'manager'
  const isTeamMember = role === 'team-member'
  const isClient = role === 'client'

  switch (filterType) {
    case 'projects':
      if (isAdmin || isManager) {
        return data // Admin and managers see all projects
      }
      if (isTeamMember) {
        // Team members see projects they're assigned to
        return data.filter(project => 
          project.assigned_to?.includes(currentUser.id) || 
          project.created_by === currentUser.id
        )
      }
      if (isClient) {
        // Clients see only their own projects
        return data.filter(project => 
          project.client_id === currentUser.company_name || 
          project.client_company === currentUser.company_name
        )
      }
      return []

    case 'tasks':
      if (isAdmin || isManager) {
        return data // Admin and managers see all tasks
      }
      if (isTeamMember) {
        // Team members see only their assigned tasks
        return data.filter(task => 
          task.assigned_to === currentUser.id || 
          task.created_by === currentUser.id
        )
      }
      if (isClient) {
        // Clients see tasks for their projects
        return data.filter(task => {
          // This would need to be joined with projects to check client ownership
          return task.project?.client_id === currentUser.company_name
        })
      }
      return []

    case 'clients':
      if (isAdmin || isManager) {
        return data // Admin and managers see all clients
      }
      if (isClient) {
        // Clients see only their own company information
        return data.filter(client => 
          client.company === currentUser.company_name
        )
      }
      return [] // Team members don't typically need client management access

    case 'timeEntries':
      if (isAdmin || isManager) {
        return data // Admin and managers see all time entries
      }
      if (isTeamMember) {
        // Team members see only their own time entries
        return data.filter(entry => entry.user_id === currentUser.id)
      }
      if (isClient) {
        // Clients see time entries for their projects
        return data.filter(entry => {
          // This would need to be joined with projects to check client ownership
          return entry.project?.client_id === currentUser.company_name
        })
      }
      return []

    case 'invoices':
      if (isAdmin || isManager) {
        return data // Admin and managers see all invoices
      }
      if (isClient) {
        // Clients see only their own invoices
        return data.filter(invoice => 
          invoice.client_id === currentUser.company_name ||
          invoice.client_company === currentUser.company_name
        )
      }
      return [] // Team members don't typically access invoices

    default:
      return data
  }
}

// Hook for filtering specific data types
export const useFilteredProjects = () => {
  const { projects } = useAppContext()
  return useRoleBasedFilter({ data: projects, filterType: 'projects' })
}

export const useFilteredTasks = () => {
  const { tasks } = useAppContext()
  return useRoleBasedFilter({ data: tasks, filterType: 'tasks' })
}

export const useFilteredClients = () => {
  const { clients } = useAppContext()
  return useRoleBasedFilter({ data: clients, filterType: 'clients' })
}

export const useFilteredTimeEntries = () => {
  const { timeEntries } = useAppContext()
  return useRoleBasedFilter({ data: timeEntries, filterType: 'timeEntries' })
}

export const useFilteredInvoices = () => {
  // For now, return empty array until invoices are added to AppContext
  return []
  // const { invoices } = useAppContext()
  // return useRoleBasedFilter({ data: invoices || [], filterType: 'invoices' })
}

// Component wrapper for conditional rendering based on permissions
interface ConditionalRenderProps {
  condition: keyof ReturnType<typeof usePermissions>
  fallback?: React.ReactNode
  children: React.ReactNode
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({ 
  condition, 
  fallback, 
  children 
}) => {
  const permissions = usePermissions()
  
  if (permissions[condition]) {
    return <>{children}</>
  }
  
  return fallback ? <>{fallback}</> : null
}

// Role-based action wrapper
interface RoleBasedActionProps {
  requiredPermission: keyof ReturnType<typeof usePermissions>
  onAction: () => void
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const RoleBasedAction: React.FC<RoleBasedActionProps> = ({
  requiredPermission,
  onAction,
  children,
  fallback
}) => {
  const permissions = usePermissions()
  
  if (permissions[requiredPermission]) {
    return (
      <div onClick={onAction} style={{ cursor: 'pointer' }}>
        {children}
      </div>
    )
  }
  
  return fallback ? <>{fallback}</> : null
}
