import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import { Plus, Calendar, DollarSign, Building, Edit, Trash2, Eye, X } from 'lucide-react'

const Projects = () => {
  const { 
    projects, 
    clients,
    addProject,
    updateProject,
    deleteProject
  } = useAppContext()

  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [filter, setFilter] = useState('all')
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

  // Get project progress (based on tasks if available)
  const getProjectProgress = (_projectId: string) => {
    // This would calculate progress based on tasks
    // For now, return a mock value
    return Math.floor(Math.random() * 100)
  }

  // Handle new project creation
  const handleCreateProject = async () => {
    try {
      if (!newProject.name.trim()) {
        setNotification({ type: 'error', message: 'Project name is required' })
        return
      }

      await addProject({
        ...newProject,
        budget: Number(newProject.budget)
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
      setNotification({ type: 'success', message: 'Project created successfully' })
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to create project' })
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
        <button
          onClick={() => setShowNewProjectModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Project</span>
        </button>
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

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
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
                  onClick={() => {
                    setSelectedProject(project)
                    // View project details - functionality to be implemented
                  }}
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
                {getProjectProgress(project.id)}% Complete
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
                <span>{project.due_date ? new Date(project.due_date).toLocaleDateString() : 'No due date'}</span>
              </div>
              {project.budget > 0 && (
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <DollarSign className="w-4 h-4" />
                  <span>{project.budget.toLocaleString()}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-4">
            {filter === 'all' 
              ? 'Get started by creating your first project' 
              : `No projects with status "${filter}"`
            }
          </p>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Project
          </button>
        </div>
      )}

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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client
                </label>
                <select
                  value={newProject.client_id}
                  onChange={(e) => setNewProject({...newProject, client_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject({...newProject, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                />
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
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {selectedProject ? 'Update' : 'Create'} Project
              </button>
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
