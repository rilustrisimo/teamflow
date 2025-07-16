import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAppContext } from '../context/AppContext'
import { useRoleBasedNavigation } from '../hooks/useRoleBasedNavigation'
import RoleBasedRoute from '../components/RoleBasedRoute'
import AdminDashboard from '../components/dashboards/AdminDashboard'
import TeamMemberDashboard from '../components/dashboards/TeamMemberDashboard'
import ClientDashboard from '../components/dashboards/ClientDashboard'
import UserManagement from '../components/admin/UserManagement'
import TimeTracker from '../components/TimeTracker'
import ProjectBoard from '../components/ProjectBoard'
import Reports from '../components/Reports'
import Invoices from '../components/Invoices'
import Clients from '../components/Clients'
import FinancialDashboard from '../components/FinancialDashboard'
import { 
  Bell,
  Search,
  LogOut,
  Menu,
  X
} from 'lucide-react'

const Dashboard = () => {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { currentUser } = useAppContext()
  const navigationItems = useRoleBasedNavigation()
  
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Handle sign out
  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  // Render the appropriate dashboard based on user role
  const renderDashboardContent = () => {
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

    switch (activeTab) {
      case 'dashboard':
        switch (currentUser.role) {
          case 'admin':
            return <AdminDashboard />
          case 'team-member':
            return <TeamMemberDashboard />
          case 'client':
            return <ClientDashboard />
          default:
            return <div>Unknown role</div>
        }
      
      case 'users':
        return (
          <RoleBasedRoute page="user-management">
            <UserManagement />
          </RoleBasedRoute>
        )
      
      case 'timetracker':
        return (
          <RoleBasedRoute page="time-tracker">
            <TimeTracker />
          </RoleBasedRoute>
        )
      
      case 'tasks':
      case 'projects':
        return <ProjectBoard />
      
      case 'reports':
        return (
          <RoleBasedRoute page="reports">
            <Reports />
          </RoleBasedRoute>
        )
      
      case 'invoices':
        return (
          <RoleBasedRoute page="invoices">
            <Invoices />
          </RoleBasedRoute>
        )
      
      case 'clients':
        return (
          <RoleBasedRoute page="clients">
            <Clients />
          </RoleBasedRoute>
        )
      
      case 'financial':
        return (
          <RoleBasedRoute page="financial">
            <FinancialDashboard />
          </RoleBasedRoute>
        )
      
      case 'settings':
        return (
          <RoleBasedRoute page="settings">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Settings</h2>
              <p className="text-gray-500">Settings interface will be implemented here.</p>
            </div>
          </RoleBasedRoute>
        )
      
      default:
        return <div>Page not found</div>
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-50 flex-shrink-0 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">TeamFlow</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {currentUser?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{currentUser?.full_name || 'User'}</p>
                <p className="text-sm text-gray-500 capitalize">{currentUser?.role || 'Role'}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900 capitalize">
                {activeTab === 'dashboard' ? `${currentUser?.role || 'User'} Dashboard` : activeTab}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <Search className="w-5 h-5 text-gray-500" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <Bell className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {renderDashboardContent()}
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default Dashboard
