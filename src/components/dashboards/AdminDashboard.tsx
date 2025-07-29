import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppContext } from '../../context/AppContext'
import { Users, FileText, DollarSign, Clock, Shield, BarChart3 } from 'lucide-react'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { 
    timeEntries, 
    tasks, 
    projects, 
    clients, 
    currentUser 
  } = useAppContext()

  // --- Total Users (from user management) ---
  // We'll fetch users from the AdminService like UserManagement.tsx
  const [users, setUsers] = useState<any[]>([])
  useEffect(() => {
    (async () => {
      try {
        const usersData = await import('../../lib/adminService').then(m => m.AdminService.getAllUsers())
        setUsers(usersData)
      } catch (e) {
        setUsers([])
      }
    })()
  }, [])

  // --- Active Projects (from Projects.tsx) ---
  const activeProjects = projects.filter(p => p.status === 'active' && !p.archived)

  // --- Total Revenue & Total Hours (from Clients.tsx) ---
  // Helper: getClientTotalHours
  const getClientTotalHours = (clientId: string) => {
    const clientProjects = projects.filter(p => p.client_id === clientId && !p.archived)
    const projectIds = clientProjects.map(p => p.id)
    const totalMinutes = timeEntries
      .filter(entry => projectIds.includes(entry.project_id || ''))
      .reduce((sum, entry) => sum + (entry.duration || entry.duration_minutes || 0), 0)
    return totalMinutes / 60
  }

  // Helper: getClientTotalRevenue
  const getClientTotalRevenue = (clientId: string) => {
    const clientProjects = projects.filter(p => p.client_id === clientId && !p.archived)
    const projectIds = clientProjects.map(p => p.id)
    return timeEntries
      .filter(entry => projectIds.includes(entry.project_id || ''))
      .reduce((sum, entry) => {
        const durationInHours = (entry.duration || entry.duration_minutes || 0) / 60
        const hourlyRate = entry.user_profile?.hourly_rate || 0
        return sum + (durationInHours * hourlyRate)
      }, 0)
  }

  // Calculate totals
  const totalUsers = users.length
  const totalRevenue = clients.reduce((sum, client) => sum + getClientTotalRevenue(client.id), 0)
  const totalHours = clients.reduce((sum, client) => sum + getClientTotalHours(client.id), 0)

  // Admin-specific stats
  const adminStats = [
    {
      label: 'Total Users',
      value: totalUsers.toString(),
      icon: Users,
      color: 'text-blue-500'
    },
    {
      label: 'Active Projects',
      value: activeProjects.length.toString(),
      icon: FileText,
      color: 'text-green-500'
    },
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-purple-500'
    },
    {
      label: 'Total Hours',
      value: `${totalHours.toFixed(1)}h`,
      icon: Clock,
      color: 'text-orange-500'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-blue-100 mt-1">System Overview & Management</p>
          </div>
          <div className="flex items-center space-x-4">
            <Shield className="w-8 h-8 text-blue-200" />
            <div className="text-right">
              <p className="font-medium">{currentUser?.full_name}</p>
              <p className="text-sm text-blue-200 capitalize">{currentUser?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-gray-50 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            onClick={() => navigate('/dashboard/users')}
          >
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Manage Users</span>
          </button>
          <button
            className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            onClick={() => navigate('/dashboard/reports')}
          >
            <BarChart3 className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">View Reports</span>
          </button>
        </div>
      </div>

      
      {/* Company Overview */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Company Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {projects.length}
            </div>
            <p className="text-gray-600">Total Projects</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {clients.length}
            </div>
            <p className="text-gray-600">Active Clients</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {tasks.length}
            </div>
            <p className="text-gray-600">Total Tasks</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
