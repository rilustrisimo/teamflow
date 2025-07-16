import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { DatabaseService } from '../lib/database'
import type { 
  Profile, 
  Client, 
  ClientInsert,
  ProjectInsert,
  TaskInsert,
  TimeEntryInsert
} from '../lib/database'

interface TimerState {
  isTracking: boolean
  currentTime: number
  selectedProject: string
  selectedClient: string
  selectedTask: string
  description: string
  startTime: Date | null
}

interface WorkSchedule {
  monday: { enabled: boolean; start: string; end: string }
  tuesday: { enabled: boolean; start: string; end: string }
  wednesday: { enabled: boolean; start: string; end: string }
  thursday: { enabled: boolean; start: string; end: string }
  friday: { enabled: boolean; start: string; end: string }
  saturday: { enabled: boolean; start: string; end: string }
  sunday: { enabled: boolean; start: string; end: string }
  timezone: string
}

interface Settings {
  workSchedule: WorkSchedule
  reminderEnabled: boolean
  reminderInterval: number
}

interface AppContextType {
  // Loading states
  loading: boolean
  
  // Timer state
  timer: TimerState
  setTimer: (timer: Partial<TimerState>) => void
  startTimer: () => void
  stopTimer: () => void
  
  // User context
  currentUser: Profile | null
  
  // Settings
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => void
  
  // Data
  timeEntries: any[]
  tasks: any[]
  clients: Client[]
  projects: any[]
  
  // Actions
  addTimeEntry: (entry: Omit<TimeEntryInsert, 'user_id'>) => Promise<void>
  updateTimeEntry: (id: string, updates: any) => Promise<void>
  deleteTimeEntry: (id: string) => Promise<void>
  
  addTask: (task: Omit<TaskInsert, 'created_by'>) => Promise<void>
  updateTask: (id: string, updates: any) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  
  addClient: (client: Omit<ClientInsert, 'created_by'>) => Promise<void>
  updateClient: (id: string, updates: any) => Promise<void>
  deleteClient: (id: string) => Promise<void>
  
  addProject: (project: Omit<ProjectInsert, 'created_by'>) => Promise<void>
  updateProject: (id: string, updates: any) => Promise<void>
  deleteProject: (id: string) => Promise<void>

  // Refresh data
  refreshData: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  
  // Loading state
  const [loading, setLoading] = useState(true)
  
  // Timer state
  const [timer, setTimerState] = useState<TimerState>({
    isTracking: false,
    currentTime: 0,
    selectedProject: '',
    selectedClient: '',
    selectedTask: '',
    description: '',
    startTime: null
  })

  // Settings state
  const [settings, setSettings] = useState<Settings>({
    workSchedule: {
      monday: { enabled: true, start: '08:00', end: '18:00' },
      tuesday: { enabled: true, start: '08:00', end: '18:00' },
      wednesday: { enabled: true, start: '08:00', end: '18:00' },
      thursday: { enabled: true, start: '08:00', end: '18:00' },
      friday: { enabled: true, start: '08:00', end: '18:00' },
      saturday: { enabled: false, start: '08:00', end: '18:00' },
      sunday: { enabled: false, start: '08:00', end: '18:00' },
      timezone: 'America/New_York'
    },
    reminderEnabled: true,
    reminderInterval: 15
  })

