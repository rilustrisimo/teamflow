import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import { Plus, Calendar, Link, Video, User, MessageSquare, X, Play, Pause, Clock } from 'lucide-react'

const ProjectBoard = () => {
  const { 
    tasks, 
    addTask, 
    updateTask, 
    projects, 
    clients,
    timer,
    setTimer,
    startTimer,
    stopTimer,
    currentUser
  } = useAppContext()

  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [draggedTask, setDraggedTask] = useState<any>(null)
  const [newComment, setNewComment] = useState('')
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [selectedProject, setSelectedProject] = useState('all')
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    assignedTo: '',
    client: '',
    project: '',
    deliverableLink: '',
    videoLink: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  })

  const columns = [
    { id: 'todo', title: 'To Do', color: 'border-gray-500' },
    { id: 'inprogress', title: 'In Progress', color: 'border-yellow-500' },
    { id: 'review', title: 'Review', color: 'border-blue-500' },
    { id: 'done', title: 'Done', color: 'border-green-500' }
  ]

  const teamMembers = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson']

  // Guard clause for null currentUser
  if (!currentUser) {
    return <div>Loading...</div>
  }

  // Filter projects and clients based on user role
  const getAvailableProjects = () => {
    if (currentUser.role === 'client') {
      return projects.filter(project => project.client_id === currentUser.id)
    }
    // Team members can see all projects since they might be assigned tasks across different projects
    return projects
  }

  const getAvailableClients = () => {
    if (currentUser.role === 'client') {
      return clients.filter(client => client.company === currentUser.company_name)
    }
    // Team members can see all clients since they might work on tasks for different clients
    return clients
  }

  const availableProjects = getAvailableProjects()
  const availableClients = getAvailableClients()

  const getTasksByStatus = (status: string) => {
    const filteredTasks = selectedProject === 'all' 
      ? (currentUser.role === 'client' 
          ? tasks.filter(task => {
              const project = projects.find(p => p.id === task.project_id)
              return project?.client_id === currentUser.id
            })
          : tasks)
      : tasks.filter(task => {
          const projectMatch = task.project_id === selectedProject
          const clientMatch = currentUser.role === 'client' 
            ? (() => {
                const project = projects.find(p => p.id === task.project_id)
                return project?.client_id === currentUser.id
              })()
            : true
          return projectMatch && clientMatch
        })
    
    // Team members see all tasks (they might be assigned to any task)
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

  const createNewTask = () => {
    if (!newTask.title || !newTask.assignedTo || !newTask.project) {
      return
    }

    try {
      addTask({
        title: newTask.title,
        description: newTask.description,
        due_date: newTask.dueDate,
        assigned_to: newTask.assignedTo,
        project_id: newTask.project,
        deliverable_link: newTask.deliverableLink,
        video_link: newTask.videoLink,
        status: 'todo',
        priority: newTask.priority
      })

      setNewTask({
        title: '',
        description: '',
        dueDate: '',
        assignedTo: '',
        client: '',
        project: '',
        deliverableLink: '',
        videoLink: '',
        priority: 'medium'
      })
      setShowNewTaskModal(false)
    } catch (error) {
      console.error('Error creating task:', error)
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
        onClick={() => setSelectedTask(task)}
      >
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-medium text-white text-sm">{task.title}</h4>
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
          <span className="text-primary">{task.project}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs text-dark-500 mb-2">
          <span className="text-secondary">{task.client}</span>
          {task.dueDate && (
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {task.videoLink && <Video className="w-3 h-3 text-secondary" />}
            {task.deliverableLink && <Link className="w-3 h-3 text-secondary" />}
            {task.comments.length > 0 && (
              <div className="flex items-center space-x-1">
                <MessageSquare className="w-3 h-3 text-secondary" />
                <span className="text-xs text-secondary">{task.comments.length}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>{task.assignedTo.split(' ')[0]}</span>
            </div>
            {task.checklist.length > 0 && (
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Project Management Board</h2>
          <p className="text-dark-500">Manage tasks and track project progress</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">All Projects</option>
            {availableProjects.map(project => (
              <option key={project.id} value={project.name}>{project.name}</option>
            ))}
          </select>
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

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div 
            key={column.id} 
            className="bg-dark-200 rounded-xl p-4 border border-dark-300 min-h-[500px]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className={`border-l-4 ${column.color} pl-3 mb-4`}>
              <h3 className="font-semibold text-white">{column.title}</h3>
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
        ))}
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-200 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-white mb-6">Create New Task</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Task Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                  rows={3}
                  placeholder="Enter task description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">Client *</label>
                  <select
                    value={newTask.client}
                    onChange={(e) => setNewTask({...newTask, client: e.target.value})}
                    className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                    disabled={currentUser.role === 'client'}
                  >
                    {currentUser.role === 'client' ? (
                      <option value={currentUser.company_name || ''}>{currentUser.company_name}</option>
                    ) : (
                      <>
                        <option value="">Select client</option>
                        {availableClients.map(client => (
                          <option key={client.id} value={client.company}>{client.company}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">Project *</label>
                  <select
                    value={newTask.project}
                    onChange={(e) => setNewTask({...newTask, project: e.target.value})}
                    className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="">Select project</option>
                    {availableProjects.map(project => (
                      <option key={project.id} value={project.name}>{project.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">Assigned To *</label>
                  <select
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                    className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="">Select member</option>
                    {teamMembers.map(member => (
                      <option key={member} value={member}>{member}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                    className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value as 'low' | 'medium' | 'high'})}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
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
                    value={newTask.deliverableLink}
                    onChange={(e) => setNewTask({...newTask, deliverableLink: e.target.value})}
                    placeholder="https://..."
                    className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">Video Instructions</label>
                  <input
                    type="url"
                    value={newTask.videoLink}
                    onChange={(e) => setNewTask({...newTask, videoLink: e.target.value})}
                    placeholder="Loom/Video URL"
                    className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
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
                    className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white placeholder-dark-500"
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
              <h3 className="text-xl font-bold text-white">{selectedTask.title}</h3>
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
                    className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-500 mb-2">Client</label>
                    <select
                      value={selectedTask.client}
                      onChange={(e) => setSelectedTask({ ...selectedTask, client: e.target.value })}
                      className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                      disabled={currentUser.role === 'client'}
                    >
                      {availableClients.map(client => (
                        <option key={client.id} value={client.company}>{client.company}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-500 mb-2">Project</label>
                    <select
                      value={selectedTask.project}
                      onChange={(e) => setSelectedTask({ ...selectedTask, project: e.target.value })}
                      className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                    >
                      {availableProjects.map(project => (
                        <option key={project.id} value={project.name}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-500 mb-2">Assigned To</label>
                    <select
                      value={selectedTask.assignedTo}
                      onChange={(e) => setSelectedTask({ ...selectedTask, assignedTo: e.target.value })}
                      className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                    >
                      {teamMembers.map(member => (
                        <option key={member} value={member}>{member}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-500 mb-2">Due Date</label>
                    <input
                      type="date"
                      value={selectedTask.dueDate}
                      onChange={(e) => setSelectedTask({ ...selectedTask, dueDate: e.target.value })}
                      className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-500 mb-2">Status</label>
                    <select
                      value={selectedTask.status}
                      onChange={(e) => setSelectedTask({ ...selectedTask, status: e.target.value })}
                      className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
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
                      className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
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
                      value={selectedTask.deliverableLink}
                      onChange={(e) => setSelectedTask({ ...selectedTask, deliverableLink: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-500 mb-2">Video Instructions</label>
                    <input
                      type="url"
                      value={selectedTask.videoLink}
                      onChange={(e) => setSelectedTask({ ...selectedTask, videoLink: e.target.value })}
                      placeholder="Loom/Video URL"
                      className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
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
                      className="flex-1 bg-dark-300 border border-dark-400 rounded px-3 py-1 text-white text-sm"
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
                      className="flex-1 bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white text-sm"
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
    </div>
  )
}

export default ProjectBoard