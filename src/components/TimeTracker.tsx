import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import { Play, Calendar, Download, Edit, Save, X, Plus, Loader2, Clock, Trash2, Pause, RotateCcw, Timer } from 'lucide-react'

const TimeTracker = () => {
  const { 
    timer, 
    setTimer, 
    startTimer, 
    stopTimer,
    resumeTimeEntry,
    timeEntries, 
    addTimeEntry, 
    updateTimeEntry, 
    deleteTimeEntry,
    projects,
    clients,
    tasks,
    loading
  } = useAppContext()

  const [filterDate, setFilterDate] = useState('')
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualEntry, setManualEntry] = useState({
    projectId: '',
    clientId: '',
    taskId: '',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '',
    description: ''
  })

  // Filtered data based on selections
  const filteredProjects = useMemo(() => {
    if (!manualEntry.clientId) return projects.filter(p => !p.archived)
    return projects.filter(p => p.client_id === manualEntry.clientId && !p.archived)
  }, [projects, manualEntry.clientId])

  const filteredTasks = useMemo(() => {
    if (!manualEntry.projectId) return []
    return tasks.filter(t => t.project_id === manualEntry.projectId && !t.archived)
  }, [tasks, manualEntry.projectId])

  // Timer filtered projects and tasks
  const timerFilteredProjects = useMemo(() => {
    if (!timer.selectedClient) return projects.filter(p => !p.archived)
    return projects.filter(p => p.client_id === timer.selectedClient && !p.archived)
  }, [projects, timer.selectedClient])

  const timerFilteredTasks = useMemo(() => {
    if (!timer.selectedProject) return []
    return tasks.filter(t => t.project_id === timer.selectedProject && !t.archived)
  }, [tasks, timer.selectedProject])

  // Enhanced display functions
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client?.name || 'Unknown Client'
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return project?.name || 'Unknown Project'
  }

  const getTaskTitle = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    return task?.title || 'Unknown Task'
  }

  const getProjectClient = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project?.client_id) return 'No Client'
    return getClientName(project.client_id)
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDuration = (minutes: number) => {
    // Convert minutes to total seconds with high precision
    const totalSeconds = minutes * 60
    const hours = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = Math.round(totalSeconds % 60)
    
    // Debug logging for precision tracking
    console.log('formatDuration (precise):', { 
      inputMinutes: minutes, 
      totalSeconds, 
      hours, 
      mins, 
      secs 
    })
    
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`
    } else if (mins > 0) {
      return `${mins}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  // Calculate precise duration in minutes (with high decimal precision for seconds)
  const calculatePreciseDuration = (startTime: string, endTime: string): number => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMs = end.getTime() - start.getTime()
    const durationMinutes = durationMs / (1000 * 60) // Convert to minutes with full precision
    
    // Debug logging with enhanced precision info
    console.log('calculatePreciseDuration (enhanced):', { 
      startTime, 
      endTime, 
      start: start.toISOString(),
      end: end.toISOString(),
      durationMs, 
      durationMinutes,
      durationSeconds: durationMs / 1000,
      formattedDuration: `${Math.floor(durationMinutes)}m ${Math.round((durationMinutes % 1) * 60)}s`
    })
    
    return durationMinutes
  }

  const getTotalMinutesForDate = (entries: any[]) => {
    let total = 0
    let hasAutoFixed = false
    
    entries.forEach(entry => {
      const preciseDuration = calculatePreciseDuration(entry.start_time, entry.end_time)
      const storedDuration = entry.duration
      
      // Always use the precise duration for display total
      total += preciseDuration
      
      // Check if there's a significant difference (more than 0.1 second precision) and auto-fix
      const precisionThreshold = 0.1 / 60 // 0.1 seconds in minutes
      if (Math.abs(preciseDuration - storedDuration) > precisionThreshold) {
        console.warn(`Auto-fixing duration for entry ${entry.id}:`, {
          stored: storedDuration,
          calculated: preciseDuration,
          difference: Math.abs(preciseDuration - storedDuration),
          differenceSeconds: Math.abs(preciseDuration - storedDuration) * 60,
          start_time: entry.start_time,
          end_time: entry.end_time,
          description: entry.description
        })
        
        // Auto-fix the entry in the background
        updateTimeEntry(entry.id, { duration: preciseDuration }).catch(error => {
          console.error('Failed to auto-fix duration:', error)
        })
        
        hasAutoFixed = true
      }
    })
    
    if (hasAutoFixed) {
      console.log('Auto-fixed some duration mismatches for enhanced precision')
    }
    
    return total
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTimeString = (timeString: string) => {
    const time = new Date(timeString)
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const handleStartStop = () => {
    if (timer.isTracking) {
      // Pause timer (don't save yet)
      setTimer({ isTracking: false })
    } else {
      // Start or resume timer
      if (!timer.selectedProject || !timer.selectedClient) {
        alert('Please select a client and project before starting the timer')
        return
      }
      
      if (timer.startTime && timer.currentTime > 0) {
        // Resume existing timer
        setTimer({ isTracking: true })
      } else {
        // Start new timer
        startTimer()
      }
    }
  }

  const handleStopTimer = () => {
    if (confirm('Are you sure you want to stop and save this timer session?')) {
      stopTimer()
    }
  }

  const handleResumeEntry = async (entry: any) => {
    if (timer.isTracking) {
      if (confirm('You have an active timer. Stop current timer and resume this entry?')) {
        await stopTimer()
        resumeTimeEntry(entry)
      }
    } else {
      resumeTimeEntry(entry)
    }
  }

  const handleTimerProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    setTimer({
      selectedProject: projectId,
      selectedClient: project?.client_id || '',
      selectedTask: '' // Reset task when project changes
    })
  }

  const handleTimerClientChange = (clientId: string) => {
    setTimer({
      selectedClient: clientId,
      selectedProject: '', // Reset project when client changes
      selectedTask: '' // Reset task when client changes
    })
  }

  const handleManualEntry = async () => {
    if (!manualEntry.projectId || !manualEntry.clientId || !manualEntry.startTime || !manualEntry.endTime) {
      alert('Please fill in all required fields (Client, Project, Start Time, End Time)')
      return
    }

    const start = new Date(`${manualEntry.startDate}T${manualEntry.startTime}`)
    const end = new Date(`${manualEntry.endDate}T${manualEntry.endTime}`)
    
    const durationInMinutes = calculatePreciseDuration(start.toISOString(), end.toISOString())

    if (durationInMinutes <= 0) {
      alert('Invalid time range - end time must be after start time')
      return
    }

    // Determine which date to use for the entry
    // For cross-day entries, we'll use the start date
    const entryDate = start.toISOString().split('T')[0]

    try {
      await addTimeEntry({
        project_id: manualEntry.projectId,
        task_id: manualEntry.taskId || null,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration: durationInMinutes,
        date: entryDate,
        description: manualEntry.description || 'Manual entry'
      })

      setManualEntry({
        projectId: '',
        clientId: '',
        taskId: '',
        startDate: new Date().toISOString().split('T')[0],
        startTime: '',
        endDate: new Date().toISOString().split('T')[0],
        endTime: '',
        description: ''
      })
      setShowManualEntry(false)
    } catch (error) {
      console.error('Error adding manual entry:', error)
      alert('Failed to add time entry. Please try again.')
    }
  }

  const updateEntry = async (id: string, field: string, value: string) => {
    try {
      // Get the current entry to work with
      const currentEntry = timeEntries.find(entry => entry.id === id)
      if (!currentEntry) return

      let updateData: any = { [field]: value }

      // If updating start_time or end_time, recalculate duration and potentially update date
      if (field === 'start_time' || field === 'end_time') {
        const startTime = field === 'start_time' ? value : currentEntry.start_time
        const endTime = field === 'end_time' ? value : currentEntry.end_time
        
        if (startTime && endTime) {
          // Recalculate duration with precise calculation
          const newDuration = calculatePreciseDuration(startTime, endTime)
          // Store precise duration - database now supports DECIMAL(10,6)
          updateData.duration = newDuration
          
          // Update the entry date to the start date (for consistency with cross-day logic)
          const entryDate = new Date(startTime).toISOString().split('T')[0]
          updateData.date = entryDate
          
          console.log('Updating entry with precise duration and date:', {
            id,
            field,
            startTime,
            endTime,
            newDuration,
            entryDate
          })
        }
      }

      await updateTimeEntry(id, updateData)
    } catch (error) {
      console.error('Error updating entry:', error)
      alert('Failed to update entry. Please try again.')
    }
  }

  const deleteEntry = async (id: string) => {
    if (confirm('Are you sure you want to delete this time entry?')) {
      try {
        await deleteTimeEntry(id)
      } catch (error) {
        console.error('Error deleting entry:', error)
        alert('Failed to delete entry. Please try again.')
      }
    }
  }

  // Group time entries by date
  const filteredEntries = filterDate 
    ? timeEntries.filter(entry => entry.date === filterDate)
    : timeEntries

  const groupedEntries = filteredEntries.reduce((groups: any, entry: any) => {
    const date = entry.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(entry)
    return groups
  }, {})

  // Auto-fix durations when timeEntries changes with enhanced precision
  useEffect(() => {
    if (timeEntries.length > 0 && !loading) {
      const precisionThreshold = 0.1 / 60 // 0.1 seconds in minutes
      const entriesToFix = timeEntries.filter(entry => {
        const calculatedDuration = calculatePreciseDuration(entry.start_time, entry.end_time)
        const difference = Math.abs(calculatedDuration - entry.duration)
        console.log(`Entry ${entry.id} precision check:`, {
          stored: entry.duration,
          calculated: calculatedDuration,
          difference,
          differenceSeconds: difference * 60,
          needsFix: difference > precisionThreshold
        })
        return difference > precisionThreshold
      })

      if (entriesToFix.length > 0) {
        console.log(`Auto-fixing ${entriesToFix.length} entries with precision mismatches`)
        entriesToFix.forEach(async (entry) => {
          try {
            const calculatedDuration = calculatePreciseDuration(entry.start_time, entry.end_time)
            console.log(`Auto-fixing entry ${entry.id}: ${entry.duration} -> ${calculatedDuration} (difference: ${Math.abs(calculatedDuration - entry.duration) * 60}s)`)
            await updateTimeEntry(entry.id, { duration: calculatedDuration })
            console.log(`Successfully auto-fixed entry ${entry.id} with enhanced precision`)
          } catch (error) {
            console.error(`Failed to auto-fix entry ${entry.id}:`, error)
          }
        })
      } else {
        console.log('No entries need precision fixing')
      }
    }
  }, [timeEntries, loading, updateTimeEntry])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Time Tracker</h1>
          <p className="text-dark-500 mt-1">Track your time and manage entries</p>
        </div>
        <button
          onClick={() => setShowManualEntry(true)}
          className="flex items-center space-x-2 bg-secondary hover:bg-secondary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Manual Entry</span>
        </button>
      </div>

      {/* Timer Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-200 rounded-xl p-6 border border-dark-300"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timer Display */}
          <div className="text-center">
            <div className="relative mb-6">
              <div className={`text-7xl font-mono font-bold mb-2 transition-colors duration-300 ${
                timer.isTracking ? 'text-green-600' : timer.currentTime > 0 ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {formatTime(timer.currentTime)}
              </div>
              {timer.isTracking && (
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full"
                />
              )}
            </div>
            
            <div className="flex items-center justify-center space-x-3 mb-4">
              <button
                onClick={handleStartStop}
                disabled={!timer.selectedProject || !timer.selectedClient}
                className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  timer.isTracking
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg'
                    : (!timer.selectedProject || !timer.selectedClient)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : timer.currentTime > 0
                        ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                        : 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
                }`}
              >
                {timer.isTracking ? (
                  <>
                    <Pause className="w-5 h-5" />
                    <span>Pause</span>
                  </>
                ) : timer.currentTime > 0 ? (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Start</span>
                  </>
                )}
              </button>
              
              {timer.currentTime > 0 && (
                <button
                  onClick={handleStopTimer}
                  className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 bg-red-500 hover:bg-red-600 text-white shadow-lg"
                >
                  <Save className="w-5 h-5" />
                  <span>Stop & Save</span>
                </button>
              )}
            </div>

            {(!timer.selectedProject || !timer.selectedClient) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"
              >
                <p className="text-sm text-red-600 font-medium">
                  ⚠️ Please select client and project to start tracking
                </p>
              </motion.div>
            )}
            
            {timer.isTracking && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-lg p-3"
              >
                <p className="text-sm text-green-700 font-medium">
                  🔄 Timer will auto-save if page is refreshed or closed
                </p>
              </motion.div>
            )}

            {!timer.isTracking && timer.currentTime > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-3"
              >
                <p className="text-sm text-blue-700 font-medium">
                  ⏸️ Timer paused - Click Resume to continue or Stop & Save to finish
                </p>
              </motion.div>
            )}
          </div>

          {/* Timer Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-500 mb-2">Client *</label>
              <select
                value={timer.selectedClient}
                onChange={(e) => handleTimerClientChange(e.target.value)}
                className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                disabled={timer.isTracking}
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-500 mb-2">Project *</label>
              <select
                value={timer.selectedProject}
                onChange={(e) => handleTimerProjectChange(e.target.value)}
                className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                disabled={timer.isTracking || !timer.selectedClient}
              >
                <option value="">Select a project</option>
                {timerFilteredProjects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-500 mb-2">Task (optional)</label>
              <select
                value={timer.selectedTask}
                onChange={(e) => setTimer({selectedTask: e.target.value})}
                className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                disabled={timer.isTracking || !timer.selectedProject}
              >
                <option value="">Select a task (optional)</option>
                {timerFilteredTasks.map(task => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-500 mb-2">Description</label>
              <input
                type="text"
                value={timer.description}
                onChange={(e) => setTimer({description: e.target.value})}
                placeholder="What are you working on?"
                className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500"
                disabled={timer.isTracking}
              />
            </div>
          </div>
        </div>

        {/* Current tracking info */}
        {(timer.isTracking || timer.currentTime > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 p-5 rounded-xl border-2 ${
              timer.isTracking 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`flex items-center space-x-3 ${
                timer.isTracking ? 'text-green-700' : 'text-blue-700'
              }`}>
                <div className={`p-2 rounded-lg ${
                  timer.isTracking ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {timer.isTracking ? 'Currently Tracking' : 'Timer Paused'}
                  </h3>
                  <p className="text-sm opacity-75">
                    {timer.isTracking ? 'Active session in progress' : 'Ready to resume'}
                  </p>
                </div>
              </div>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                timer.isTracking 
                  ? 'text-green-700 bg-green-100' 
                  : 'text-blue-700 bg-blue-100'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  timer.isTracking 
                    ? 'bg-green-500 animate-pulse' 
                    : 'bg-blue-500'
                }`}></span>
                <span>{timer.isTracking ? 'LIVE' : 'PAUSED'}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Client:</span>
                  <span className="text-sm font-semibold">{getClientName(timer.selectedClient)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Project:</span>
                  <span className="text-sm font-semibold">{getProjectName(timer.selectedProject)}</span>
                </div>
                {timer.selectedTask && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600">Task:</span>
                    <span className="text-sm font-semibold text-secondary">{getTaskTitle(timer.selectedTask)}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Elapsed:</span>
                  <span className={`text-lg font-mono font-bold ${
                    timer.isTracking ? 'text-green-600' : 'text-blue-600'
                  }`}>{formatTime(timer.currentTime)}</span>
                </div>
                {timer.startTime && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600">Started:</span>
                    <span className="text-sm">{new Date(timer.startTime).toLocaleTimeString()}</span>
                  </div>
                )}
                {timer.description && (
                  <div className="flex items-start space-x-2">
                    <span className="text-sm font-medium text-gray-600">Note:</span>
                    <span className="text-sm">{timer.description}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Filters and Export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-dark-500" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
            />
          </div>
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="text-secondary hover:text-secondary/80 text-sm"
            >
              Clear Filter
            </button>
          )}
        </div>
        
        <button className="flex items-center space-x-2 bg-dark-300 hover:bg-dark-400 text-white px-4 py-2 rounded-lg transition-colors duration-200">
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Time Entries */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <span className="text-gray-600 text-lg">Loading time entries...</span>
          </div>
        ) : Object.entries(groupedEntries).length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="text-gray-400 mb-4">
              <Calendar className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No time entries found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {filterDate ? `No entries found for ${formatDate(filterDate)}` : 'Start tracking your time to see entries here. Use the timer above or add manual entries.'}
            </p>
            <button
              onClick={() => setShowManualEntry(true)}
              className="inline-flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              <Plus className="w-5 h-5" />
              <span>Add Manual Entry</span>
            </button>
          </div>
        ) : (
          Object.entries(groupedEntries)
          .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
          .map(([date, entries]) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{formatDate(date)}</h3>
                  <p className="text-sm text-gray-600">
                    {(entries as any[]).length} {(entries as any[]).length === 1 ? 'entry' : 'entries'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatDuration(getTotalMinutesForDate(entries as any[]))}
                  </div>
                  <p className="text-sm text-gray-600">Total Time</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {(entries as any[]).map((entry: any) => (
                  <motion.div 
                    key={entry.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {editingEntry === entry.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={entry.description}
                              onChange={(e) => updateEntry(entry.id, 'description', e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              placeholder="Description"
                            />
                            
                            {/* Start Date and Time */}
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-gray-600">Start Date & Time</label>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="date"
                                  value={entry.start_time ? new Date(entry.start_time).toISOString().split('T')[0] : ''}
                                  onChange={(e) => {
                                    const startDate = new Date(entry.start_time)
                                    const [year, month, day] = e.target.value.split('-')
                                    startDate.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day))
                                    updateEntry(entry.id, 'start_time', startDate.toISOString())
                                  }}
                                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                                <input
                                  type="time"
                                  step="1"
                                  value={entry.start_time ? new Date(entry.start_time).toTimeString().slice(0, 8) : ''}
                                  onChange={(e) => {
                                    const [hours, minutes, seconds] = e.target.value.split(':')
                                    const startDate = new Date(entry.start_time)
                                    startDate.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || '0'))
                                    updateEntry(entry.id, 'start_time', startDate.toISOString())
                                  }}
                                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                              </div>
                            </div>

                            {/* End Date and Time */}
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-gray-600">End Date & Time</label>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="date"
                                  value={entry.end_time ? new Date(entry.end_time).toISOString().split('T')[0] : ''}
                                  onChange={(e) => {
                                    const endDate = new Date(entry.end_time)
                                    const [year, month, day] = e.target.value.split('-')
                                    endDate.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day))
                                    updateEntry(entry.id, 'end_time', endDate.toISOString())
                                  }}
                                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                                <input
                                  type="time"
                                  step="1"
                                  value={entry.end_time ? new Date(entry.end_time).toTimeString().slice(0, 8) : ''}
                                  onChange={(e) => {
                                    const [hours, minutes, seconds] = e.target.value.split(':')
                                    const endDate = new Date(entry.end_time)
                                    endDate.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || '0'))
                                    updateEntry(entry.id, 'end_time', endDate.toISOString())
                                  }}
                                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                              </div>
                            </div>

                            {/* Duration Preview */}
                            {entry.start_time && entry.end_time && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                <div className="text-xs text-blue-700">
                                  <strong>Duration: {formatDuration(calculatePreciseDuration(entry.start_time, entry.end_time))}</strong>
                                  {(() => {
                                    const startDate = new Date(entry.start_time).toDateString()
                                    const endDate = new Date(entry.end_time).toDateString()
                                    return startDate !== endDate ? (
                                      <span className="ml-2 text-orange-600 font-medium">📅 Cross-day entry</span>
                                    ) : null
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-gray-900 font-semibold text-sm">{getProjectClient(entry.project_id)}</span>
                              </div>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-700 font-medium text-sm">{getProjectName(entry.project_id)}</span>
                              {entry.task_id && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-blue-600 font-medium text-sm">{getTaskTitle(entry.task_id)}</span>
                                </>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{entry.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-sm">
                                <span className="flex items-center space-x-1 text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  <span className="font-medium">
                                    {formatTimeString(entry.start_time)} - {formatTimeString(entry.end_time)}
                                    {(() => {
                                      const startDate = new Date(entry.start_time).toDateString()
                                      const endDate = new Date(entry.end_time).toDateString()
                                      return startDate !== endDate ? (
                                        <span className="ml-1 text-orange-600 font-medium">📅+1</span>
                                      ) : null
                                    })()}
                                  </span>
                                </span>
                                <span className="flex items-center space-x-1 font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                  <Timer className="w-4 h-4" />
                                  <span>{formatDuration(calculatePreciseDuration(entry.start_time, entry.end_time))}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {editingEntry === entry.id ? (
                        <>
                          <button
                            onClick={() => setEditingEntry(null)}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors duration-200"
                            title="Save changes"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingEntry(null)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleResumeEntry(entry)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="Resume this timer"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingEntry(entry.id)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                            title="Edit entry"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Delete entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            </div>
          </motion.div>
          ))
        )}
      </div>

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Add Manual Time Entry</h3>
              <button
                onClick={() => setShowManualEntry(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Client *</label>
                <select
                  value={manualEntry.clientId}
                  onChange={(e) => setManualEntry({
                    ...manualEntry, 
                    clientId: e.target.value,
                    projectId: '',
                    taskId: ''
                  })}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Project *</label>
                <select
                  value={manualEntry.projectId}
                  onChange={(e) => setManualEntry({
                    ...manualEntry, 
                    projectId: e.target.value,
                    taskId: ''
                  })}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  disabled={!manualEntry.clientId}
                >
                  <option value="">Select a project</option>
                  {filteredProjects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Task (optional)</label>
                <select
                  value={manualEntry.taskId}
                  onChange={(e) => setManualEntry({...manualEntry, taskId: e.target.value})}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  disabled={!manualEntry.projectId}
                >
                  <option value="">Select a task (optional)</option>
                  {filteredTasks.map(task => (
                    <option key={task.id} value={task.id}>{task.title}</option>
                  ))}
                </select>
              </div>

              {/* Start Date and Time */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-dark-500">Start Date & Time *</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={manualEntry.startDate}
                    onChange={(e) => setManualEntry({...manualEntry, startDate: e.target.value})}
                    className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  />
                  <input
                    type="time"
                    step="1"
                    value={manualEntry.startTime}
                    onChange={(e) => setManualEntry({...manualEntry, startTime: e.target.value})}
                    className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  />
                </div>
              </div>

              {/* End Date and Time */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-dark-500">End Date & Time *</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={manualEntry.endDate}
                    onChange={(e) => setManualEntry({...manualEntry, endDate: e.target.value})}
                    className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  />
                  <input
                    type="time"
                    step="1"
                    value={manualEntry.endTime}
                    onChange={(e) => setManualEntry({...manualEntry, endTime: e.target.value})}
                    className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  />
                </div>
              </div>

              {/* Show preview of duration and cross-day warning */}
              {manualEntry.startTime && manualEntry.endTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  {(() => {
                    const start = new Date(`${manualEntry.startDate}T${manualEntry.startTime}`)
                    const end = new Date(`${manualEntry.endDate}T${manualEntry.endTime}`)
                    
                    const duration = calculatePreciseDuration(start.toISOString(), end.toISOString())
                    const isCrossDay = manualEntry.startDate !== manualEntry.endDate
                    
                    return (
                      <>
                        <div className="text-sm text-blue-700">
                          <strong>Duration: {formatDuration(duration)}</strong>
                        </div>
                        {isCrossDay && (
                          <div className="text-sm text-blue-600 mt-1">
                            ⏰ Cross-day entry: Ends on {end.toLocaleDateString()}
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Description</label>
                <input
                  type="text"
                  value={manualEntry.description}
                  onChange={(e) => setManualEntry({...manualEntry, description: e.target.value})}
                  placeholder="What did you work on?"
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowManualEntry(false)}
                className="px-4 py-2 text-dark-500 hover:text-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleManualEntry}
                className="bg-secondary hover:bg-secondary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                Add Entry
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default TimeTracker
