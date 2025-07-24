import { motion } from 'framer-motion'
import { useAppContext } from '../../context/AppContext'
import { 
  Clock, 
  CheckSquare, 
  FileText, 
  Play,
  Pause,
  Target,
  TrendingUp,
  Calendar,
  User
} from 'lucide-react'

const TeamMemberDashboard = () => {
  const { 
    timeEntries, 
    tasks, 
    projects, 
    currentUser,
    timer,
    startTimer,
    stopTimer
  } = useAppContext()

  // Filter data for current user (excluding archived)
  const myTimeEntries = timeEntries.filter(entry => entry.user_id === currentUser?.id)
  const myTasks = tasks.filter(task => task.assigned_to === currentUser?.id && !task.archived)
  const myProjects = projects.filter(project => 
    !project.archived &&
    tasks.some(task => task.project_id === project.id && task.assigned_to === currentUser?.id && !task.archived)
  )

  // Calculate personal stats
  const todayEntries = myTimeEntries.filter(entry => {
    const today = new Date().toISOString().split('T')[0]
    return entry.start_time.split('T')[0] === today
  })

  const todayHours = todayEntries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0) / 60
  const weeklyHours = myTimeEntries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0) / 60
  const completedTasks = myTasks.filter(task => task.status === 'done').length
  const activeTasks = myTasks.filter(task => task.status === 'inprogress').length

  // Personal stats
  const personalStats = [
    {
      label: 'Today\'s Hours',
      value: `${todayHours.toFixed(1)}h`,
      icon: Clock,
      color: 'text-blue-500'
    },
    {
      label: 'Active Tasks',
      value: activeTasks.toString(),
      icon: CheckSquare,
      color: 'text-orange-500'
    },
    {
      label: 'Completed',
      value: completedTasks.toString(),
      icon: Target,
      color: 'text-green-500'
    },
    {
      label: 'Weekly Hours',
      value: `${weeklyHours.toFixed(1)}h`,
      icon: TrendingUp,
      color: 'text-purple-500'
    }
  ]

  // Today's tasks
  const todaysTasks = myTasks
    .filter(task => task.status !== 'done')
    .slice(0, 5)

  // Current timer info
  const currentTask = timer.selectedTask ? tasks.find(t => t.id === timer.selectedTask) : null
  const currentProject = currentTask ? projects.find(p => p.id === currentTask.project_id) : null

  // Format timer display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Personal Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {currentUser?.full_name}</h1>
            <p className="text-blue-100 mt-1">Your personal workspace</p>
          </div>
          <div className="flex items-center space-x-4">
            <User className="w-8 h-8 text-blue-200" />
            <div className="text-right">
              <p className="font-medium">{currentUser?.full_name}</p>
              <p className="text-sm text-blue-200 capitalize">{currentUser?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Timer */}
      {timer.isTracking && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium text-gray-900">Currently tracking</p>
                <p className="text-sm text-gray-600">
                  {currentTask?.title || 'No task selected'} 
                  {currentProject && ` • ${currentProject.name}`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-mono font-bold text-green-600">
                  {formatTime(timer.currentTime)}
                </div>
                <p className="text-sm text-gray-500">Active time</p>
              </div>
              <button
                onClick={stopTimer}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Pause className="w-4 h-4" />
                <span>Stop</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Personal Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {personalStats.map((stat, index) => (
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

      {/* Today's Tasks & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Today's Tasks</h2>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {todaysTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tasks for today</p>
            ) : (
              todaysTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      task.status === 'todo' ? 'bg-gray-400' :
                      task.status === 'inprogress' ? 'bg-blue-500' :
                      task.status === 'review' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-500">{task.project?.name || 'No project'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.priority === 'high' ? 'bg-red-100 text-red-600' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {task.priority}
                    </span>
                    <button 
                      onClick={() => startTimer()}
                      className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <Play className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Start New Timer</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <FileText className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">View My Reports</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <CheckSquare className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">My Task Board</span>
            </button>
          </div>
        </div>
      </div>

      {/* My Projects */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">My Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myProjects.slice(0, 6).map((project) => (
            <div key={project.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{project.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  project.status === 'active' ? 'bg-green-100 text-green-600' :
                  project.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                  project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {project.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{project.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {myTasks.filter(t => t.project_id === project.id).length} tasks
                </span>
                <span className="text-gray-500">
                  {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'No due date'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TeamMemberDashboard