  // Current user profile
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)

  // Data states
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<any[]>([])

  // Load user profile
  useEffect(() => {
    if (user) {
      loadUserProfile()
    } else {
      setCurrentUser(null)
      setLoading(false)
    }
  }, [user])

  // Load data when user is available
  useEffect(() => {
    if (currentUser) {
      loadAllData()
      setupRealtimeSubscriptions()
    }
  }, [currentUser])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timer.isTracking) {
      interval = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          currentTime: prev.currentTime + 1
        }))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timer.isTracking])

  const loadUserProfile = async () => {
    if (!user) return
    
    try {
      const profile = await DatabaseService.getProfile(user.id)
      setCurrentUser(profile)
      
      // Load user settings
      try {
        const userSettings = await DatabaseService.getUserSettings(user.id)
        if (userSettings) {
          setSettings(prev => ({
            ...prev,
            ...userSettings,
            workSchedule: userSettings.work_schedule || prev.workSchedule
          }))
        }
      } catch (error) {
        console.log('No user settings found, using defaults')
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAllData = async () => {
    if (!currentUser) return
    
    try {
      setLoading(true)
      
      // Load data based on user role
      const [clientsData, projectsData, tasksData, timeEntriesData] = await Promise.all([
        DatabaseService.getClients(),
        DatabaseService.getProjects(),
        DatabaseService.getTasks(),
        currentUser.role === 'team-member' 
          ? DatabaseService.getTimeEntries(currentUser.id)
          : DatabaseService.getTimeEntries()
      ])

      setClients(clientsData || [])
      setProjects(projectsData || [])
      setTasks(tasksData || [])
      setTimeEntries(timeEntriesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscriptions = () => {
    if (!currentUser) return

    // Subscribe to changes based on user role
    const subscriptions = [
      DatabaseService.subscribeToTable('clients', handleRealtimeUpdate),
      DatabaseService.subscribeToTable('projects', handleRealtimeUpdate),
      DatabaseService.subscribeToTable('tasks', handleRealtimeUpdate),
      DatabaseService.subscribeToTable('time_entries', handleRealtimeUpdate)
    ]

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe())
    }
  }

  const handleRealtimeUpdate = (payload: any) => {
    console.log('Realtime update:', payload)
    // Refresh data when changes occur
    refreshData()
  }

  const refreshData = async () => {
    await loadAllData()
  }

  // Timer actions
  const setTimer = (updates: Partial<TimerState>) => {
    setTimerState(prev => ({ ...prev, ...updates }))
  }

  const startTimer = () => {
    if (!timer.selectedProject || !timer.selectedClient || !timer.selectedTask) {
      alert('Please select client, project, and task before starting timer')
      return
    }
    setTimerState(prev => ({
      ...prev,
      isTracking: true,
      currentTime: 0,
      startTime: new Date()
    }))
  }

  const stopTimer = async () => {
    if (!timer.startTime || !currentUser) return
    
    const duration = timer.currentTime / 3600 // convert to hours
    const now = new Date()
    
    // Find project and task IDs
    const project = projects.find(p => p.name === timer.selectedProject)
    const task = tasks.find(t => t.title === timer.selectedTask)
    
    const newEntry: Omit<TimeEntryInsert, 'user_id'> = {
      project_id: project?.id || null,
      task_id: task?.id || null,
      description: timer.description || 'Timer session',
      start_time: timer.startTime.toTimeString().slice(0, 5),
      end_time: now.toTimeString().slice(0, 5),
      duration: Math.round(duration * 100) / 100,
      date: now.toISOString().split('T')[0]
    }
    
    await addTimeEntry(newEntry)
    setTimerState(prev => ({
      ...prev,
      isTracking: false,
      currentTime: 0,
      description: '',
      startTime: null
    }))
  }

  // Settings actions
  const updateSettings = async (updates: Partial<Settings>) => {
    if (!currentUser) return
    
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
    
    try {
      await DatabaseService.updateUserSettings(currentUser.id, {
        work_schedule: newSettings.workSchedule,
        reminder_enabled: newSettings.reminderEnabled,
        reminder_interval: newSettings.reminderInterval
      })
    } catch (error) {
      console.error('Error updating settings:', error)
    }
  }

  // Data actions
  const addTimeEntry = async (entry: Omit<TimeEntryInsert, 'user_id'>) => {
    if (!currentUser) return
    
    try {
      const newEntry = await DatabaseService.createTimeEntry({
        ...entry,
        user_id: currentUser.id
      })
      setTimeEntries(prev => [newEntry, ...prev])
    } catch (error) {
      console.error('Error adding time entry:', error)
      throw error
    }
  }

  const updateTimeEntry = async (id: string, updates: any) => {
    try {
      const updatedEntry = await DatabaseService.updateTimeEntry(id, updates)
      setTimeEntries(prev => prev.map(entry => 
        entry.id === id ? updatedEntry : entry
      ))
    } catch (error) {
      console.error('Error updating time entry:', error)
      throw error
    }
  }

  const deleteTimeEntry = async (id: string) => {
    try {
      await DatabaseService.deleteTimeEntry(id)
      setTimeEntries(prev => prev.filter(entry => entry.id !== id))
    } catch (error) {
      console.error('Error deleting time entry:', error)
      throw error
    }
  }

  const addTask = async (task: Omit<TaskInsert, 'created_by'>) => {
    if (!currentUser) return
    
    try {
      const newTask = await DatabaseService.createTask({
        ...task,
        created_by: currentUser.id
      })
      setTasks(prev => [newTask, ...prev])
    } catch (error) {
      console.error('Error adding task:', error)
      throw error
    }
  }

  const updateTask = async (id: string, updates: any) => {
    try {
      const updatedTask = await DatabaseService.updateTask(id, updates)
      setTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ))
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  }

  const deleteTask = async (id: string) => {
    try {
      await DatabaseService.deleteTask(id)
      setTasks(prev => prev.filter(task => task.id !== id))
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  }

  const addClient = async (client: Omit<ClientInsert, 'created_by'>) => {
    if (!currentUser) return
    
    try {
      const newClient = await DatabaseService.createClient({
        ...client,
        created_by: currentUser.id
      })
      setClients(prev => [newClient, ...prev])
    } catch (error) {
      console.error('Error adding client:', error)
      throw error
    }
  }

  const updateClient = async (id: string, updates: any) => {
    try {
      const updatedClient = await DatabaseService.updateClient(id, updates)
      setClients(prev => prev.map(client => 
        client.id === id ? updatedClient : client
      ))
    } catch (error) {
      console.error('Error updating client:', error)
      throw error
    }
  }

  const deleteClient = async (id: string) => {
    try {
      await DatabaseService.deleteClient(id)
      setClients(prev => prev.filter(client => client.id !== id))
    } catch (error) {
      console.error('Error deleting client:', error)
      throw error
    }
  }

  const addProject = async (project: Omit<ProjectInsert, 'created_by'>) => {
    if (!currentUser) return
    
    try {
      const newProject = await DatabaseService.createProject({
        ...project,
        created_by: currentUser.id
      })
      setProjects(prev => [newProject, ...prev])
    } catch (error) {
      console.error('Error adding project:', error)
      throw error
    }
  }

  const updateProject = async (id: string, updates: any) => {
    try {
      const updatedProject = await DatabaseService.updateProject(id, updates)
      setProjects(prev => prev.map(project => 
        project.id === id ? updatedProject : project
      ))
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }

  const deleteProject = async (id: string) => {
    try {
      await DatabaseService.deleteProject(id)
      setProjects(prev => prev.filter(project => project.id !== id))
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  }

  const value: AppContextType = {
    loading,
    timer,
    setTimer,
    startTimer,
    stopTimer,
    currentUser,
    settings,
    updateSettings,
    timeEntries,
    tasks,
    clients,
    projects,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    addTask,
    updateTask,
    deleteTask,
    addClient,
    updateClient,
    deleteClient,
    addProject,
    updateProject,
    deleteProject,
    refreshData
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}