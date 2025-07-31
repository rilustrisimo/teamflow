import { useState, useEffect, useMemo } from 'react'
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable
} from '@dnd-kit/core'
import { 
  SortableContext, 
  useSortable, 
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAppContext } from '../context/AppContext'
import { 
  Plus, 
  Calendar, 
  User, 
  X, 
  Archive, 
  ArchiveRestore,
  Trash2, 
  Eye,
  Edit,
  ChevronDown,
  ChevronRight,
  Loader2,
  Search,
  Filter,
  Settings
} from 'lucide-react'

interface TaskCardProps {
  task: any
  onView: (task: any) => void
  onEdit: (task: any) => void
  onArchive: (taskId: string) => void
  onUnarchive: (taskId: string) => void
  onDelete: (taskId: string) => void
  isArchived?: boolean
  isCompact?: boolean
  canMove?: boolean
  getProjectName: (projectId: string) => string
  getTeamMemberName: (userId: string) => string
  getPriorityColor: (priority: string) => string
  getStatusColor: (status: string) => string
}

const TaskCard = ({ 
  task, 
  onView, 
  onEdit,
  onArchive, 
  onUnarchive, 
  onDelete, 
  isArchived = false,
  isCompact = false,
  canMove = true,
  getProjectName,
  getTeamMemberName,
  getPriorityColor,
  getStatusColor
}: TaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: isArchived || !canMove, // Disable dragging for archived tasks or tasks user can't move
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(canMove && !isArchived ? listeners : {})}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 group relative ${
        isArchived ? 'opacity-70' : 'hover:border-blue-300'
      } ${isCompact ? 'p-3' : 'p-4'} ${isDragging ? 'shadow-lg scale-105' : ''} ${
        canMove && !isArchived 
          ? 'cursor-grab active:cursor-grabbing' 
          : 'cursor-default border-dashed bg-gray-50'
      } ${!canMove && !isArchived ? 'hover:border-gray-300' : ''}`}
      title={!canMove && !isArchived ? "You can only move your own tasks" : ""}
    >
      {/* Task Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className={`font-semibold text-gray-900 line-clamp-2 ${isCompact ? 'text-sm' : 'text-sm'} ${
              !canMove && !isArchived ? 'text-gray-700' : ''
            }`}>
              {task.title}
            </h3>
            {!isArchived && !canMove && (
              <span 
                className="text-xs text-amber-600 opacity-75"
                title="You can only move your own tasks"
              >
                🔒
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1 truncate">
            {getProjectName(task.project_id)}
          </p>
        </div>
        <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onView(task)
            }}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors rounded"
            title="View details"
          >
            <Eye className="w-3 h-3" />
          </button>
          {!isArchived && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(task)
              }}
              className="p-1 text-gray-400 hover:text-yellow-600 transition-colors rounded"
              title="Edit task"
            >
              <Edit className="w-3 h-3" />
            </button>
          )}
          {!isArchived ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onArchive(task.id)
              }}
              className="p-1 text-gray-400 hover:text-orange-600 transition-colors rounded"
              title="Archive task"
            >
              <Archive className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onUnarchive(task.id)
              }}
              className="p-1 text-gray-400 hover:text-green-600 transition-colors rounded"
              title="Unarchive task"
            >
              <ArchiveRestore className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task.id)
            }}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors rounded"
            title="Delete task"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && !isCompact && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Priority and Status Badges */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-1">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          {!isArchived && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
              {task.status === 'inprogress' ? 'In Progress' : task.status}
            </span>
          )}
        </div>
      </div>

      {/* Footer with assignee and due date */}
      <div className="flex items-center justify-between text-xs text-gray-700">
        <div className="flex items-center space-x-1 min-w-0 flex-1">
          <User className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{getTeamMemberName(task.assigned_to)}</span>
        </div>
        {task.due_date && (
          <div className="flex items-center space-x-1 ml-2">
            <Calendar className="w-3 h-3" />
            <span className="text-xs">
              {new Date(task.due_date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>
        )}
      </div>
      
      {/* Drag indicator */}
      {!isArchived && canMove && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-50 transition-opacity">
          <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
        </div>
      )}
      
      {/* Non-movable indicator with enhanced styling */}
      {!isArchived && !canMove && (
        <div className="absolute top-2 right-2 flex items-center">
          <div 
            className="w-5 h-5 bg-amber-100 border border-amber-300 rounded-full flex items-center justify-center shadow-sm"
            title="You can only move your own tasks"
          >
            <span className="text-xs text-amber-700">🔒</span>
          </div>
        </div>
      )}
      
      {/* Non-movable overlay for better visual feedback */}
      {!isArchived && !canMove && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-transparent to-gray-100/30 pointer-events-none">
          <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
            Own tasks only
          </div>
        </div>
      )}
    </div>
  )
}

interface ColumnProps {
  title: string
  status: string
  tasks: any[]
  isCompact?: boolean
  onTaskView: (task: any) => void
  onTaskEdit: (task: any) => void
  onTaskArchive: (taskId: string) => void
  onTaskDelete: (taskId: string) => void
  canMoveTask: (task: any) => boolean
  getProjectName: (projectId: string) => string
  getTeamMemberName: (userId: string) => string
  getPriorityColor: (priority: string) => string
  getStatusColor: (status: string) => string
}

const Column = ({ 
  title, 
  status, 
  tasks, 
  isCompact = false,
  onTaskView, 
  onTaskEdit,
  onTaskArchive, 
  onTaskDelete,
  canMoveTask,
  getProjectName,
  getTeamMemberName,
  getPriorityColor,
  getStatusColor
}: ColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  return (
    <div 
      ref={setNodeRef}
      className={`bg-gray-50 rounded-xl border-2 transition-all duration-200 flex flex-col ${
        isOver 
          ? 'bg-blue-50 border-blue-300 border-dashed shadow-lg' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      style={{ minHeight: '600px', maxHeight: '80vh' }}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
        <div className="flex items-center space-x-2">
          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm font-medium">
            {tasks.length}
          </span>
          {isOver && (
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>
      
      {/* Drop Zone Instructions */}
      {isOver && (
        <div className="mx-4 mt-2 p-3 bg-blue-100 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 text-center font-medium">
            Drop task here to move to {title}
          </p>
        </div>
      )}
      
      {/* Scrollable Task List */}
      <div className="flex-1 overflow-y-auto p-4 pt-3">
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          <div className={`space-y-3 min-h-full ${isCompact ? 'space-y-2' : 'space-y-3'}`}>
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl">📋</span>
                </div>
                <p className="text-sm font-medium">No tasks</p>
                <p className="text-xs">Drag tasks here or create new ones</p>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onView={onTaskView}
                  onEdit={onTaskEdit}
                  onArchive={onTaskArchive}
                  onUnarchive={() => {}}
                  onDelete={onTaskDelete}
                  isCompact={isCompact}
                  canMove={canMoveTask(task)}
                  getProjectName={getProjectName}
                  getTeamMemberName={getTeamMemberName}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                />
              ))
            )}
            
            {/* Bottom padding for better UX when many tasks */}
            <div className="h-20"></div>
          </div>
        </SortableContext>
      </div>
      
      {/* Footer with task count for many tasks */}
      {tasks.length > 5 && (
        <div className="p-3 pt-2 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} in {title}
          </p>
        </div>
      )}
    </div>
  )
}

