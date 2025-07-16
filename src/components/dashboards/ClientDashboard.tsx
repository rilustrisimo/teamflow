import { motion } from 'framer-motion'
import { useAppContext } from '../../context/AppContext'
import { 
  Clock, 
  FileText, 
  DollarSign,
  CheckCircle,
  Eye,
  Download,
  MessageSquare,
  Building,
  Calendar,
  BarChart3
} from 'lucide-react'

const ClientDashboard = () => {
  const { 
    timeEntries, 
    tasks, 
    projects, 
    currentUser 
  } = useAppContext()

  // Filter data for current client
  const myProjects = projects.filter(project => 
    project.client_id === currentUser?.company_name // This should be company_id when we have proper relations
  )
  
  const myTasks = tasks.filter(task => 
    myProjects.some(project => project.id === task.project_id)
  )
  
  const myTimeEntries = timeEntries.filter(entry => 
    myProjects.some(project => project.id === entry.project_id)
  )

  // Calculate client stats
  const totalHours = myTimeEntries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0) / 60
  const completedTasks = myTasks.filter(task => task.status === 'done').length
  const activeProjects = myProjects.filter(project => project.status === 'active').length
  const totalInvestment = 45000 // This would be calculated from actual invoices

  // Client stats
  const clientStats = [
    {
      label: 'Active Projects',
      value: activeProjects.toString(),
      icon: FileText,
      color: 'text-blue-500'
    },
    {
      label: 'Total Hours',
      value: `${totalHours.toFixed(1)}h`,
      icon: Clock,
      color: 'text-green-500'
    },
    {
      label: 'Completed Tasks',
      value: completedTasks.toString(),
      icon: CheckCircle,
      color: 'text-purple-500'
    },
    {
      label: 'Total Investment',
      value: `$${totalInvestment.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-orange-500'
    }
  ]

  // Recent activities
  const recentActivities = [
    { type: 'Task', message: 'Website redesign task completed', time: '2 hours ago', status: 'completed' },
    { type: 'Time', message: '4.5 hours logged on mobile app', time: '1 day ago', status: 'logged' },
    { type: 'Project', message: 'Q2 Campaign project updated', time: '2 days ago', status: 'updated' }
  ]

  // Upcoming milestones
  const upcomingMilestones = myProjects
    .filter(project => project.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Client Header */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Client Portal</h1>
            <p className="text-green-100 mt-1">Welcome back, {currentUser?.full_name}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Building className="w-8 h-8 text-green-200" />
            <div className="text-right">
              <p className="font-medium">{currentUser?.company_name || 'Company Name'}</p>
              <p className="text-sm text-green-200">Client Portal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Client Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {clientStats.map((stat, index) => (
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Eye className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">View Projects</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">Time Reports</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <Download className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-900">Download Invoices</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <MessageSquare className="w-5 h-5 text-orange-600" />
            <span className="font-medium text-orange-900">Messages</span>
          </button>
        </div>
      </div>

      {/* Projects & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Projects */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">My Projects</h2>
          <div className="space-y-4">
            {myProjects.slice(0, 4).map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    project.status === 'active' ? 'bg-green-500' :
                    project.status === 'completed' ? 'bg-blue-500' :
                    project.status === 'on-hold' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="text-sm text-gray-500">{project.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    project.status === 'active' ? 'bg-green-100 text-green-600' :
                    project.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                    project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {project.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'No due date'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.status === 'completed' ? 'bg-green-500' :
                  activity.status === 'logged' ? 'bg-blue-500' :
                  'bg-purple-500'
                }`}></div>
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

      {/* Upcoming Milestones */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Upcoming Milestones</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcomingMilestones.map((project) => (
            <div key={project.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{project.name}</h3>
                <Calendar className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-2">{project.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Due Date</span>
                <span className="text-sm font-medium text-gray-900">
                  {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'TBD'}
                </span>
              </div>
            </div>
          ))}
          {upcomingMilestones.length === 0 && (
            <div className="col-span-3 text-center py-8 text-gray-500">
              No upcoming milestones
            </div>
          )}
        </div>
      </div>

      {/* Project Progress Overview */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Project Progress Overview</h2>
        <div className="space-y-4">
          {myProjects.map((project) => {
            const projectTasks = myTasks.filter(task => task.project_id === project.id)
            const completedProjectTasks = projectTasks.filter(task => task.status === 'done')
            const progress = projectTasks.length > 0 ? (completedProjectTasks.length / projectTasks.length) * 100 : 0
            
            return (
              <div key={project.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{project.name}</h3>
                  <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                  <span>{completedProjectTasks.length} of {projectTasks.length} tasks completed</span>
                  <span>{myTimeEntries.filter(entry => entry.project_id === project.id)
                    .reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0) / 60}h logged</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ClientDashboard
