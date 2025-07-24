import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import { 
  Plus, 
  Calendar, 
  DollarSign, 
  Building, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Loader2,
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

const Projects = () => {
  const { 
    projects, 
    clients,
    tasks,
    teamMembers,
    addProject,
    updateProject,
    deleteProject,
    archiveProject,
    unarchiveProject,
    getArchivedProjects,
    loading
  } = useAppContext()

  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [showProjectDetails, setShowProjectDetails] = useState(false)
  const [filter, setFilter] = useState('all')
  const [showArchive, setShowArchive] = useState(false)
  const [archivedProjects, setArchivedProjects] = useState<any[]>([])
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    client_id: '',
    status: 'active' as 'active' | 'completed' | 'on-hold' | 'cancelled',
    due_date: '',
    budget: 0
  })

  // Filter projects based on selected filter
  const filteredProjects = projects.filter(project => {
    if (filter === 'all') return true
    return project.status === filter
  })

  // Get client name for a project
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client ? client.name : 'Unknown Client'
  }

  // Get project progress (based on tasks completion)
  const getProjectProgress = (projectId: string) => {
    // Get all tasks for this project
    const projectTasks = tasks.filter(task => task.project_id === projectId)
    
    if (projectTasks.length === 0) {
      return 0 // No tasks, 0% progress
    }
    
    // Count completed tasks (status 'done')
    const completedTasks = projectTasks.filter(task => task.status === 'done')
    
    // Calculate percentage
    return Math.round((completedTasks.length / projectTasks.length) * 100)
  }

  // Get task statistics for a project
  const getProjectTaskStats = (projectId: string) => {
    const projectTasks = tasks.filter(task => task.project_id === projectId && !task.archived)
    const completedTasks = projectTasks.filter(task => task.status === 'done')
    const progress = projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0
    
    // Get breakdown by status
    const todo = projectTasks.filter(task => task.status === 'todo').length
    const inProgress = projectTasks.filter(task => task.status === 'inprogress').length
    const review = projectTasks.filter(task => task.status === 'review').length
    const done = projectTasks.filter(task => task.status === 'done').length
    
    return {
      total: projectTasks.length,
      completed: completedTasks.length,
      progress,
      todo,
      inProgress,
      review,
      done
    }
  }

  // Handle new project creation
  const handleCreateProject = async () => {
    try {
      if (!newProject.name.trim()) {
        setNotification({ type: 'error', message: 'Project name is required' })
        return
      }

      if (!newProject.client_id) {
        setNotification({ type: 'error', message: 'Client selection is required' })
        return
      }

      // Prepare project data
      const projectData = {
        name: newProject.name,
        description: newProject.description,
        client_id: newProject.client_id,
        status: newProject.status,
        budget: Number(newProject.budget),
        due_date: newProject.due_date || null
      }

      await addProject(projectData)
      
      setNewProject({
        name: '',
        description: '',
        client_id: '',
        status: 'active',
        due_date: '',
        budget: 0
      })
      setShowNewProjectModal(false)
      setNotification({ type: 'success', message: 'Project created successfully' })
    } catch (error: any) {
      console.error('Project creation error:', error)
      
      // Provide specific error messages
      let errorMessage = 'Failed to create project'
      
      if (error?.message?.includes('User profile not found')) {
        errorMessage = 'Please complete your profile setup before creating projects'
      } else if (error?.message?.includes('User not associated with a company')) {
        errorMessage = 'Please contact your admin to associate your account with a company'
      } else if (error?.message?.includes('due_date')) {
        errorMessage = 'Project created but due date could not be saved (schema issue)'
      } else if (error?.message?.includes('foreign key constraint')) {
        errorMessage = 'Account setup incomplete. Please contact support.'
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      setNotification({ type: 'error', message: errorMessage })
    }
  }

  // Handle project update
  const handleUpdateProject = async (projectId: string, updates: any) => {
    try {
      await updateProject(projectId, updates)
      setNotification({ type: 'success', message: 'Project updated successfully' })
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update project' })
    }
  }

  // Handle project deletion
  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(projectId)
        setNotification({ type: 'success', message: 'Project deleted successfully' })
      } catch (error) {
        setNotification({ type: 'error', message: 'Failed to delete project' })
      }
    }
  }

  // Handle project archiving
  const handleArchiveProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to archive this project? All tasks will also be archived.')) {
      try {
        await archiveProject(projectId)
        // Reload archived projects to update the count and list
        await loadArchivedProjects(true)
        setNotification({ type: 'success', message: 'Project and all its tasks archived successfully' })
      } catch (error) {
        setNotification({ type: 'error', message: 'Failed to archive project' })
      }
    }
  }

  // Handle project unarchiving
  const handleUnarchiveProject = async (projectId: string) => {
    try {
      await unarchiveProject(projectId)
      // Reload archived projects to update the count and list
      await loadArchivedProjects(true)
      setNotification({ type: 'success', message: 'Project and all its tasks unarchived successfully' })
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to unarchive project' })
    }
  }

  // Load archived projects
  const loadArchivedProjects = async (showError = false) => {
    try {
      const archived = await getArchivedProjects()
      setArchivedProjects(archived)
    } catch (error) {
      console.error('Error loading archived projects:', error)
      // Only show error notification if explicitly requested (e.g., user action)
      if (showError) {
        setNotification({ type: 'error', message: 'Failed to load archived projects' })
      }
    }
  }

  // Load archived projects when archive view is opened
  useEffect(() => {
    if (showArchive) {
      loadArchivedProjects(true) // Show error if user explicitly opens archive
    }
  }, [showArchive])

  // Load archived projects on component mount to show correct count
  useEffect(() => {
    loadArchivedProjects(false) // Don't show error on initial load
  }, [])

  // Also reload archived projects when the main projects list changes
  useEffect(() => {
    loadArchivedProjects(false) // Don't show error on automatic refresh
  }, [projects])

  // Handle project view details
  const handleViewProject = (project: any) => {
    setSelectedProject(project)
    setShowProjectDetails(true)
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'on-hold': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage your projects and track progress</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowArchive(!showArchive)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showArchive 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showArchive ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Archive className="w-4 h-4" />
            <span>Archive ({archivedProjects.length})</span>
          </button>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        {['all', 'active', 'completed', 'on-hold', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All Projects' : status.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Archive Section */}
      {showArchive && (
        <div className="mb-6 bg-white rounded-lg p-4 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Archived Projects</h2>
          {archivedProjects.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No archived projects</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedProjects.map((project) => (
                <div key={project.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 opacity-75">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-600">{getClientName(project.client_id)}</p>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={() => handleViewProject(project)}
                        className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUnarchiveProject(project.id)}
                        className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                      >
                        <ArchiveRestore className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {project.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Archived
                    </span>
                    {project.due_date && (
                      <span className="text-xs text-gray-500">
                        Due: {new Date(project.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <span className="text-gray-500">Loading projects...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 mb-4">
              <Building className="w-12 h-12 mx-auto mb-3" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-4">
              {filter === 'all' ? 'Get started by creating your first project.' : `No projects with status "${filter}".`}
            </p>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Project
            </button>
          </div>
        ) : (
          filteredProjects.map((project) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            {/* Project Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Building className="w-4 h-4" />
                  <span>{getClientName(project.client_id)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleViewProject(project)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedProject(project)
                    setNewProject({
                      name: project.name,
                      description: project.description || '',
                      client_id: project.client_id,
                      status: project.status,
                      due_date: project.due_date || '',
                      budget: project.budget || 0
                    })
                    setShowNewProjectModal(true)
                  }}
                  className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleArchiveProject(project.id)}
                  className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteProject(project.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Project Description */}
            {project.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
            )}

            {/* Project Status */}
            <div className="flex items-center justify-between mb-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status.replace('-', ' ')}
              </span>
              <div className="text-sm text-gray-500">
                {(() => {
                  const stats = getProjectTaskStats(project.id)
                  
                  if (stats.total === 0) {
                    return 'No tasks'
                  }
                  
                  return `${stats.completed}/${stats.total} tasks • ${stats.progress}%`
                })()}
              </div>
            </div>

            {/* Project Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProjectProgress(project.id)}%` }}
              />
            </div>

            {/* Project Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{project.due_date ? new Date(project.due_date).toLocaleDateString() : 'No due date set'}</span>
              </div>
              {project.budget > 0 && (
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <DollarSign className="w-4 h-4" />
                  <span>{project.budget.toLocaleString()}</span>
                </div>
              )}
            </div>
          </motion.div>
          ))
        )}
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedProject ? 'Edit Project' : 'Create New Project'}
              </h2>
              <button
                onClick={() => {
                  setShowNewProjectModal(false)
                  setSelectedProject(null)
                  setNewProject({
                    name: '',
                    description: '',
                    client_id: '',
                    status: 'active',
                    due_date: '',
                    budget: 0
                  })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter project name"
                  style={{
                    backgroundColor: '#EBF5FF',
                    color: '#1E40AF'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter project description"
                  style={{
                    backgroundColor: '#EBF5FF',
                    color: '#1E40AF'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client *
                </label>
                {!clients || clients.length === 0 ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-gray-500">Loading clients...</span>
                  </div>
                ) : (
                  <select
                    value={newProject.client_id}
                    onChange={(e) => setNewProject({...newProject, client_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{
                      backgroundColor: '#EBF5FF',
                      color: '#1E40AF'
                    }}
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option 
                        key={client.id} 
                        value={client.id}
                        className={client.id === newProject.client_id ? 'bg-blue-100 text-blue-800' : ''}
                      >
                        {client.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject({...newProject, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{
                    backgroundColor: '#EBF5FF',
                    color: '#1E40AF'
                  }}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newProject.due_date}
                  onChange={(e) => setNewProject({...newProject, due_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{
                    backgroundColor: '#EBF5FF',
                    color: '#1E40AF'
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Note: Due date may not be saved if database schema doesn't support it
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget
                </label>
                <input
                  type="number"
                  value={newProject.budget}
                  onChange={(e) => setNewProject({...newProject, budget: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter budget amount"
                  style={{
                    backgroundColor: '#EBF5FF',
                    color: '#1E40AF'
                  }}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowNewProjectModal(false)
                  setSelectedProject(null)
                  setNewProject({
                    name: '',
                    description: '',
                    client_id: '',
                    status: 'active',
                    due_date: '',
                    budget: 0
                  })
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={selectedProject ? () => handleUpdateProject(selectedProject.id, newProject) : handleCreateProject}
                disabled={!clients || clients.length === 0}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  !clients || clients.length === 0
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {selectedProject ? 'Update' : 'Create'} Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {showProjectDetails && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{selectedProject.name}</h2>
              <button
                onClick={() => setShowProjectDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Status and Archive Indicators */}
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  selectedProject.status === 'active' ? 'bg-green-100 text-green-800' :
                  selectedProject.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  selectedProject.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedProject.status.replace('-', ' ')}
                </span>
                {selectedProject.archived && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-orange-100 text-orange-800">
                    Archived
                  </span>
                )}
              </div>

              {/* Project Description */}
              {selectedProject.description && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedProject.description}</p>
                </div>
              )}

              {/* Project Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Client</h4>
                  <p className="text-gray-700">{getClientName(selectedProject.client_id)}</p>
                </div>
                
                {selectedProject.budget && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Budget</h4>
                    <p className="text-gray-700">${selectedProject.budget.toLocaleString()}</p>
                  </div>
                )}
                
                {selectedProject.due_date && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Due Date</h4>
                    <p className="text-gray-700">{new Date(selectedProject.due_date).toLocaleDateString()}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Created</h4>
                  <p className="text-gray-700">{new Date(selectedProject.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Project Progress */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Project Progress</h4>
                {(() => {
                  const stats = getProjectTaskStats(selectedProject.id)
                  
                  if (stats.total === 0) {
                    return <p className="text-gray-500">No tasks assigned to this project</p>
                  }
                  
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Completed Tasks</span>
                        <span>{stats.completed} of {stats.total} ({stats.progress}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${stats.progress}%` }}
                        ></div>
                      </div>
                      
                      {/* Task Breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-semibold text-gray-700">{stats.todo}</div>
                          <div className="text-gray-500">To Do</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="font-semibold text-blue-700">{stats.inProgress}</div>
                          <div className="text-blue-500">In Progress</div>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded">
                          <div className="font-semibold text-yellow-700">{stats.review}</div>
                          <div className="text-yellow-500">Review</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="font-semibold text-green-700">{stats.done}</div>
                          <div className="text-green-500">Done</div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Recent Tasks */}
              {(() => {
                const projectTasks = tasks.filter(task => task.project_id === selectedProject.id && !task.archived)
                
                if (projectTasks.length > 0) {
                  return (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Recent Tasks</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {projectTasks.slice(0, 10).map((task) => (
                          <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm text-gray-900">{task.title}</h5>
                              <p className="text-xs text-gray-600">
                                {teamMembers.find(m => m.id === task.assigned_to)?.full_name || 'Unassigned'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {task.priority}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                task.status === 'todo' ? 'bg-gray-100 text-gray-800' :
                                task.status === 'inprogress' ? 'bg-blue-100 text-blue-800' :
                                task.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {task.status === 'inprogress' ? 'In Progress' : task.status}
                              </span>
                            </div>
                          </div>
                        ))}
                        {projectTasks.length > 10 && (
                          <p className="text-xs text-gray-500 text-center py-2">
                            And {projectTasks.length - 10} more tasks...
                          </p>
                        )}
                      </div>
                    </div>
                  )
                }
                return null
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}

export default Projects
