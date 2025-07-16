import React from 'react'
import { useAppContext } from '../context/AppContext'
import { AlertCircle, Shield, UserX, Lock } from 'lucide-react'

interface RoleBasedErrorProps {
  error: string
  action?: string
  showDetails?: boolean
}

const RoleBasedError: React.FC<RoleBasedErrorProps> = ({ 
  error, 
  action, 
  showDetails = false 
}) => {
  const { currentUser } = useAppContext()
  
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <UserX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Not Authenticated</h3>
          <p className="text-gray-500">Please log in to access this resource.</p>
        </div>
      </div>
    )
  }

  const getErrorIcon = () => {
    if (error.includes('permission') || error.includes('access')) {
      return <Shield className="w-8 h-8 text-red-500" />
    }
    if (error.includes('auth') || error.includes('login')) {
      return <Lock className="w-8 h-8 text-yellow-500" />
    }
    return <AlertCircle className="w-8 h-8 text-red-500" />
  }

  const getErrorMessage = () => {
    const { role } = currentUser
    
    if (error.includes('permission') || error.includes('access')) {
      switch (role) {
        case 'admin':
          return 'System error: Admin access should not be restricted. Please contact support.'
        case 'manager':
          return 'This feature is restricted to administrators only.'
        case 'team-member':
          return 'You don\'t have permission to access this feature. Contact your manager if you need access.'
        case 'client':
          return 'This feature is not available for client accounts. Please contact your account manager.'
        default:
          return 'Access denied. Please contact support.'
      }
    }
    
    if (error.includes('auth') || error.includes('login')) {
      return 'Your session has expired. Please log in again.'
    }
    
    return error
  }

  const getActionSuggestion = () => {
    const { role } = currentUser
    
    if (error.includes('permission') || error.includes('access')) {
      switch (role) {
        case 'manager':
          return 'Contact your system administrator for elevated permissions.'
        case 'team-member':
          return 'Contact your manager or administrator for access.'
        case 'client':
          return 'Contact your account manager for assistance.'
        default:
          return 'Contact support for help.'
      }
    }
    
    if (error.includes('auth') || error.includes('login')) {
      return 'Please refresh the page and log in again.'
    }
    
    return action || 'Please try again or contact support.'
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mb-4">
          {getErrorIcon()}
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {error.includes('permission') || error.includes('access') ? 'Access Restricted' : 'Error'}
        </h3>
        
        <p className="text-gray-600 mb-4">
          {getErrorMessage()}
        </p>
        
        <p className="text-sm text-gray-500 mb-6">
          {getActionSuggestion()}
        </p>
        
        {showDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Error Details</h4>
            <p className="text-sm text-gray-600 font-mono">
              {error}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              User Role: {currentUser.role} | User ID: {currentUser.id}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RoleBasedError
