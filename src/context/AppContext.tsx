import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
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
  resumeTimeEntry: (entry: any) => void
  
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
  teamMembers: Profile[]
  
  // Actions
  addTimeEntry: (entry: Omit<TimeEntryInsert, 'user_id' | 'company_id'>) => Promise<void>
  updateTimeEntry: (id: string, updates: any) => Promise<void>
  deleteTimeEntry: (id: string) => Promise<void>
  
  addTask: (task: Omit<TaskInsert, 'created_by' | 'company_id'>) => Promise<void>
  updateTask: (id: string, updates: any) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  archiveTask: (id: string) => Promise<void>
  unarchiveTask: (id: string) => Promise<void>
  getArchivedTasks: () => Promise<any[]>
  
  addClient: (client: Omit<ClientInsert, 'created_by' | 'company_id'>) => Promise<void>
  updateClient: (id: string, updates: any) => Promise<void>
  deleteClient: (id: string) => Promise<void>
  
  addProject: (project: Omit<ProjectInsert, 'created_by' | 'company_id'>) => Promise<void>
  updateProject: (id: string, updates: any) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  archiveProject: (id: string) => Promise<void>
  unarchiveProject: (id: string) => Promise<void>
  getArchivedProjects: () => Promise<any[]>

  // Team management
  inviteUser: (email: string, role: 'manager' | 'team-member' | 'client', fullName?: string) => Promise<void>

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
  // Load timer state from localStorage
  const loadTimerFromStorage = (): TimerState => {
    try {
      const savedTimer = localStorage.getItem('teamflow-timer-state')
      if (savedTimer) {
        const parsed = JSON.parse(savedTimer)
        // Convert startTime back to Date object if it exists
        if (parsed.startTime) {
          parsed.startTime = new Date(parsed.startTime)
        }
        return parsed
      }
    } catch (error) {
      console.error('Error loading timer from localStorage:', error)
    }
    
    return {
      isTracking: false,
      currentTime: 0,
      selectedProject: '',
      selectedClient: '',
      selectedTask: '',
      description: '',
      startTime: null
    }
  }

  // Save timer state to localStorage
  const saveTimerToStorage = (timerState: TimerState) => {
    try {
      localStorage.setItem('teamflow-timer-state', JSON.stringify(timerState))
    } catch (error) {
      console.error('Error saving timer to localStorage:', error)
    }
  }
  
  // Timer state
  const [timer, setTimerState] = useState<TimerState>(loadTimerFromStorage)

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
  const [teamMembers, setTeamMembers] = useState<Profile[]>([])

  // Load user profile
  useEffect(() => {
    if (user?.id) {
      loadUserProfile()
    } else {
      setCurrentUser(null)
      setLoading(false)
      // Clear timer state when user logs out
      const clearedTimer = {
        isTracking: false,
        currentTime: 0,
        selectedProject: '',
        selectedClient: '',
        selectedTask: '',
        description: '',
        startTime: null
      }
      setTimerState(clearedTimer)
      localStorage.removeItem('teamflow-timer-state')
    }
  }, [user])

  // Load data when user is available AND properly authenticated
  useEffect(() => {
    if (currentUser?.company_id && user?.id) {
      loadAllData()
      setupRealtimeSubscriptions()
    }
  }, [currentUser, user])

  // Timer effect - simple timer that increments every second when tracking
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (timer.isTracking) {
      console.log('Timer started/resumed:', {
        startTime: timer.startTime,
        currentTime: timer.currentTime,
        isTracking: timer.isTracking
      })
      
      // Main timer interval
      interval = setInterval(() => {
        setTimerState(prev => {
          const newState = { ...prev, currentTime: prev.currentTime + 1 }
          saveTimerToStorage(newState)
          return newState
        })
      }, 1000)
    }
    
    return () => {
      if (interval) {
        console.log('Timer interval cleared')
        clearInterval(interval)
      }
    }
  }, [timer.isTracking, timer.startTime])

  // Simple warning effect - warn user when leaving page with active timer
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Only show warning if timer is tracking AND we're not in the middle of a manual stop
      const isManualStop = localStorage.getItem('teamflow-manual-stop') === 'true'
      
      if (timer.isTracking && timer.currentTime > 0 && !isManualStop) {
        // Show warning to user
        event.preventDefault()
        event.returnValue = 'You have an active timer running. Leaving this page will not save your time.'
        return 'You have an active timer running. Leaving this page will not save your time.'
      }
    }

    // Add event listener
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [timer.isTracking, timer.currentTime])

  const loadUserProfile = async () => {
    if (!user?.id) {
      console.warn('No user ID available for loading profile')
      setLoading(false)
      return
    }

    // Additional check: verify user is actually authenticated
    try {
      const { data: { user: currentAuthUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !currentAuthUser || currentAuthUser.id !== user.id) {
        console.warn('User not properly authenticated')
        setCurrentUser(null)
        setLoading(false)
        return
      }
    } catch (authCheckError) {
      console.warn('Failed to verify authentication:', authCheckError)
      setCurrentUser(null)
      setLoading(false)
      return
    }
    
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
    } catch (error: any) {
      console.error('Error loading user profile:', error)
      
      // Don't try to create profiles manually - this should be handled by signup trigger
      // For now, just set loading to false and let the user go through proper signup
      setCurrentUser(null)
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const loadAllData = async () => {
    if (!currentUser?.company_id) {
      console.warn('Cannot load data: user not properly associated with company')
      return
    }
    
    try {
      setLoading(true)
      
      // Load data based on user role
      const [clientsData, projectsData, tasksData, timeEntriesData, teamMembersData] = await Promise.all([
        DatabaseService.getClients().catch(err => {
          console.warn('Failed to load clients:', err)
          return []
        }),
        DatabaseService.getProjects().catch(err => {
          console.warn('Failed to load projects:', err)
          return []
        }),
        DatabaseService.getTasks().catch(err => {
          console.warn('Failed to load tasks:', err)
          return []
        }),
        (currentUser.role === 'team-member' 
          ? DatabaseService.getTimeEntriesWithUserRates(currentUser.id)
          : DatabaseService.getTimeEntriesWithUserRates()
        ).catch(err => {
          console.warn('Failed to load time entries:', err)
          return []
        }),
        DatabaseService.getAllProfiles().catch(err => {
          console.warn('Failed to load team members:', err)
          return []
        })
      ])

      setClients(clientsData || [])
      setProjects(projectsData || [])
      setTasks(tasksData || [])
      setTimeEntries(timeEntriesData || [])
      setTeamMembers(teamMembersData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscriptions = async () => {
    if (!currentUser) return

    // Subscribe to changes based on user role
    const subscriptions = await Promise.all([
      DatabaseService.subscribeToTable('clients', handleRealtimeUpdate),
      DatabaseService.subscribeToTable('projects', handleRealtimeUpdate),
      DatabaseService.subscribeToTable('tasks', handleRealtimeUpdate),
      DatabaseService.subscribeToTable('time_entries', handleRealtimeUpdate)
    ])

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
    setTimerState(prev => {
      const newState = { ...prev, ...updates }
      saveTimerToStorage(newState)
      return newState
    })
  }

  const startTimer = () => {
    if (!timer.selectedProject || !timer.selectedClient) {
      alert('Please select client and project before starting timer')
      return
    }
    const startTime = new Date()
    const newState = {
      ...timer,
      isTracking: true,
      currentTime: 0,
      startTime
    }
    console.log('Starting new timer session:', {
      startTime: startTime.toISOString(),
      project: timer.selectedProject,
      client: timer.selectedClient,
      task: timer.selectedTask
    })
    setTimerState(newState)
    saveTimerToStorage(newState)
  }

  const stopTimer = async () => {
    if (!timer.startTime || !currentUser) return
    
    // Mark that we're manually stopping the timer to prevent auto-save duplicates
    localStorage.setItem('teamflow-manual-stop', 'true')
    
    const now = new Date()
    
    // Calculate precise duration from actual start/end times instead of timer.currentTime
    const durationInMinutes = (now.getTime() - timer.startTime.getTime()) / (1000 * 60)
    
    // FIXED: Determine the date using local timezone to prevent date shifts
    // If timer crosses midnight, use start date (local time, not UTC)
    const startDate = timer.startTime
    const entryDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
    
    try {
      // Check if there's already an entry with the same start time (to prevent duplicates)
      const existingEntry = await DatabaseService.findTimeEntryByStartTime(
        timer.startTime.toISOString(), 
        currentUser.id
      )
      
      if (existingEntry) {
        console.log('Found existing entry with same start time, updating instead of creating new:', existingEntry.id)
        
        // Update the existing entry
        await DatabaseService.updateTimeEntry(existingEntry.id, {
          end_time: now.toISOString(),
          duration: durationInMinutes,
          description: timer.description || existingEntry.description
        })
        
        console.log('Updated existing timer entry successfully')
      } else {
        // Create new entry
        const newEntry: Omit<TimeEntryInsert, 'user_id' | 'company_id'> = {
          project_id: timer.selectedProject,
          task_id: timer.selectedTask || null,
          description: timer.description || 'Timer session',
          start_time: timer.startTime.toISOString(),
          end_time: now.toISOString(),
          duration: durationInMinutes,
          date: entryDate
        }
        
        await addTimeEntry(newEntry)
        console.log('Created new timer entry successfully')
      }
      
      // Clear any pending auto-save since we successfully saved manually
      localStorage.removeItem('teamflow-pending-timer-save')
      
      console.log('Timer manually stopped and saved successfully')
    } catch (error) {
      console.error('Error saving timer manually:', error)
      // If manual save fails, keep the timer state so auto-save can handle it
      localStorage.removeItem('teamflow-manual-stop')
      throw error
    }
    
    const newState = {
      ...timer,
      isTracking: false,
      currentTime: 0,
      description: '',
      startTime: null
    }
    setTimerState(newState)
    saveTimerToStorage(newState)
    
    // Clear the manual stop flag after successful save and state reset
    setTimeout(() => {
      localStorage.removeItem('teamflow-manual-stop')
    }, 1000)
  }

  const resumeTimeEntry = (entry: any) => {
    // Get project details to set client
    const project = projects.find(p => p.id === entry.project_id)
    
    const newState = {
      isTracking: true,
      currentTime: 0,
      selectedProject: entry.project_id,
      selectedClient: project?.client_id || '',
      selectedTask: entry.task_id || '',
      description: entry.description || '',
      startTime: new Date()
    }
    setTimerState(newState)
    saveTimerToStorage(newState)
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
  const addTimeEntry = async (entry: Omit<TimeEntryInsert, 'user_id' | 'company_id'>) => {
    if (!currentUser) return
    
    try {
      await DatabaseService.createTimeEntry({
        ...entry,
        user_id: currentUser.id
      })
      // Refresh time entries with user rates
      const timeEntriesData = currentUser.role === 'team-member' 
        ? await DatabaseService.getTimeEntriesWithUserRates(currentUser.id)
        : await DatabaseService.getTimeEntriesWithUserRates(currentUser.id) // Always filter by current user in Time Tracker
      setTimeEntries(timeEntriesData || [])
    } catch (error) {
      console.error('Error adding time entry:', error)
      throw error
    }
  }

  const updateTimeEntry = async (id: string, updates: any) => {
    try {
      await DatabaseService.updateTimeEntry(id, updates)
      // Refresh time entries with user rates
      const timeEntriesData = currentUser?.role === 'team-member' 
        ? await DatabaseService.getTimeEntriesWithUserRates(currentUser.id)
        : await DatabaseService.getTimeEntriesWithUserRates()
      setTimeEntries(timeEntriesData || [])
    } catch (error) {
      console.error('Error updating time entry:', error)
      throw error
    }
  }

  const deleteTimeEntry = async (id: string) => {
    try {
      await DatabaseService.deleteTimeEntry(id)
      // Refresh time entries with user rates
      const timeEntriesData = currentUser?.role === 'team-member' 
        ? await DatabaseService.getTimeEntriesWithUserRates(currentUser.id)
        : await DatabaseService.getTimeEntriesWithUserRates()
      setTimeEntries(timeEntriesData || [])
    } catch (error) {
      console.error('Error deleting time entry:', error)
      throw error
    }
  }

  const addTask = async (task: Omit<TaskInsert, 'created_by' | 'company_id'>) => {
    if (!currentUser) return
    
    try {
      const newTask = await DatabaseService.createTask({
        ...task,
        created_by: currentUser.user_id
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

  const archiveTask = async (id: string) => {
    try {
      await DatabaseService.archiveTask(id)
      setTasks(prev => prev.filter(task => task.id !== id))
    } catch (error) {
      console.error('Error archiving task:', error)
      throw error
    }
  }

  const unarchiveTask = async (id: string) => {
    try {
      const unarchivedTask = await DatabaseService.unarchiveTask(id)
      setTasks(prev => [unarchivedTask, ...prev])
    } catch (error) {
      console.error('Error unarchiving task:', error)
      throw error
    }
  }

  const getArchivedTasks = async () => {
    try {
      return await DatabaseService.getArchivedTasks()
    } catch (error) {
      console.error('Error getting archived tasks:', error)
      throw error
    }
  }

  const addClient = async (client: Omit<ClientInsert, 'created_by' | 'company_id'>) => {
    if (!currentUser) return
    
    try {
      const newClient = await DatabaseService.createClient({
        ...client,
        created_by: currentUser.id // This is now nullable so it's safe
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

  const addProject = async (project: Omit<ProjectInsert, 'created_by' | 'company_id'>) => {
    if (!currentUser) {
      console.error('No current user available for project creation')
      throw new Error('User not authenticated')
    }
    
    console.log('Creating project with user:', { 
      userId: currentUser.id, 
      email: user?.email,
      projectData: project 
    })
    
    try {
      const newProject = await DatabaseService.createProject({
        ...project,
        created_by: currentUser.id
      })
      console.log('Project created successfully:', newProject)
      setProjects(prev => [newProject, ...prev])
    } catch (error: any) {
      console.error('Error adding project:', error)
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      })
      throw error
    }
  }

  const updateProject = async (id: string, updates: any) => {
    try {
      const updatedProject = await DatabaseService.updateProject(id, updates)
      setProjects(prev => prev.map(project => 
        project.id === id ? updatedProject : project
      ))
      
      // If the project was archived/unarchived, refresh tasks to reflect the trigger changes
      if (updates.hasOwnProperty('archived')) {
        console.log('Project archived status changed, refreshing tasks...')
        try {
          const updatedTasks = await DatabaseService.getTasks()
          setTasks(updatedTasks)
        } catch (error) {
          console.warn('Failed to refresh tasks after project archive:', error)
        }
      }
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

  const archiveProject = async (id: string) => {
    try {
      await DatabaseService.archiveProject(id)
      // Remove the project from the active projects list
      setProjects(prev => prev.filter(project => project.id !== id))
      
      // Refresh tasks to reflect the archived tasks from the database trigger
      console.log('Project archived, refreshing tasks...')
      try {
        const updatedTasks = await DatabaseService.getTasks()
        setTasks(updatedTasks)
      } catch (error) {
        console.warn('Failed to refresh tasks after project archive:', error)
      }
    } catch (error) {
      console.error('Error archiving project:', error)
      throw error
    }
  }

  const unarchiveProject = async (id: string) => {
    try {
      const unArchivedProject = await DatabaseService.unarchiveProject(id)
      // Add the project back to the active projects list
      setProjects(prev => [unArchivedProject, ...prev])
      
      // Refresh tasks to reflect the unarchived tasks from the database trigger
      console.log('Project unarchived, refreshing tasks...')
      try {
        const updatedTasks = await DatabaseService.getTasks()
        setTasks(updatedTasks)
      } catch (error) {
        console.warn('Failed to refresh tasks after project unarchive:', error)
      }
    } catch (error) {
      console.error('Error unarchiving project:', error)
      throw error
    }
  }

  const getArchivedProjects = async () => {
    try {
      return await DatabaseService.getArchivedProjects()
    } catch (error) {
      console.error('Error fetching archived projects:', error)
      throw error
    }
  }

  // Team management
  const inviteUser = async (email: string, role: 'manager' | 'team-member' | 'client', fullName?: string) => {
    if (!currentUser?.company_id || !user?.id) {
      throw new Error('User not properly authenticated')
    }

    try {
      await DatabaseService.createInvitation({
        company_id: currentUser.company_id,
        email,
        role,
        invited_by: user.id,
        full_name: fullName || email.split('@')[0] // Use email prefix if no name provided
      })
      
      // Refresh team data
      await refreshData()
    } catch (error) {
      console.error('Error inviting user:', error)
      throw error
    }
  }

  const value: AppContextType = {
    loading,
    timer,
    setTimer,
    startTimer,
    stopTimer,
    resumeTimeEntry,
    currentUser,
    settings,
    updateSettings,
    timeEntries,
    tasks,
    clients,
    projects,
    teamMembers,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    addTask,
    updateTask,
    deleteTask,
    archiveTask,
    unarchiveTask,
    getArchivedTasks,
    addClient,
    updateClient,
    deleteClient,
    addProject,
    updateProject,
    deleteProject,
    archiveProject,
    unarchiveProject,
    getArchivedProjects,
    inviteUser,
    refreshData
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}