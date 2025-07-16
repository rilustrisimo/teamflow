import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { hasPermission, getPermissionConfig, UserRole } from '../hooks/usePermissions'
import RoleBasedError from './RoleBasedError'

interface RoleBasedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  page?: string
  fallback?: React.ReactNode
  showError?: boolean
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ 
  children, 
  requiredRoles,
  page,
  fallback,
  showError = true
}) => {
  const { currentUser } = useAppContext()
  
  // Get permission config for the page if provided
  const permissionConfig = page ? getPermissionConfig(page) : null
  const roles = requiredRoles || permissionConfig?.roles || []
  const redirectPath = permissionConfig?.redirect || '/dashboard'
  
  // If user is not loaded yet, show loading
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Check if user has required role
  const hasRequiredRole = hasPermission(currentUser.role, roles)
  
  if (!hasRequiredRole) {
    // Show error component if requested
    if (showError) {
      return <RoleBasedError error="access denied" />
    }
    
    // Show fallback component if provided
    if (fallback) {
      return <>{fallback}</>
    }
    
    // Otherwise redirect to appropriate page
    return <Navigate to={redirectPath} replace />
  }
  
  return <>{children}</>
}

export default RoleBasedRoute
