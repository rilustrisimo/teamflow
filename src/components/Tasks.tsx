import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import { Plus, Calendar, Link, Video, User, Trash2, Eye, Edit, Loader2, Search, Filter, SortAsc, Grid, List, X } from 'lucide-react'

// Task Card Component
interface TaskCardProps {
  task: any
  viewMode: 'grid' | 'list'
  onEdit: (task: any) => void
  onDelete: (taskId: string) => void
  onStatusChange: (taskId: string, newStatus: string) => void
  onView: (task: any) => void
  getProjectName: (projectId: string) => string
  getTeamMemberName: (userId: string) => string
  getPriorityColor: (priority: string) => string
  getStatusColor: (status: string) => string
}

const TaskCard = ({ task, viewMode, onEdit, onDelete, onStatusChange, onView, getProjectName, getTeamMemberName, getPriorityColor, getStatusColor }: TaskCardProps) => {
  // Safety check: ensure task object exists
  if (!task) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${
        viewMode === 'list' ? 'p-4' : 'p-6'
      }`}
    >
      {viewMode === 'list' ? (
        // List View Layout
        <div className="flex items-center space-x-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <h3 className="font-semibold text-gray-900 truncate">{task.title || 'Untitled Task'}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority || 'medium')}`}>
                {task.priority || 'medium'}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status || 'todo')}`}>
                {task.status || 'todo'}
              </span>
            </div>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-700">
              {getProjectName(task.project_id) && (
                <span className="text-gray-700">📁 {getProjectName(task.project_id)}</span>
              )}
              {task.assigned_to && (
                <span className="flex items-center space-x-1 text-gray-700">
                  <User className="w-3 h-3" />
                  <span>{getTeamMemberName(task.assigned_to)}</span>
                </span>
              )}
              {task.due_date && (
                <span className="flex items-center space-x-1 text-gray-700">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(task.due_date).toLocaleDateString()}</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onView(task)}
              className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(task)}
              className="p-2 text-gray-500 hover:text-green-600 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => task?.id && onDelete(task.id)}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        // Grid View Layout
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-2 truncate">{task.title || 'Untitled Task'}</h3>
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority || 'medium')}`}>
                  {task.priority || 'medium'}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status || 'todo')}`}>
                  {task.status || 'todo'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1 ml-2">
              <button
                onClick={() => onView(task)}
                className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => onEdit(task)}
                className="p-1.5 text-gray-500 hover:text-green-600 transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => task?.id && onDelete(task.id)}
                className="p-1.5 text-gray-500 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
          )}

                    <div className="space-y-2 text-sm text-gray-700">
            {getProjectName(task.project_id) && (
              <div className="flex items-center space-x-2">
                <span>📁</span>
                <span className="truncate text-gray-700">{getProjectName(task.project_id)}</span>
              </div>
            )}
            
            {task.assigned_to && (
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="truncate text-gray-700">{getTeamMemberName(task.assigned_to)}</span>
              </div>
            )}
            
            {task.due_date && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span className="text-gray-700">{new Date(task.due_date).toLocaleDateString()}</span>
              </div>
            )}
            
            {task.deliverable_link && (
              <div className="flex items-center space-x-2">
                <Link className="w-4 h-4" />
                <a 
                  href={task.deliverable_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 truncate"
                >
                  Deliverable
                </a>
              </div>
            )}
            
            {task.video_link && (
              <div className="flex items-center space-x-2">
                <Video className="w-4 h-4" />
                <a 
                  href={task.video_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 truncate"
                >
                  Video
                </a>
              </div>
            )}
          </div>

          {/* Status Update Dropdown */}
          <div className="pt-3 border-t border-gray-100">
            <select
              value={task.status || 'todo'}
              onChange={(e) => task?.id && onStatusChange(task.id, e.target.value)}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
      )}
    </motion.div>
  )
}

const Tasks = () => {
  const { 
    tasks, 
    updateTask, 
    deleteTask,
    projects, 
    teamMembers,
    currentUser,
    loading
  } = useAppContext()
  // Add addTask from context if available
  const { addTask } = useAppContext()

  const [filter, setFilter] = useState('all')
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  
  // Enhanced UI/UX states
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'title' | 'priority' | 'due_date' | 'created_at'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Modal states
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [showTaskDetails, setShowTaskDetails] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    assigned_to: '',
    project_id: '',
    deliverable_link: '',
    video_link: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'todo' as 'todo' | 'inprogress' | 'review' | 'done'
  })

  // Helper functions - moved before useMemo to avoid dependency issues
  const getProjectName = (projectId: string) => {
    if (!projectId || !projects || !Array.isArray(projects)) return 'No Project'
    const project = projects.find(p => p.id === projectId)
    if (!project) return 'No Project'
    if (project.archived) return `${project.name} (Archived)`
    return project.name || 'Unnamed Project'
  }

  const getTeamMemberName = (userId: string) => {
    if (!userId || !teamMembers || !Array.isArray(teamMembers)) return 'Unassigned'
    const member = teamMembers.find(m => m.id === userId)
    return member ? (member.full_name || 'Unnamed Member') : 'Unassigned'
  }

  // Enhanced filtering, searching, and sorting logic
  const filteredAndSortedTasks = useMemo(() => {
    // Safety check: ensure tasks is an array and currentUser exists
    if (!tasks || !Array.isArray(tasks) || !currentUser) return []
    
    let filtered = tasks.filter(task => {
      // Safety check: ensure task object exists
      if (!task) return false
      
      // First filter out archived tasks
      if (task.archived) return false
      
      // Filter out tasks from archived projects
      const project = projects.find(p => p.id === task.project_id)
      if (project && project.archived) return false
      
      // Role-based task filtering
      if (currentUser.role === 'team-member') {
        // Team members only see tasks assigned to them
        if (task.assigned_to !== currentUser.id) return false
      }
      // Admin and manager users can see all tasks (no filtering by assigned_to)
      
      // Apply status filter
      if (filter !== 'all' && task.status !== filter) return false
      
      // Apply priority filter
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false
      
      // Apply project filter
      if (selectedProject !== 'all' && task.project_id !== selectedProject) return false
      
      // Apply search query
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const projectName = getProjectName(task.project_id).toLowerCase()
        const assigneeName = getTeamMemberName(task.assigned_to).toLowerCase()
        const taskTitle = (task.title || '').toLowerCase()
        const taskDescription = (task.description || '').toLowerCase()
        const taskPriority = (task.priority || '').toLowerCase()
        const taskStatus = (task.status || '').toLowerCase()
        
        return (
          taskTitle.includes(query) ||
          taskDescription.includes(query) ||
          projectName.includes(query) ||
          assigneeName.includes(query) ||
          taskPriority.includes(query) ||
          taskStatus.includes(query)
        )
      }
      
      return true
    })

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
          break
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date).getTime() : 0
          bValue = b.due_date ? new Date(b.due_date).getTime() : 0
          break
        case 'created_at':
        default:
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0
          break
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [tasks, projects, filter, selectedPriority, selectedProject, searchQuery, sortBy, sortOrder, teamMembers, currentUser])

  // Pagination logic
  const totalPages = Math.ceil((filteredAndSortedTasks?.length || 0) / itemsPerPage)
  const paginatedTasks = filteredAndSortedTasks?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || []

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, selectedPriority, selectedProject, searchQuery])

  // Update task status
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await updateTask(taskId, { status: newStatus })
      setNotification({ type: 'success', message: 'Task status updated successfully!' })
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update task status' })
    }
  }

  // Handle delete task
  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId)
        setNotification({ type: 'success', message: 'Task deleted successfully!' })
      } catch (error) {
        setNotification({ type: 'error', message: 'Failed to delete task' })
      }
    }
  }

  // Handle view task details
  const handleViewTask = (task: any) => {
    setSelectedTask(task)
    setShowTaskDetails(true)
  }

  // Handle edit task
  const handleEditTask = (task: any) => {
    setEditingTask(task)
    setNewTask({
      title: task.title || '',
      description: task.description || '',
      due_date: task.due_date || '',
      assigned_to: task.assigned_to || '',
      project_id: task.project_id || '',
      deliverable_link: task.deliverable_link || '',
      video_link: task.video_link || '',
      priority: task.priority || 'medium',
      status: task.status || 'todo'
    })
    setShowEditModal(true)
  }

  // Handle save task (create or update)
  const handleSaveTask = async () => {
    if (!newTask.title.trim()) {
      setNotification({ type: 'error', message: 'Please provide a task title' })
      return
    }

    try {
      if (editingTask) {
        // Update existing task
        await updateTask(editingTask.id, {
          title: newTask.title,
          description: newTask.description,
          due_date: newTask.due_date || null,
          assigned_to: newTask.assigned_to || null,
          project_id: newTask.project_id || null,
          deliverable_link: newTask.deliverable_link || null,
          video_link: newTask.video_link || null,
          priority: newTask.priority,
          status: newTask.status
        })
        setNotification({ type: 'success', message: 'Task updated successfully!' })
      } else {
        // Create new task
        if (typeof addTask === 'function') {
          await addTask({
            title: newTask.title,
            description: newTask.description,
            due_date: newTask.due_date || null,
            assigned_to: newTask.assigned_to || null,
            project_id: newTask.project_id || null,
            deliverable_link: newTask.deliverable_link || null,
            video_link: newTask.video_link || null,
            priority: newTask.priority,
            status: newTask.status
          })
          setNotification({ type: 'success', message: 'Task created successfully!' })
        } else {
          setNotification({ type: 'error', message: 'Create task functionality not available' })
        }
      }

      // Reset form and close modal
      setNewTask({
        title: '',
        description: '',
        due_date: '',
        assigned_to: '',
        project_id: '',
        deliverable_link: '',
        video_link: '',
        priority: 'medium',
        status: 'todo'
      })
      setEditingTask(null)
      setShowEditModal(false)
    } catch (error: any) {
      console.error('Error saving task:', error)
      setNotification({ type: 'error', message: error.message || 'Failed to save task' })
    }
  }

  // Handle close modals
  const handleCloseModals = () => {
    setSelectedTask(null)
    setEditingTask(null)
    setShowTaskDetails(false)
    setShowEditModal(false)
    setNewTask({
      title: '',
      description: '',
      due_date: '',
      assigned_to: '',
      project_id: '',
      deliverable_link: '',
      video_link: '',
      priority: 'medium',
      status: 'todo'
    })
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
          <h1 className="text-2xl font-bold text-gray-900">
            {currentUser?.role === 'team-member' ? 'My Tasks' : 'All Tasks'}
          </h1>
          <p className="text-gray-600">
            {currentUser?.role === 'team-member' 
              ? 'Manage and track tasks assigned to you'
              : 'Manage and track all team tasks'
            }
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTask(null)
            setNewTask({
              title: '',
              description: '',
              due_date: '',
              assigned_to: '',
              project_id: '',
              deliverable_link: '',
              video_link: '',
              priority: 'medium',
              status: 'todo'
            })
            setShowEditModal(true)
          }}
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

      {/* Enhanced Search and Filter Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        {/* Search Bar */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tasks by title, description, project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showAdvancedFilters ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            <span>{viewMode === 'grid' ? 'List' : 'Grid'}</span>
          </button>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Projects</option>
                  {projects.filter(p => !p.archived).map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <div className="flex space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="flex-1 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="created_at">Created Date</option>
                    <option value="due_date">Due Date</option>
                    <option value="title">Title</option>
                    <option value="priority">Priority</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <SortAsc className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Summary and Items Per Page */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {paginatedTasks?.length || 0} of {filteredAndSortedTasks?.length || 0} tasks
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Items per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-2 py-1 text-gray-900 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={6}>6</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filters */}
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
            {filterOption === 'all' ? 'All' : 
             filterOption === 'inprogress' ? 'In Progress' :
             filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading tasks...</p>
          </div>
        </div>
      ) : !currentUser ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-gray-600">Please sign in to view your tasks.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Tasks Grid/List */}
          <div className={`${viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }`}>
            {paginatedTasks && paginatedTasks.length > 0 ? (
              paginatedTasks.map((task) => (
                <TaskCard 
                  key={task?.id || Math.random()} 
                  task={task} 
                  viewMode={viewMode}
                  onEdit={(task) => handleEditTask(task)}
                  onDelete={(taskId: string) => handleDeleteTask(taskId)}
                  onStatusChange={(taskId: string, newStatus: string) => updateTaskStatus(taskId, newStatus)}
                  onView={(task) => handleViewTask(task)}
                  getProjectName={getProjectName}
                  getTeamMemberName={getTeamMemberName}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">
                  {searchQuery || selectedPriority !== 'all' || selectedProject !== 'all' || filter !== 'all'
                    ? 'No tasks found matching your filters.'
                    : currentUser?.role === 'team-member' 
                      ? 'No tasks assigned to you yet.' 
                      : 'No tasks available yet.'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-6">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + Math.max(1, currentPage - 2)
                if (page > totalPages) return null
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-gray-900">Task Details</h2>
              <button
                onClick={handleCloseModals}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedTask.title || 'Untitled Task'}</p>
              </div>

              {selectedTask.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg whitespace-pre-wrap">{selectedTask.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(selectedTask.priority || 'medium')}`}>
                    {selectedTask.priority || 'medium'}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedTask.status || 'todo')}`}>
                    {selectedTask.status === 'inprogress' ? 'In Progress' : (selectedTask.status || 'todo')}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{getProjectName(selectedTask.project_id)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{getTeamMemberName(selectedTask.assigned_to)}</p>
                </div>

                {selectedTask.due_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{new Date(selectedTask.due_date).toLocaleDateString()}</p>
                  </div>
                )}

                {selectedTask.created_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{new Date(selectedTask.created_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {(selectedTask.deliverable_link || selectedTask.video_link) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Links</label>
                  <div className="space-y-2">
                    {selectedTask.deliverable_link && (
                      <div className="flex items-center space-x-2">
                        <Link className="w-4 h-4 text-gray-600" />
                        <a 
                          href={selectedTask.deliverable_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          Deliverable Link
                        </a>
                      </div>
                    )}
                    {selectedTask.video_link && (
                      <div className="flex items-center space-x-2">
                        <Video className="w-4 h-4 text-gray-600" />
                        <a 
                          href={selectedTask.video_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          Video Link
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCloseModals}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleCloseModals()
                  handleEditTask(selectedTask)
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTask ? 'Edit Task' : 'Create Task'}
              </h2>
              <button
                onClick={handleCloseModals}
                className="text-gray-500 hover:text-gray-700 transition-colors"
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
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter task description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value as 'todo' | 'inprogress' | 'review' | 'done' })}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="todo">To Do</option>
                    <option value="inprogress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select
                    value={newTask.project_id}
                    onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select project</option>
                    {projects.filter(p => !p.archived).map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                  <select
                    value={newTask.assigned_to}
                    onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select team member</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>{member.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deliverable Link</label>
                <input
                  type="url"
                  value={newTask.deliverable_link}
                  onChange={(e) => setNewTask({ ...newTask, deliverable_link: e.target.value })}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/deliverable"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video Link</label>
                <input
                  type="url"
                  value={newTask.video_link}
                  onChange={(e) => setNewTask({ ...newTask, video_link: e.target.value })}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/video"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCloseModals}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTask}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tasks