const TaskBoard = () => {
  const { 
    tasks, 
    updateTask, 
    deleteTask,
    archiveTask,
    unarchiveTask,
    getArchivedTasks,
    getArchivedProjects,
    projects, 
    teamMembers,
    currentUser,
    addTask,
    loading
  } = useAppContext()

  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [showTaskDetails, setShowTaskDetails] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [archivedTasks, setArchivedTasks] = useState<any[]>([])
  const [archivedProjects, setArchivedProjects] = useState<any[]>([])
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [activeTask, setActiveTask] = useState<any>(null)
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null)

  // Enhanced TaskBoard features
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [compactView, setCompactView] = useState(false)

  // Utility functions
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return project ? project.name : 'No Project'
  }

  const getTeamMemberName = (userId: string) => {
    const member = teamMembers.find(m => m.id === userId)
    return member ? member.full_name : 'Unassigned'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800'
      case 'inprogress': return 'bg-blue-100 text-blue-800'
      case 'review': return 'bg-yellow-100 text-yellow-800'
      case 'done': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  // Helper function to check if a project is archived
  const isProjectArchived = (projectId: string) => {
    return archivedProjects.some(p => p.id === projectId)
  }

  // Helper function to check if user can drag/move a task
  const canMoveTask = (task: any) => {
    if (!currentUser) return false
    
    // Admins and managers can move any task
    if (currentUser.role === 'admin' || currentUser.role === 'manager') {
      return true
    }
    
    // Other roles can only move their own tasks
    return task.assigned_to === currentUser.id
  }

  // Enhanced filtering function - Show ALL team tasks (unlike Tasks.tsx which shows only user's tasks)
  const filterTasks = useMemo(() => {
    const baseFilter = (task: any) => {
      // First filter out archived tasks and tasks from archived projects
      if (task.archived || isProjectArchived(task.project_id)) return false

      // TaskBoard shows ALL team tasks (different from Tasks.tsx)
      // No user filtering here - team members can see all tasks for better coordination

      // Apply priority filter
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false
      
      // Apply project filter
      if (selectedProject !== 'all' && task.project_id !== selectedProject) return false
      
      // Apply assignee filter (now meaningful since we show all tasks)
      if (selectedAssignee !== 'all' && task.assigned_to !== selectedAssignee) return false
      
      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const projectName = getProjectName(task.project_id).toLowerCase()
        const assigneeName = getTeamMemberName(task.assigned_to).toLowerCase()
        
        return (
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query)) ||
          projectName.includes(query) ||
          assigneeName.includes(query) ||
          task.priority.toLowerCase().includes(query)
        )
      }
      
      return true
    }

    return baseFilter
  }, [selectedPriority, selectedProject, selectedAssignee, searchQuery, archivedProjects])

  // Filter tasks by status with enhanced filters
  const todoTasks = tasks.filter(task => task.status === 'todo' && filterTasks(task))
  const inProgressTasks = tasks.filter(task => task.status === 'inprogress' && filterTasks(task))
  const reviewTasks = tasks.filter(task => task.status === 'review' && filterTasks(task))
  const doneTasks = tasks.filter(task => task.status === 'done' && filterTasks(task))

  const columns = [
    { title: 'To Do', status: 'todo', tasks: todoTasks },
    { title: 'In Progress', status: 'inprogress', tasks: inProgressTasks },
    { title: 'Review', status: 'review', tasks: reviewTasks },
    { title: 'Done', status: 'done', tasks: doneTasks },
  ]

  // Get task counts for display
  const totalVisibleTasks = todoTasks.length + inProgressTasks.length + reviewTasks.length + doneTasks.length
  const totalAllTasks = tasks.filter(task => !task.archived && !isProjectArchived(task.project_id)).length

  // Load archived tasks when archive view is opened
  useEffect(() => {
    if (showArchive) {
      loadArchivedTasks(true) // Show error if user explicitly opens archive
    }
  }, [showArchive])

  // Load archived data on component mount to show correct count
  useEffect(() => {
    loadArchivedTasks(false) // Don't show error on initial load
    loadArchivedProjects(false) // Don't show error on initial load
  }, [])

  // Also reload archived data when the main lists change
  useEffect(() => {
    loadArchivedTasks(false) // Don't show error on automatic refresh
    loadArchivedProjects(false) // Don't show error on automatic refresh
  }, [tasks, projects])

  const loadArchivedTasks = async (showError = false) => {
    try {
      const archived = await getArchivedTasks()
      // Filter out tasks whose projects are archived
      const archivedProjectIds = new Set((await getArchivedProjects()).map(p => p.id))
      const filteredArchivedTasks = archived.filter(task => !archivedProjectIds.has(task.project_id))
      setArchivedTasks(filteredArchivedTasks)
    } catch (error) {
      console.error('Error loading archived tasks:', error)
      // Only show error notification if explicitly requested (e.g., user action)
      if (showError) {
        setNotification({ type: 'error', message: 'Failed to load archived tasks' })
      }
    }
  }

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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    setActiveTask(task)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    // If there's no drop target, the task will automatically return to its original position
    if (!over) {
      console.log('Task dropped outside valid drop zone - returning to original position');
      return;
    }

    const taskId = active.id as string;
    // Find the task being moved
    const task = tasks.find((t: any) => t.id === taskId);
    if (!task) {
      console.error('Task not found');
      return;
    }
    // Check if user has permission to move this task
    if (!canMoveTask(task)) {
      console.log('User does not have permission to move this task');
      setNotification({ 
        type: 'error', 
        message: 'You can only move your own tasks.' 
      });
      return;
    }

    let newStatus = over.id as string;
    // Handle different drop zone types
    if (!['todo', 'inprogress', 'review', 'done'].includes(newStatus)) {
      // Check if dropped on another task
      const targetTask = tasks.find((t: any) => t.id === newStatus);
      if (targetTask) {
        newStatus = targetTask.status;
      } 
      // Handle special drop zones (top, bottom, between)
      else if (newStatus.includes('-top') || newStatus.includes('-bottom') || newStatus.includes('-between-')) {
        const statusMatch = newStatus.match(/^(todo|inprogress|review|done)/);
        if (statusMatch) {
          newStatus = statusMatch[1];
        } else {
          console.log(`Invalid drop zone format: ${newStatus}`);
          setNotification({ 
            type: 'error', 
            message: 'Invalid drop target. Task returned to original position.' 
          });
          return;
        }
      }
      // Handle column drop zones
      else if (newStatus.startsWith('column-')) {
        newStatus = newStatus.replace('column-', '');
      } 
      // Handle tasks container drop zones
      else if (newStatus.startsWith('tasks-')) {
        newStatus = newStatus.replace('tasks-', '');
      } 
      else {
        console.log(`Unrecognized drop target: ${newStatus} - returning task to original position`);
        setNotification({ 
          type: 'error', 
          message: 'Invalid drop target. Task returned to original position.' 
        });
        return;
      }
    }
    // Validate that the determined status is valid
    const validStatuses = ['todo', 'inprogress', 'review', 'done'];
    if (!validStatuses.includes(newStatus)) {
      console.log(`Invalid status determined: ${newStatus} - returning task to original position`);
      setNotification({ 
        type: 'error', 
        message: 'Invalid drop target. Task returned to original position.' 
      });
      return;
    }
    // If the task is already in the target status, no need to update
    if (task.status === newStatus) {
      console.log('Task already in target status');
      return;
    }

    // Show loader while moving task
    setMovingTaskId(taskId);
    try {
      await updateTask(taskId, { status: newStatus });
      const statusDisplayName = newStatus === 'inprogress' ? 'In Progress' : 
        newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      setNotification({ 
        type: 'success', 
        message: `Task moved to ${statusDisplayName}!` 
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      setNotification({ 
        type: 'error', 
        message: 'Failed to move task. Task returned to original position.' 
      });
      // Note: The task will automatically return to its original position 
      // since the state wasn't updated due to the error
    }
    setMovingTaskId(null);
  }

  const handleTaskView = (task: any) => {
    setSelectedTask(task)
    setShowTaskDetails(true)
  }

  const handleTaskEdit = (task: any) => {
    setEditingTask(task)
    setNewTask({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date || '',
      assigned_to: task.assigned_to || '',
      project_id: task.project_id || '',
      deliverable_link: task.deliverable_link || '',
      video_link: task.video_link || '',
      priority: task.priority
    })
    setShowNewTaskModal(true)
  }

  const handleTaskArchive = async (taskId: string) => {
    try {
      await archiveTask(taskId)
      // Reload archived tasks to update the count and list
      await loadArchivedTasks(true)
      setNotification({ type: 'success', message: 'Task archived successfully!' })
    } catch (error) {
      console.error('Error archiving task:', error)
      setNotification({ type: 'error', message: 'Failed to archive task' })
    }
  }

  const handleTaskUnarchive = async (taskId: string) => {
    try {
      await unarchiveTask(taskId)
      // Reload archived tasks to update the count and list
      await loadArchivedTasks(true)
      setNotification({ type: 'success', message: 'Task unarchived successfully!' })
    } catch (error) {
      console.error('Error unarchiving task:', error)
      setNotification({ type: 'error', message: 'Failed to unarchive task' })
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId)
        // Reload archived tasks to update the count and list
        await loadArchivedTasks(true)
        setNotification({ type: 'success', message: 'Task deleted successfully!' })
      } catch (error) {
        console.error('Error deleting task:', error)
        setNotification({ type: 'error', message: 'Failed to delete task' })
      }
    }
  }

  const createOrUpdateTask = async () => {
    if (!newTask.title) {
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
          priority: newTask.priority
        })
        setNotification({ type: 'success', message: 'Task updated successfully!' })
      } else {
        // Create new task
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
        setNotification({ type: 'success', message: 'Task created successfully!' })
      }

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
      setEditingTask(null)
      setShowNewTaskModal(false)
    } catch (error: any) {
      console.error('Error saving task:', error)
      setNotification({ type: 'error', message: error.message || 'Failed to save task' })
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
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Loader overlay for moving task */}
      {movingTaskId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[100]">
          <div className="flex flex-col items-center space-y-4 bg-white rounded-lg p-8 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-700 font-medium">Moving task...</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
          <p className="text-gray-600">
            Team task management with drag & drop
            {currentUser?.role !== 'admin' && currentUser?.role !== 'manager' && (
              <span className="text-sm text-gray-500 ml-2">(You can only move your own tasks)</span>
            )}
          </p>
          {totalVisibleTasks !== totalAllTasks && (
            <p className="text-sm text-blue-600 mt-1">
              Showing {totalVisibleTasks} of {totalAllTasks} team tasks
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          <button
            onClick={() => setCompactView(!compactView)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              compactView ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Compact</span>
          </button>
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
            <span>Archive ({archivedTasks.length})</span>
          </button>
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
                priority: 'medium'
              })
              setShowNewTaskModal(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded-lg ${
          notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Enhanced Filter Controls */}
      {showFilters && (
        <div className="mb-6 bg-white rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Tasks</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by title, description, project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Priority Filter */}
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

            {/* Project Filter */}
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

            {/* Assignee Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Assignees</option>
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>{member.full_name}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="lg:col-span-4 flex justify-end">
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedPriority('all')
                  setSelectedProject('all')
                  setSelectedAssignee('all')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Section */}
      {showArchive && (
        <div className="mb-6 bg-white rounded-lg p-4 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Archived Tasks</h2>
          {archivedTasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No archived tasks</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {archivedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onView={handleTaskView}
                  onEdit={() => {}} // Disable editing for archived tasks
                  onArchive={() => {}}
                  onUnarchive={handleTaskUnarchive}
                  onDelete={handleTaskDelete}
                  isArchived={true}
                  canMove={false} // Archived tasks cannot be moved
                  getProjectName={getProjectName}
                  getTeamMemberName={getTeamMemberName}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading tasks...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Task Board */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map((column) => (
            <div key={column.status}>
              <Column
                title={column.title}
                status={column.status}
                tasks={column.tasks}
                isCompact={compactView}
                onTaskView={handleTaskView}
                onTaskEdit={handleTaskEdit}
                onTaskArchive={handleTaskArchive}
                onTaskDelete={handleTaskDelete}
                canMoveTask={canMoveTask}
                getProjectName={getProjectName}
                getTeamMemberName={getTeamMemberName}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
              />
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="bg-white rounded-lg shadow-lg border-2 border-blue-300 p-4 opacity-90 transform rotate-3">
              <h3 className="font-semibold text-gray-900 text-sm">{activeTask.title}</h3>
              <p className="text-xs text-gray-600 mt-1">{getProjectName(activeTask.project_id)}</p>
              <div className="flex items-center justify-between mt-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(activeTask.priority)}`}>
                  {activeTask.priority}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activeTask.status)}`}>
                  {activeTask.status}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
        </>
      )}

      {/* Add Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h2>
              <button
                onClick={() => {
                  setShowNewTaskModal(false)
                  setEditingTask(null)
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
                }}
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
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter task description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select
                  value={newTask.project_id}
                  onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select project</option>
                  {projects.filter(project => !isProjectArchived(project.id)).map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deliverable Link</label>
                <input
                  type="url"
                  value={newTask.deliverable_link}
                  onChange={(e) => setNewTask({ ...newTask, deliverable_link: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/deliverable"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video Link</label>
                <input
                  type="url"
                  value={newTask.video_link}
                  onChange={(e) => setNewTask({ ...newTask, video_link: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/video"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowNewTaskModal(false)
                  setEditingTask(null)
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
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createOrUpdateTask}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingTask ? 'Update Task' : 'Create Task'}
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
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${
                  selectedTask.priority === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                  selectedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                  'bg-green-100 text-green-800 border-green-200'
                }`}>
                  {selectedTask.priority} Priority
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  selectedTask.status === 'todo' ? 'bg-gray-100 text-gray-800' :
                  selectedTask.status === 'inprogress' ? 'bg-blue-100 text-blue-800' :
                  selectedTask.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {selectedTask.status === 'inprogress' ? 'In Progress' : selectedTask.status}
                </span>
                {selectedTask.archived && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-orange-100 text-orange-800">
                    Archived
                  </span>
                )}
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
                  <p className="text-gray-700">{projects.find(p => p.id === selectedTask.project_id)?.name || 'No Project'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Assigned To</h4>
                  <p className="text-gray-700">{teamMembers.find(m => m.id === selectedTask.assigned_to)?.full_name || 'Unassigned'}</p>
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
                      <div>
                        <a
                          href={selectedTask.deliverable_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          🔗 Deliverable Link
                        </a>
                      </div>
                    )}
                    {selectedTask.video_link && (
                      <div>
                        <a
                          href={selectedTask.video_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          🎥 Video Link
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

export default TaskBoard
