import { motion } from 'framer-motion'
import { useAppContext } from '../../context/AppContext'
import { 
  Users, 
  FileText, 
  DollarSign,
  Clock,
  Settings,
  Shield,
  AlertCircle,
  CheckCircle,
  BarChart3
} from 'lucide-react'

const AdminDashboard = () => {
  const { 
    timeEntries, 
    tasks, 
    projects, 
    clients, 
    currentUser 
  } = useAppContext()

  // Admin-specific stats
  const adminStats = [
    {
      label: 'Total Users',
      value: '12', // This would come from user management
      icon: Users,
      color: 'text-blue-500'
    },
    {
      label: 'Active Projects',
      value: projects.filter(p => p.status === 'active').length.toString(),
      icon: FileText,
      color: 'text-green-500'
    },
    {
      label: 'Total Revenue',
      value: '$125,000', // Placeholder - will be calculated from invoices
      icon: DollarSign,
      color: 'text-purple-500'
    },
    {
      label: 'Total Hours',
      value: `${timeEntries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0) / 60}h`,
      icon: Clock,
      color: 'text-orange-500'
    }
  ]

  // Recent activities for admin overview
  const recentActivities = [
    { type: 'User', message: 'New user registered', time: '2 hours ago' },
    { type: 'Project', message: 'Project deadline approaching', time: '4 hours ago' },
    { type: 'Invoice', message: 'Payment received', time: '1 day ago' }
  ]

  // System health indicators
  const systemHealth = [
    { name: 'Database', status: 'healthy', color: 'text-green-500' },
    { name: 'Authentication', status: 'healthy', color: 'text-green-500' },
    { name: 'File Storage', status: 'healthy', color: 'text-green-500' },
    { name: 'Email Service', status: 'warning', color: 'text-yellow-500' }
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
          <button className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Manage Users</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">View Reports</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <Settings className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-900">System Settings</span>
          </button>
        </div>
      </div>

      {/* System Health & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">System Health</h2>
          <div className="space-y-3">
            {systemHealth.map((system) => (
              <div key={system.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{system.name}</span>
                <div className="flex items-center space-x-2">
                  {system.status === 'healthy' ? (
                    <CheckCircle className={`w-4 h-4 ${system.color}`} />
                  ) : (
                    <AlertCircle className={`w-4 h-4 ${system.color}`} />
                  )}
                  <span className={`text-sm font-medium ${system.color} capitalize`}>
                    {system.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">{activity.type}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
