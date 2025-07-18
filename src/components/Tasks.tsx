import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import { Plus, Calendar, Link, Video, User, X, Trash2, Eye } from 'lucide-react'

const Tasks = () => {
  const { 
    tasks, 
    addTask, 
    updateTask, 
    deleteTask,
    projects, 
    teamMembers
  } = useAppContext()

  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showTaskDetails, setShowTaskDetails] = useState(false)
  const [filter, setFilter] = useState('all')
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    assigned_to: '',
    project_id: '',
    deliverable_link: '',
    video_link: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  })

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    return task.status === filter
  })

  // Get project name for a task
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return project ? project.name : 'No Project'
  }

  // Get team member name
  const getTeamMemberName = (userId: string) => {
    const member = teamMembers.find(m => m.id === userId)
    return member ? member.full_name : 'Unassigned'
  }

  // Create new task
  const createNewTask = async () => {
    if (!newTask.title) {
      alert('Please provide a task title')
      return
    }

    try {
      await addTask({
        title: newTask.title,
        description: newTask.description,
        due_date: newTask.due_date || null,
        assigned_to: newTask.assigned_to || null,
        project_id: newTask.project_id || null,
        deliverable_link: newTask.deliverable_link || null,
        video_link: newTask.video_link || null,
        priority: newTask.priority,
        status: 'todo'
      })

      setNewTask({
        title: '',
        description: '',
        due_date: '',
        assigned_to: '',
        project_id: '',
        deliverable_link: '',
        video_link: '',
        priority: 'medium'
      })
      setShowNewTaskModal(false)
      setNotification({ type: 'success', message: 'Task created successfully!' })
    } catch (error) {
      console.error('Error creating task:', error)
      setNotification({ type: 'error', message: 'Error creating task. Please try again.' })
    }
  }

  // Update task status
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await updateTask(taskId, { status: newStatus })
      setNotification({ type: 'success', message: 'Task status updated!' })
    } catch (error) {
      console.error('Error updating task:', error)
      setNotification({ type: 'error', message: 'Error updating task. Please try again.' })
    }
  }

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId)
        setNotification({ type: 'success', message: 'Task deleted successfully!' })
      } catch (error) {
        console.error('Error deleting task:', error)
        setNotification({ type: 'error', message: 'Error deleting task. Please try again.' })
      }
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800'
      case 'inprogress': return 'bg-blue-100 text-blue-800'
      case 'review': return 'bg-yellow-100 text-yellow-800'
      case 'done': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">Manage and track your tasks</p>
        </div>
        <button
          onClick={() => setShowNewTaskModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg ${
          notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Filters */}
      <div className="flex space-x-2">
        {['all', 'todo', 'inprogress', 'review', 'done'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === filterOption
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filterOption === 'all' ? 'All' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </button>
        ))}
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 line-clamp-2">{task.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{getProjectName(task.project_id)}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedTask(task)
                    setShowTaskDetails(true)
                  }}
                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {task.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{task.description}</p>
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{getTeamMemberName(task.assigned_to)}</span>
              </div>
              {task.due_date && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(task.due_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Status Update Buttons */}
            <div className="mt-4 flex space-x-2">
              {task.status !== 'done' && (
                <button
                  onClick={() => updateTaskStatus(task.id, 'done')}
                  className="flex-1 bg-green-50 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-100 transition-colors"
                >
                  Mark Done
                </button>
              )}
              {task.status !== 'inprogress' && task.status !== 'done' && (
                <button
                  onClick={() => updateTaskStatus(task.id, 'inprogress')}
                  className="flex-1 bg-blue-50 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-100 transition-colors"
                >
                  Start
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Calendar className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first task</p>
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Task
          </button>
        </div>
      )}

      {/* Add Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Add New Task</h2>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select
                  value={newTask.project_id}
                  onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select team member</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>{member.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createNewTask}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{selectedTask.title}</h2>
              <button
                onClick={() => setShowTaskDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(selectedTask.priority)}`}>
                  {selectedTask.priority} Priority
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedTask.status)}`}>
                  {selectedTask.status}
                </span>
              </div>

              {selectedTask.description && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{selectedTask.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Project</h4>
                  <p className="text-gray-700">{getProjectName(selectedTask.project_id)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Assigned To</h4>
                  <p className="text-gray-700">{getTeamMemberName(selectedTask.assigned_to)}</p>
                </div>
                {selectedTask.due_date && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Due Date</h4>
                    <p className="text-gray-700">{new Date(selectedTask.due_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {(selectedTask.deliverable_link || selectedTask.video_link) && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Links</h4>
                  <div className="space-y-2">
                    {selectedTask.deliverable_link && (
                      <div className="flex items-center space-x-2">
                        <Link className="w-4 h-4 text-gray-500" />
                        <a
                          href={selectedTask.deliverable_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Deliverable Link
                        </a>
                      </div>
                    )}
                    {selectedTask.video_link && (
                      <div className="flex items-center space-x-2">
                        <Video className="w-4 h-4 text-gray-500" />
                        <a
                          href={selectedTask.video_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Video Link
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tasks
