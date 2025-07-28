import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import { Play, Calendar, Download, Edit, Save, X, Plus, Loader2, Clock, Trash2, Pause, RotateCcw, Timer, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react'
import jsPDF from 'jspdf'
import Papa from 'papaparse'

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
    loading,
    currentUser
  } = useAppContext()

  // Filter time entries to only show current user's entries
  const userTimeEntries = useMemo(() => {
    if (!currentUser) return []
    return timeEntries.filter(entry => entry.user_id === currentUser.id)
  }, [timeEntries, currentUser])

  const [filterDate, setFilterDate] = useState('')
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportDropdown && !(event.target as Element).closest('.export-dropdown')) {
        setShowExportDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportDropdown])
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

  // Export functions
  const exportToCSV = () => {
    setIsExporting(true)
    
    try {
      const exportData = filteredEntries.map(entry => ({
        Date: new Date(entry.start_time).toLocaleDateString(),
        'Start Time': formatTimeString(entry.start_time),
        'End Time': formatTimeString(entry.end_time),
        Duration: formatDuration(calculatePreciseDuration(entry.start_time, entry.end_time)),
        'Duration (Minutes)': calculatePreciseDuration(entry.start_time, entry.end_time).toFixed(2),
        Client: getProjectClient(entry.project_id),
        Project: getProjectName(entry.project_id),
        Task: entry.task_id ? getTaskTitle(entry.task_id) : '',
        Description: entry.description || ''
      }))

      const csv = Papa.unparse(exportData)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `time-entries-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Failed to export CSV. Please try again.')
    } finally {
      setIsExporting(false)
      setShowExportDropdown(false)
    }
  }

  const exportToPDF = () => {
    setIsExporting(true)
    
    try {
      const doc = new jsPDF()
      
      // Header
      doc.setFontSize(20)
      doc.text('Time Entries Report', 20, 20)
      
      doc.setFontSize(12)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30)
      
      if (filterDate) {
        doc.text(`Filter Date: ${formatDate(filterDate)}`, 20, 40)
      }
      
      // Calculate totals
      const totalMinutes = filteredEntries.reduce((sum, entry) => 
        sum + calculatePreciseDuration(entry.start_time, entry.end_time), 0)
      
      doc.text(`Total Entries: ${filteredEntries.length}`, 20, 50)
      doc.text(`Total Time: ${formatDuration(totalMinutes)}`, 20, 60)
      
      // Table headers
      let yPosition = 80
      doc.setFontSize(10)
      doc.text('Date', 20, yPosition)
      doc.text('Start', 50, yPosition)
      doc.text('End', 80, yPosition)
      doc.text('Duration', 110, yPosition)
      doc.text('Client/Project', 140, yPosition)
      
      // Draw header line
      doc.line(20, yPosition + 2, 190, yPosition + 2)
      yPosition += 10
      
      // Table data
      filteredEntries.forEach((entry) => {
        if (yPosition > 280) { // New page if needed
          doc.addPage()
          yPosition = 20
        }
        
        const date = new Date(entry.start_time).toLocaleDateString()
        const startTime = formatTimeString(entry.start_time)
        const endTime = formatTimeString(entry.end_time)
        const duration = formatDuration(calculatePreciseDuration(entry.start_time, entry.end_time))
        const clientProject = `${getProjectClient(entry.project_id)} - ${getProjectName(entry.project_id)}`
        
        doc.text(date, 20, yPosition)
        doc.text(startTime, 50, yPosition)
        doc.text(endTime, 80, yPosition)
        doc.text(duration, 110, yPosition)
        doc.text(clientProject.substring(0, 30), 140, yPosition)
        
        if (entry.description) {
          yPosition += 5
          doc.setFontSize(8)
          doc.text(entry.description.substring(0, 60), 140, yPosition)
          doc.setFontSize(10)
        }
        
        yPosition += 10
      })
      
      doc.save(`time-entries-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
      setShowExportDropdown(false)
    }
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
      const currentEntry = userTimeEntries.find(entry => entry.id === id)
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
    ? userTimeEntries.filter(entry => entry.date === filterDate)
    : userTimeEntries

  const groupedEntries = filteredEntries.reduce((groups: any, entry: any) => {
    const date = entry.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(entry)
    return groups
  }, {})

  // Auto-fix durations when userTimeEntries changes with enhanced precision
  useEffect(() => {
    if (userTimeEntries.length > 0 && !loading) {
      const precisionThreshold = 0.1 / 60 // 0.1 seconds in minutes
      const entriesToFix = userTimeEntries.filter(entry => {
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
  }, [userTimeEntries, loading, updateTimeEntry])

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Time Tracker
          </h1>
          <p className="text-gray-600 mt-1 text-base sm:text-lg">Track your time and manage entries</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          {/* Export Dropdown */}
          <div className="relative export-dropdown">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={filteredEntries.length === 0 || isExporting}
              className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                filteredEntries.length === 0 || isExporting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showExportDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showExportDropdown && !isExporting && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
                >
                  <button
                    onClick={exportToCSV}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-green-50 transition-colors duration-200 border-b border-gray-100"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="font-medium text-gray-900">Export as CSV</div>
                      <div className="text-sm text-gray-500">Spreadsheet format</div>
                    </div>
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-red-50 transition-colors duration-200"
                  >
                    <FileText className="w-4 h-4 text-red-600" />
                    <div>
                      <div className="font-medium text-gray-900">Export as PDF</div>
                      <div className="text-sm text-gray-500">Document format</div>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <button
            onClick={() => setShowManualEntry(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manual Entry</span>
          </button>
        </div>
      </div>

      {/* Timer Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-200 shadow-lg"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Timer Display */}
          <div className="text-center">
            <div className="relative mb-6 lg:mb-8">
              <div className={`text-5xl sm:text-6xl lg:text-8xl font-mono font-bold mb-4 transition-colors duration-300 ${
                timer.isTracking ? 'text-emerald-600' : timer.currentTime > 0 ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {formatTime(timer.currentTime)}
              </div>
              {timer.isTracking && (
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-2 -right-2 lg:-top-3 lg:-right-3 w-4 h-4 lg:w-6 lg:h-6 bg-emerald-500 rounded-full shadow-lg"
                />
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
              <button
                onClick={handleStartStop}
                disabled={!timer.selectedProject || !timer.selectedClient}
                className={`w-full sm:w-auto flex items-center justify-center space-x-2 lg:space-x-3 px-6 lg:px-8 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-bold text-base lg:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
                  timer.isTracking
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-orange-200'
                    : (!timer.selectedProject || !timer.selectedClient)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                      : timer.currentTime > 0
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-blue-200'
                        : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-emerald-200'
                }`}
              >
                {timer.isTracking ? (
                  <>
                    <Pause className="w-5 h-5 lg:w-6 lg:h-6" />
                    <span>Pause</span>
                  </>
                ) : timer.currentTime > 0 ? (
                  <>
                    <Play className="w-5 h-5 lg:w-6 lg:h-6" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 lg:w-6 lg:h-6" />
                    <span>Start</span>
                  </>
                )}
              </button>
              
              {timer.currentTime > 0 && (
                <button
                  onClick={handleStopTimer}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 lg:space-x-3 px-6 lg:px-8 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-bold text-base lg:text-lg transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-200"
                >
                  <Save className="w-5 h-5 lg:w-6 lg:h-6" />
                  <span>Stop & Save</span>
                </button>
              )}
            </div>

            {(!timer.selectedProject || !timer.selectedClient) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-4"
              >
                <p className="text-sm text-red-700 font-semibold">
                  ⚠️ Please select client and project to start tracking
                </p>
              </motion.div>
            )}
            
            {!timer.isTracking && timer.currentTime > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4"
              >
                <p className="text-sm text-blue-800 font-semibold">
                  ⏸️ Timer paused - Click Resume to continue or Stop & Save to finish
                </p>
              </motion.div>
            )}
          </div>

          {/* Timer Controls */}
          <div className="space-y-4 lg:space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 lg:mb-3">Client *</label>
              <select
                value={timer.selectedClient}
                onChange={(e) => handleTimerClientChange(e.target.value)}
                className="w-full bg-white border-2 border-gray-300 rounded-lg lg:rounded-xl px-3 lg:px-4 py-2 lg:py-3 text-gray-900 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                disabled={timer.isTracking}
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 lg:mb-3">Project *</label>
              <select
                value={timer.selectedProject}
                onChange={(e) => handleTimerProjectChange(e.target.value)}
                className="w-full bg-white border-2 border-gray-300 rounded-lg lg:rounded-xl px-3 lg:px-4 py-2 lg:py-3 text-gray-900 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                disabled={timer.isTracking || !timer.selectedClient}
              >
                <option value="">Select a project</option>
                {timerFilteredProjects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 lg:mb-3">Task (optional)</label>
              <select
                value={timer.selectedTask}
                onChange={(e) => setTimer({selectedTask: e.target.value})}
                className="w-full bg-white border-2 border-gray-300 rounded-lg lg:rounded-xl px-3 lg:px-4 py-2 lg:py-3 text-gray-900 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                disabled={timer.isTracking || !timer.selectedProject}
              >
                <option value="">Select a task (optional)</option>
                {timerFilteredTasks.map(task => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 lg:mb-3">Description</label>
              <input
                type="text"
                value={timer.description}
                onChange={(e) => setTimer({description: e.target.value})}
                placeholder="What are you working on?"
                className="w-full bg-white border-2 border-gray-300 rounded-lg lg:rounded-xl px-3 lg:px-4 py-2 lg:py-3 text-gray-900 font-medium placeholder-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
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
            className={`mt-6 lg:mt-8 p-4 lg:p-6 rounded-xl lg:rounded-2xl border-2 shadow-lg ${
              timer.isTracking 
                ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 border-emerald-300' 
                : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 border-blue-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-6">
              <div className={`flex items-center space-x-3 lg:space-x-4 ${
                timer.isTracking ? 'text-emerald-800' : 'text-blue-800'
              }`}>
                <div className={`p-2 lg:p-3 rounded-lg lg:rounded-xl shadow-sm ${
                  timer.isTracking ? 'bg-emerald-200' : 'bg-blue-200'
                }`}>
                  <Clock className="w-5 h-5 lg:w-6 lg:h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg lg:text-xl">
                    {timer.isTracking ? 'Currently Tracking' : 'Timer Paused'}
                  </h3>
                  <p className="text-sm lg:text-base font-medium opacity-80">
                    {timer.isTracking ? 'Active session in progress' : 'Ready to resume'}
                  </p>
                </div>
              </div>
              <div className={`flex items-center space-x-2 lg:space-x-3 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-sm font-bold shadow-sm ${
                timer.isTracking 
                  ? 'text-emerald-800 bg-emerald-200 border-2 border-emerald-300' 
                  : 'text-blue-800 bg-blue-200 border-2 border-blue-300'
              }`}>
                <span className={`w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full ${
                  timer.isTracking 
                    ? 'bg-emerald-600 animate-pulse' 
                    : 'bg-blue-600'
                }`}></span>
                <span className="text-sm lg:text-base">{timer.isTracking ? 'LIVE' : 'PAUSED'}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-2 lg:space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                  <span className="text-sm lg:text-base font-bold text-gray-800 min-w-[60px]">Client:</span>
                  <span className="text-sm lg:text-base font-semibold text-gray-900">{getClientName(timer.selectedClient)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                  <span className="text-sm lg:text-base font-bold text-gray-800 min-w-[60px]">Project:</span>
                  <span className="text-sm lg:text-base font-semibold text-gray-900">{getProjectName(timer.selectedProject)}</span>
                </div>
                {timer.selectedTask && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                    <span className="text-sm lg:text-base font-bold text-gray-800 min-w-[60px]">Task:</span>
                    <span className="text-sm lg:text-base font-semibold text-blue-700">{getTaskTitle(timer.selectedTask)}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2 lg:space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                  <span className="text-sm lg:text-base font-bold text-gray-800 min-w-[70px]">Elapsed:</span>
                  <span className={`text-lg lg:text-xl font-mono font-bold ${
                    timer.isTracking ? 'text-emerald-700' : 'text-blue-700'
                  }`}>{formatTime(timer.currentTime)}</span>
                </div>
                {timer.startTime && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                    <span className="text-sm lg:text-base font-bold text-gray-800 min-w-[70px]">Started:</span>
                    <span className="text-sm lg:text-base font-semibold text-gray-900">{new Date(timer.startTime).toLocaleTimeString()}</span>
                  </div>
                )}
                {timer.description && (
                  <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3">
                    <span className="text-sm lg:text-base font-bold text-gray-800 min-w-[70px]">Note:</span>
                    <span className="text-sm lg:text-base font-medium text-gray-800 italic break-words">{timer.description}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-white border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
            />
          </div>
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
            >
              Clear Filter
            </button>
          )}
        </div>
        
        <div className="text-sm text-gray-600">
          {filteredEntries.length > 0 && (
            <span className="font-medium">
              {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'} 
              {filterDate && ` for ${formatDate(filterDate)}`}
            </span>
          )}
        </div>
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
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{formatDate(date)}</h3>
                  <p className="text-sm text-gray-600">
                    {(entries as any[]).length} {(entries as any[]).length === 1 ? 'entry' : 'entries'}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">
                    {formatDuration(getTotalMinutesForDate(entries as any[]))}
                  </div>
                  <p className="text-sm text-gray-600">Total Time</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                {(entries as any[]).map((entry: any) => (
                  <motion.div 
                    key={entry.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Add Manual Time Entry</h3>
              <button
                onClick={() => setShowManualEntry(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client *</label>
                <select
                  value={manualEntry.clientId}
                  onChange={(e) => setManualEntry({
                    ...manualEntry, 
                    clientId: e.target.value,
                    projectId: '',
                    taskId: ''
                  })}
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project *</label>
                <select
                  value={manualEntry.projectId}
                  onChange={(e) => setManualEntry({
                    ...manualEntry, 
                    projectId: e.target.value,
                    taskId: ''
                  })}
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  disabled={!manualEntry.clientId}
                >
                  <option value="">Select a project</option>
                  {filteredProjects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task (optional)</label>
                <select
                  value={manualEntry.taskId}
                  onChange={(e) => setManualEntry({...manualEntry, taskId: e.target.value})}
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  disabled={!manualEntry.projectId}
                >
                  <option value="">Select a task (optional)</option>
                  {filteredTasks.map(task => (
                    <option key={task.id} value={task.id}>{task.title}</option>
                  ))}
                </select>
              </div>

              {/* Start Date and Time */}
              <div className="space-y-2 sm:space-y-3">
                <label className="block text-sm font-medium text-gray-700">Start Date & Time *</label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <input
                    type="date"
                    value={manualEntry.startDate}
                    onChange={(e) => setManualEntry({...manualEntry, startDate: e.target.value})}
                    className="bg-white border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  />
                  <input
                    type="time"
                    step="1"
                    value={manualEntry.startTime}
                    onChange={(e) => setManualEntry({...manualEntry, startTime: e.target.value})}
                    className="bg-white border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  />
                </div>
              </div>

              {/* End Date and Time */}
              <div className="space-y-2 sm:space-y-3">
                <label className="block text-sm font-medium text-gray-700">End Date & Time *</label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <input
                    type="date"
                    value={manualEntry.endDate}
                    onChange={(e) => setManualEntry({...manualEntry, endDate: e.target.value})}
                    className="bg-white border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  />
                  <input
                    type="time"
                    step="1"
                    value={manualEntry.endTime}
                    onChange={(e) => setManualEntry({...manualEntry, endTime: e.target.value})}
                    className="bg-white border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={manualEntry.description}
                  onChange={(e) => setManualEntry({...manualEntry, description: e.target.value})}
                  placeholder="What did you work on?"
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-6">
              <button
                onClick={() => setShowManualEntry(false)}
                className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleManualEntry}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
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
