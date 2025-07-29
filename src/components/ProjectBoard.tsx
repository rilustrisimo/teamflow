import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import { Plus, Calendar, Link, Video, User, MessageSquare, X, Play, Pause, Clock, Loader2 } from 'lucide-react'

const ProjectBoard = () => {
  const { 
    tasks, 
    addTask, 
    updateTask, 
    projects, 
    clients,
    addProject,
    timer,
    setTimer,
    startTimer,
    stopTimer,
    currentUser,
    teamMembers,
    loading
  } = useAppContext()

  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [draggedTask, setDraggedTask] = useState<any>(null)
  const [newComment, setNewComment] = useState('')
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [selectedProject, setSelectedProject] = useState('all')
  const [showProjectsList, setShowProjectsList] = useState(false)
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

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    client_id: '',
    status: 'active' as 'active' | 'completed' | 'on-hold' | 'cancelled',
    due_date: '',
    budget: 0
  })

  const columns = [
    { id: 'todo', title: 'To Do', color: 'border-gray-500' },
    { id: 'inprogress', title: 'In Progress', color: 'border-yellow-500' },
    { id: 'review', title: 'Review', color: 'border-blue-500' },
    { id: 'done', title: 'Done', color: 'border-green-500' }
  ]

  // Guard clause for null currentUser
  if (!currentUser) {
    return <div>Loading...</div>
  }

  // Filter projects and clients based on user role
  const getAvailableProjects = () => {
    let filtered = []
    if (currentUser.role === 'client') {
      // Clients can only see projects they created
      filtered = projects.filter(project => project.created_by === currentUser.id)
    } else {
      // Admin, manager, team members can see all projects
      filtered = projects
    }
    
    // Filter out archived projects
    return filtered.filter(project => !project.archived)
  }

  const getAvailableClients = () => {
    if (currentUser.role === 'client') {
      // Clients can only see their own company clients       return clients.filter(client => client.name === currentUser.company_name)
    }
    // Admin, manager, team members can see all clients
    return clients
  }

  const availableProjects = getAvailableProjects()
  const availableClients = getAvailableClients()

  // Auto-set client_id for client users when opening project modal
  useEffect(() => {
    if (showNewProjectModal && currentUser.role === 'client' && availableClients.length > 0) {
      setNewProject(prev => ({
        ...prev,
        client_id: availableClients[0].id
      }))
    }
  }, [showNewProjectModal, currentUser.role, availableClients])

  // Show notification and auto-hide after 3 seconds
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const getTasksByStatus = (status: string) => {
    const filteredTasks = selectedProject === 'all' 
      ? (currentUser.role === 'client' 
          ? tasks.filter(task => task.created_by === currentUser.id)
          : tasks)
      : tasks.filter(task => {
          const projectMatch = task.project_id === selectedProject
          const clientMatch = currentUser.role === 'client' 
            ? task.created_by === currentUser.id
            : true
          return projectMatch && clientMatch
        })
    
    // Return tasks filtered by status
    return filteredTasks.filter(task => task.status === status)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const handleDragStart = (task: any) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (draggedTask) {
      updateTask(draggedTask.id, { status: newStatus as any })
      setDraggedTask(null)
    }
  }

  const createNewTask = async () => {
    if (!newTask.title || !newTask.assigned_to || !newTask.project_id) {
      showNotification('Please fill in all required fields', 'error')
      return
    }

    // Validate that assigned_to is a valid user ID
    const assignedUser = teamMembers.find(member => member.id === newTask.assigned_to)
    if (!assignedUser) {
      showNotification('Please select a valid team member', 'error')
      return
    }

    // Additional validation to ensure it's a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(newTask.assigned_to)) {
      showNotification('Invalid user ID format. Please select again.', 'error')
      console.error('Invalid UUID format for assigned_to:', newTask.assigned_to)
      return
    }

    try {
      await addTask({
        title: newTask.title,
        description: newTask.description || null,
        due_date: newTask.due_date || null,
        assigned_to: newTask.assigned_to,
        project_id: newTask.project_id,
        deliverable_link: newTask.deliverable_link || null,
        video_link: newTask.video_link || null,
        status: 'todo',
        priority: newTask.priority
        // created_by is automatically set by AppContext
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
      showNotification(`Task "${newTask.title}" created successfully!`, 'success')
    } catch (error) {
      console.error('Error creating task:', error)
      showNotification('Failed to create task. Please try again.', 'error')
    }
  }

  const createNewProject = async () => {
    if (!newProject.name) {
      showNotification('Please enter a project name', 'error')
      return
    }

    // For client users, automatically set client_id to their company's client record
    let clientId = newProject.client_id
    if (currentUser.role === 'client' && availableClients.length > 0) {
      clientId = availableClients[0].id
    }

    if (!clientId) {
      showNotification('Please select a client', 'error')
      return
    }

    try {
      await addProject({
        name: newProject.name,
        description: newProject.description,
        client_id: clientId,
        status: newProject.status,
        due_date: newProject.due_date,
        budget: newProject.budget
        // created_by is automatically set by AppContext
      })

      setNewProject({
        name: '',
        description: '',
        client_id: '',
        status: 'active',
        due_date: '',
        budget: 0
      })
      setShowNewProjectModal(false)
      showNotification(`Project "${newProject.name}" created successfully!`, 'success')
    } catch (error) {
      console.error('Error creating project:', error)
      showNotification('Failed to create project. Please try again.', 'error')
    }
  }

  const addComment = () => {
    if (!newComment.trim() || !selectedTask) return

    try {
      const comment = {
        id: Date.now().toString(),
        author: 'Current User',
        text: newComment,
        timestamp: new Date().toLocaleString()
      }

      const updatedComments = [...selectedTask.comments, comment]
      updateTask(selectedTask.id, { comments: updatedComments })
      setSelectedTask({ ...selectedTask, comments: updatedComments })
      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const addChecklistItem = () => {
    if (!newChecklistItem.trim() || !selectedTask) return

    try {
      const item = {
        id: Date.now().toString(),
        text: newChecklistItem,
        completed: false
      }

      const updatedChecklist = [...selectedTask.checklist, item]
      updateTask(selectedTask.id, { checklist: updatedChecklist })
      setSelectedTask({ ...selectedTask, checklist: updatedChecklist })
      setNewChecklistItem('')
    } catch (error) {
      console.error('Error adding checklist item:', error)
    }
  }

  const toggleChecklistItem = (itemId: string) => {
    if (!selectedTask) return

    try {
      const updatedChecklist = selectedTask.checklist.map((item: any) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
      updateTask(selectedTask.id, { checklist: updatedChecklist })
      setSelectedTask({ ...selectedTask, checklist: updatedChecklist })
    } catch (error) {
      console.error('Error updating checklist:', error)
    }
  }

  const removeChecklistItem = (itemId: string) => {
    if (!selectedTask) return

    try {
      const updatedChecklist = selectedTask.checklist.filter((item: any) => item.id !== itemId)
      updateTask(selectedTask.id, { checklist: updatedChecklist })
      setSelectedTask({ ...selectedTask, checklist: updatedChecklist })
    } catch (error) {
      console.error('Error removing checklist item:', error)
    }
  }

  const saveTaskChanges = () => {
    if (!selectedTask) return
    
    try {
      updateTask(selectedTask.id, selectedTask)
      setSelectedTask(null)
    } catch (error) {
      console.error('Error saving task changes:', error)
    }
  }

  const handleTaskTimer = (task: any) => {
    if (timer.isTracking && timer.selectedTask === task.title) {
      // Stop the current timer
      stopTimer()
    } else {
      // Start timer for this task
      setTimer({
        selectedClient: task.client,
        selectedProject: task.project,
        selectedTask: task.title,
        description: `Working on ${task.title}`
      })
      startTimer()
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const TaskCard = ({ task }: { task: any }) => {
    const isTimerRunning = timer.isTracking && timer.selectedTask === task.title
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-dark-300 rounded-lg p-4 cursor-pointer hover:bg-dark-400 transition-colors duration-200 ${
          isTimerRunning ? 'ring-2 ring-secondary' : ''
        }`}
        draggable
        onDragStart={() => handleDragStart(task)}
        onClick={() => setSelectedTask({
          ...task,
          checklist: task.checklist || [],
          comments: task.comments || []
        })}
      >
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-medium text-gray-800 text-sm">{task.title}</h4>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleTaskTimer(task)
              }}
              className={`p-1 rounded transition-colors duration-200 ${
                isTimerRunning 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-secondary hover:bg-secondary/90 text-white'
              }`}
            >
              {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
          </div>
        </div>
        
        {isTimerRunning && (
          <div className="mb-2 text-xs text-secondary font-mono">
            ⏱️ {formatTime(timer.currentTime)}
          </div>
        )}
        
        <p className="text-dark-500 text-xs mb-3 line-clamp-2">{task.description}</p>
        
        <div className="text-xs text-dark-500 mb-2">
          <span className="text-primary">
            {projects.find(p => p.id === task.project_id)?.name || 'Unknown Project'}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-xs text-dark-500 mb-2">
          <span className="text-secondary">
            {(() => {
              const project = projects.find(p => p.id === task.project_id)
              const client = clients.find(c => c.id === project?.client_id)
              return client?.name || 'Unknown Client'
            })()}
          </span>
          {task.due_date && (
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(task.due_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {task.video_link && <Video className="w-3 h-3 text-secondary" />}
            {task.deliverable_link && <Link className="w-3 h-3 text-secondary" />}
            {task.comments && task.comments.length > 0 && (
              <div className="flex items-center space-x-1">
                <MessageSquare className="w-3 h-3 text-secondary" />
                <span className="text-xs text-secondary">{task.comments.length}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>
                {(() => {
                  // First try to find by ID (new format)
                  const assignedUser = teamMembers.find(member => member.id === task.assigned_to)
                  if (assignedUser) {
                    return assignedUser.full_name.split(' ')[0]
                  }
                  // Fallback for old format (name directly stored)
                  if (task.assigned_to) {
                    return task.assigned_to.split(' ')[0]
                  }
                  return 'Unassigned'
                })()}
              </span>
            </div>
            {task.checklist && task.checklist.length > 0 && (
              <div className="text-xs text-dark-500">
                {task.checklist.filter((item: any) => item.completed).length}/{task.checklist.length}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Project Management Board</h2>
          <p className="text-dark-500">Manage tasks and track project progress</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
          >
            <option value="all">All Projects</option>
            {availableProjects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowProjectsList(!showProjectsList)}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span>{showProjectsList ? 'Hide Projects' : 'Show Projects'}</span>
          </button>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center space-x-2 bg-secondary hover:bg-secondary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Task</span>
          </button>
        </div>
      </div>

      {/* Active Timer Display */}
      {timer.isTracking && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary/20 border border-secondary rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-secondary" />
              <div>
                <p className="text-white font-medium">Timer Running: {timer.selectedTask}</p>
                <p className="text-dark-500 text-sm">{timer.selectedProject} • {timer.selectedClient}</p>
              </div>
            </div>
            <div className="text-2xl font-mono text-secondary">
              {formatTime(timer.currentTime)}
            </div>
          </div>
        </motion.div>
      )}

      {/* Projects List Section */}
      {showProjectsList && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-200 rounded-xl p-6 border border-dark-300"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {currentUser.role === 'client' ? 'My Projects' : 'All Projects'} ({availableProjects.length})
          </h3>
          
          {availableProjects.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-dark-500 mb-2">No projects found</div>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="text-primary hover:text-primary/80 text-sm"
              >
                Create your first project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableProjects.map(project => {
                const client = clients.find(c => c.id === project.client_id)
                const projectTasks = tasks.filter(task => task.project_id === project.id)
                const completedTasks = projectTasks.filter(task => task.status === 'done')
                const progress = projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-dark-300 rounded-lg p-4 border border-dark-400 hover:border-primary/50 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 text-sm mb-1">{project.name}</h4>
                        <p className="text-dark-500 text-xs">{client?.name || 'Unknown Client'}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        project.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        project.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        project.status === 'on-hold' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {project.status}
                      </span>
                    </div>

                    {project.description && (
                      <p className="text-dark-500 text-xs mb-3 line-clamp-2">{project.description}</p>
                    )}

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-dark-500">Progress</span>
                        <span className="text-white">{progress}%</span>
                      </div>
                      <div className="w-full bg-dark-400 rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-dark-500">
                        <span>{completedTasks.length}/{projectTasks.length} tasks completed</span>
                        {project.due_date && (
                          <span>{new Date(project.due_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setSelectedProject(project.id)}
                        className="bg-primary/20 hover:bg-primary/30 text-primary px-3 py-1 rounded text-xs transition-all duration-200"
                      >
                        View Tasks
                      </button>
                      {project.budget > 0 && (
                        <div className="text-xs text-dark-500">
                          Budget: ${project.budget.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 bg-dark-200 rounded-xl border border-dark-300">
            <Loader2 className="w-8 h-8 animate-spin text-secondary mb-3" />
            <span className="text-dark-500">Loading tasks...</span>
          </div>
        ) : (
          columns.map((column) => (
          <div 
            key={column.id} 
            className="bg-dark-200 rounded-xl p-4 border border-dark-300 min-h-[500px]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className={`border-l-4 ${column.color} pl-3 mb-4`}>
              <h3 className="font-semibold text-gray-800">{column.title}</h3>
              <span className="text-sm text-dark-500">
                {getTasksByStatus(column.id).length} tasks
              </span>
            </div>
            
            <div className="space-y-3">
              {getTasksByStatus(column.id).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
          ))
        )}
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-200 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-white-800 mb-6">Create New Task</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Task Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500"
                  rows={3}
                  placeholder="Enter task description"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">Project *</label>
                  <select
                    value={newTask.project_id}
                    onChange={(e) => setNewTask({...newTask, project_id: e.target.value})}
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  >
                    <option value="">Select project</option>
                    {availableProjects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">Assigned To *</label>                    <select
                      value={newTask.assigned_to}
                      onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                      className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                    >
                      <option value="">Select member</option>
                      {teamMembers
                        .filter(member => member.role !== 'client')
                        .map(member => (
                          <option key={member.id} value={member.id}>{member.full_name}</option>
                        ))}
                    </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value as 'low' | 'medium' | 'high'})}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">Deliverable Link</label>
                  <input
                    type="url"
                    value={newTask.deliverable_link}
                    onChange={(e) => setNewTask({...newTask, deliverable_link: e.target.value})}
                    placeholder="https://..."
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">Video Instructions</label>
                  <input
                    type="url"
                    value={newTask.video_link}
                    onChange={(e) => setNewTask({...newTask, video_link: e.target.value})}
                    placeholder="Loom/Video URL"
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Initial Checklist Section */}
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Initial Checklist Items</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Add initial checklist item..."
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        // This would add to a temporary checklist state for new tasks
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                  <p className="text-xs text-dark-500">Press Enter to add items (you can add more after creating the task)</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="px-4 py-2 text-dark-500 hover:text-white transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={createNewTask}
                className="bg-secondary hover:bg-secondary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                Create Task
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-200 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white-800">{selectedTask.title}</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-dark-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">Description</label>
                  <textarea
                    value={selectedTask.description}
                    onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-500 mb-2">Project</label>
                    <select
                      value={selectedTask.project_id}
                      onChange={(e) => setSelectedTask({ ...selectedTask, project_id: e.target.value })}
                      className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                    >
                      {availableProjects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-500 mb-2">Assigned To</label>
                    <select
                      value={selectedTask.assigned_to}
                      onChange={(e) => setSelectedTask({ ...selectedTask, assigned_to: e.target.value })}
                      className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                    >
                      {teamMembers
                        .filter(member => member.role !== 'client')
                        .map(member => (
                          <option key={member.id} value={member.id}>{member.full_name}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-500 mb-2">Due Date</label>
                    <input
                      type="date"
                      value={selectedTask.due_date}
                      onChange={(e) => setSelectedTask({ ...selectedTask, due_date: e.target.value })}
                      className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-500 mb-2">Status</label>
                    <select
                      value={selectedTask.status}
                      onChange={(e) => setSelectedTask({ ...selectedTask, status: e.target.value })}
                      className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                    >
                      <option value="todo">To Do</option>
                      <option value="inprogress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-500 mb-2">Priority</label>
                    <select
                      value={selectedTask.priority}
                      onChange={(e) => setSelectedTask({ ...selectedTask, priority: e.target.value })}
                      className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-500 mb-2">Deliverable Link</label>
                    <input
                      type="url"
                      value={selectedTask.deliverable_link}
                      onChange={(e) => setSelectedTask({ ...selectedTask, deliverable_link: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-500 mb-2">Video Instructions</label>
                    <input
                      type="url"
                      value={selectedTask.video_link}
                      onChange={(e) => setSelectedTask({ ...selectedTask, video_link: e.target.value })}
                      placeholder="Loom/Video URL"
                      className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Checklist */}
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">Checklist</label>
                  <div className="space-y-2 mb-3">
                    {selectedTask.checklist.map((item: any) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleChecklistItem(item.id)}
                          className="rounded bg-dark-300 border-dark-400"
                        />
                        <span className={`text-sm flex-1 ${item.completed ? 'text-dark-500 line-through' : 'text-white'}`}>
                          {item.text}
                        </span>
                        <button
                          onClick={() => removeChecklistItem(item.id)}
                          className="text-dark-500 hover:text-red-400 transition-colors duration-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      placeholder="Add checklist item..."
                      className="flex-1 bg-gray-100 border border-gray-300 rounded px-3 py-1 text-gray-900 text-sm placeholder-gray-500"
                      onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                    />
                    <button
                      onClick={addChecklistItem}
                      className="bg-secondary hover:bg-secondary/90 text-white px-3 py-1 rounded text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">Comments</label>
                  <div className="space-y-3 mb-3 max-h-40 overflow-y-auto">
                    {selectedTask.comments.map((comment: any) => (
                      <div key={comment.id} className="bg-dark-300 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">{comment.author}</span>
                          <span className="text-xs text-dark-500">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm text-dark-500">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-gray-100 border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm placeholder-gray-500"
                      onKeyPress={(e) => e.key === 'Enter' && addComment()}
                    />
                    <button
                      onClick={addComment}
                      className="bg-secondary hover:bg-secondary/90 text-white px-4 py-2 rounded text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 text-dark-500 hover:text-white transition-colors duration-200"
              >
                Close
              </button>
              <button 
                onClick={saveTaskChanges}
                className="bg-secondary hover:bg-secondary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-200 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-white-800 mb-6">Create New Project</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Project Name *</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500"
                  rows={3}
                  placeholder="Enter project description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">Client *</label>
                  <select
                    value={newProject.client_id}
                    onChange={(e) => setNewProject({...newProject, client_id: e.target.value})}
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                    disabled={currentUser.role === 'client'}
                  >
                    {currentUser.role === 'client' ? (
                      availableClients.length > 0 ? (
                        <option value={availableClients[0].id}>{availableClients[0].name}</option>
                      ) : (
                        <option value="">No client found</option>
                      )
                    ) : (
                      <>
                        <option value="">Select client</option>
                        {availableClients.map(client => (
                          <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">Status</label>
                  <select
                    value={newProject.status}
                    onChange={(e) => setNewProject({...newProject, status: e.target.value as 'active' | 'completed' | 'on-hold' | 'cancelled'})}
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  >
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newProject.due_date}
                    onChange={(e) => setNewProject({...newProject, due_date: e.target.value})}
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">Budget</label>
                  <input
                    type="number"
                    value={newProject.budget}
                    onChange={(e) => setNewProject({...newProject, budget: Number(e.target.value)})}
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="px-4 py-2 text-dark-500 hover:text-white transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={createNewProject}
                className="bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                Create Project
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default ProjectBoard