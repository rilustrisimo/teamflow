import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import { Play, Pause, Calendar, Download, Edit, Save, X, Plus } from 'lucide-react'

const TimeTracker = () => {
  const { 
    timer, 
    setTimer, 
    startTimer, 
    stopTimer, 
    timeEntries, 
    addTimeEntry, 
    updateTimeEntry, 
    deleteTimeEntry,
    projects,
    clients,
    tasks
  } = useAppContext()

  const [filterDate, setFilterDate] = useState('')
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualEntry, setManualEntry] = useState({
    project: '',
    client: '',
    task: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    description: ''
  })

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartStop = () => {
    if (timer.isTracking) {
      stopTimer()
    } else {
      startTimer()
    }
  }

  const handleManualEntry = () => {
    if (!manualEntry.project || !manualEntry.client || !manualEntry.task || !manualEntry.startTime || !manualEntry.endTime) {
      alert('Please fill in all required fields')
      return
    }

    const start = new Date(`${manualEntry.date}T${manualEntry.startTime}`)
    const end = new Date(`${manualEntry.date}T${manualEntry.endTime}`)
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60) // hours

    if (duration <= 0) {
      alert('End time must be after start time')
      return
    }

    addTimeEntry({
      project_id: manualEntry.project,
      task_id: manualEntry.task,
      start_time: `${manualEntry.date}T${manualEntry.startTime}`,
      end_time: `${manualEntry.date}T${manualEntry.endTime}`,
      duration: Math.round(duration * 100) / 100,
      date: manualEntry.date,
      description: manualEntry.description || 'Manual entry'
    })

    setManualEntry({
      project: '',
      client: '',
      task: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      description: ''
    })
    setShowManualEntry(false)
    alert('Manual time entry added successfully!')
  }

  const updateEntry = (id: string, field: string, value: string) => {
    const entry = timeEntries.find(e => e.id === id)
    if (entry) {
      updateTimeEntry(id, { [field]: value })
    }
  }

  const deleteEntry = (id: string) => {
    if (confirm('Are you sure you want to delete this time entry?')) {
      deleteTimeEntry(id)
    }
  }

  // Group entries by date
  const groupedEntries = timeEntries.reduce((groups, entry) => {
    const date = entry.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(entry)
    return groups
  }, {} as Record<string, typeof timeEntries>)

  // Filter entries by date if filter is applied
  const filteredGroups = filterDate 
    ? { [filterDate]: groupedEntries[filterDate] || [] }
    : groupedEntries

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getTotalHoursForDate = (entries: typeof timeEntries) => {
    return entries.reduce((total, entry) => total + entry.duration, 0)
  }

  // Get filtered tasks based on selected project and client
  const getFilteredTasks = () => {
    return tasks.filter(task => {
      if (manualEntry.project && task.project !== manualEntry.project) return false
      if (manualEntry.client && task.client !== manualEntry.client) return false
      return true
    })
  }

  return (
    <div className="space-y-6">
      {/* Active Timer Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-200 rounded-xl p-6 border border-dark-300"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Time Tracker</h2>
          <button
            onClick={() => setShowManualEntry(true)}
            className="flex items-center space-x-2 bg-dark-300 hover:bg-dark-400 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Entry</span>
          </button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="text-4xl font-mono text-secondary mb-4">{formatTime(timer.currentTime)}</div>
            {timer.isTracking && (
              <div className="text-sm text-green-400 mb-4">
                ⏱️ Timer running for: {timer.selectedTask} ({timer.selectedProject})
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Client *</label>
                <select 
                  value={timer.selectedClient}
                  onChange={(e) => {
                    setTimer({
                      selectedClient: e.target.value,
                      selectedProject: '',
                      selectedTask: ''
                    })
                  }}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                  disabled={timer.isTracking}
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.company}>{client.company}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Project *</label>
                <select 
                  value={timer.selectedProject}
                  onChange={(e) => {
                    setTimer({
                      selectedProject: e.target.value,
                      selectedTask: ''
                    })
                  }}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                  disabled={timer.isTracking || !timer.selectedClient}
                >
                  <option value="">Select a project</option>
                  {projects
                    .filter(project => project.client === timer.selectedClient)
                    .map(project => (
                      <option key={project.id} value={project.name}>{project.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Task *</label>
                <select 
                  value={timer.selectedTask}
                  onChange={(e) => setTimer({ selectedTask: e.target.value })}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                  disabled={timer.isTracking || !timer.selectedProject}
                >
                  <option value="">Select a task</option>
                  {tasks
                    .filter(task => task.project === timer.selectedProject && task.client === timer.selectedClient)
                    .map(task => (
                      <option key={task.id} value={task.title}>{task.title}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Description</label>
                <input
                  type="text"
                  value={timer.description}
                  onChange={(e) => setTimer({ description: e.target.value })}
                  placeholder="What are you working on?"
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white placeholder-dark-500"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <button
              onClick={handleStartStop}
              className={`flex items-center space-x-3 px-8 py-4 rounded-lg font-semibold transition-all duration-200 text-lg ${
                timer.isTracking 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-secondary hover:bg-secondary/90 text-white'
              }`}
            >
              {timer.isTracking ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              <span>{timer.isTracking ? 'Stop Timer' : 'Start Timer'}</span>
            </button>
          </div>
        </div>
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
              className="bg-dark-300 border border-dark-400 rounded-lg px-3 py-2 text-white"
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
        {Object.entries(filteredGroups)
          .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
          .map(([date, entries]) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-200 rounded-xl p-6 border border-dark-300"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{formatDate(date)}</h3>
              <div className="text-secondary font-semibold">
                Total: {getTotalHoursForDate(entries as any[]).toFixed(1)}h
              </div>
            </div>
            
            <div className="space-y-3">
              {(entries as any[]).map((entry: any) => (
                <div key={entry.id} className="bg-dark-300 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {editingEntry === entry.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <select
                              value={entry.client}
                              onChange={(e) => updateEntry(entry.id, 'client', e.target.value)}
                              className="bg-dark-400 border border-dark-500 rounded px-3 py-1 text-white text-sm"
                            >
                              {clients.map(client => (
                                <option key={client.id} value={client.company}>{client.company}</option>
                              ))}
                            </select>
                            <select
                              value={entry.project}
                              onChange={(e) => updateEntry(entry.id, 'project', e.target.value)}
                              className="bg-dark-400 border border-dark-500 rounded px-3 py-1 text-white text-sm"
                            >
                              {projects.map(project => (
                                <option key={project.id} value={project.name}>{project.name}</option>
                              ))}
                            </select>
                            <select
                              value={entry.task || ''}
                              onChange={(e) => updateEntry(entry.id, 'task', e.target.value)}
                              className="bg-dark-400 border border-dark-500 rounded px-3 py-1 text-white text-sm"
                            >
                              <option value="">Select task</option>
                              {tasks.map(task => (
                                <option key={task.id} value={task.title}>{task.title}</option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="time"
                              value={entry.startTime}
                              onChange={(e) => updateEntry(entry.id, 'startTime', e.target.value)}
                              className="bg-dark-400 border border-dark-500 rounded px-3 py-1 text-white text-sm"
                            />
                            <input
                              type="time"
                              value={entry.endTime}
                              onChange={(e) => updateEntry(entry.id, 'endTime', e.target.value)}
                              className="bg-dark-400 border border-dark-500 rounded px-3 py-1 text-white text-sm"
                            />
                          </div>
                          <input
                            type="text"
                            value={entry.description}
                            onChange={(e) => updateEntry(entry.id, 'description', e.target.value)}
                            className="w-full bg-dark-400 border border-dark-500 rounded px-3 py-1 text-white text-sm"
                            placeholder="Description"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingEntry(null)}
                              className="flex items-center space-x-1 bg-secondary hover:bg-secondary/90 text-white px-3 py-1 rounded text-sm"
                            >
                              <Save className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                            <button
                              onClick={() => setEditingEntry(null)}
                              className="flex items-center space-x-1 bg-dark-500 hover:bg-dark-600 text-white px-3 py-1 rounded text-sm"
                            >
                              <X className="w-3 h-3" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-4 mb-2">
                            <h4 className="font-medium text-white">{entry.project}</h4>
                            <span className="text-sm text-dark-500">•</span>
                            <span className="text-sm text-dark-500">{entry.client}</span>
                            {entry.task && (
                              <>
                                <span className="text-sm text-dark-500">•</span>
                                <span className="text-sm text-primary">{entry.task}</span>
                              </>
                            )}
                            <span className="text-sm text-dark-500">•</span>
                            <span className="text-sm text-secondary font-medium">{entry.duration}h</span>
                          </div>
                          <p className="text-dark-500 text-sm">{entry.description}</p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {editingEntry !== entry.id && (
                        <>
                          <div className="text-right text-sm text-dark-500">
                            <div>{entry.startTime} - {entry.endTime}</div>
                          </div>
                          <button
                            onClick={() => setEditingEntry(entry.id)}
                            className="p-1 text-dark-500 hover:text-white transition-colors duration-200"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="p-1 text-dark-500 hover:text-red-400 transition-colors duration-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-200 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-6">Add Manual Time Entry</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Client *</label>
                <select
                  value={manualEntry.client}
                  onChange={(e) => setManualEntry({
                    ...manualEntry, 
                    client: e.target.value,
                    project: '',
                    task: ''
                  })}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.company}>{client.company}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Project *</label>
                <select
                  value={manualEntry.project}
                  onChange={(e) => setManualEntry({
                    ...manualEntry, 
                    project: e.target.value,
                    task: ''
                  })}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                  disabled={!manualEntry.client}
                >
                  <option value="">Select a project</option>
                  {projects
                    .filter(project => project.client === manualEntry.client)
                    .map(project => (
                      <option key={project.id} value={project.name}>{project.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Task *</label>
                <select
                  value={manualEntry.task}
                  onChange={(e) => setManualEntry({...manualEntry, task: e.target.value})}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                  disabled={!manualEntry.project}
                >
                  <option value="">Select a task</option>
                  {getFilteredTasks().map(task => (
                    <option key={task.id} value={task.title}>{task.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Date *</label>
                <input
                  type="date"
                  value={manualEntry.date}
                  onChange={(e) => setManualEntry({...manualEntry, date: e.target.value})}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">Start Time *</label>
                  <input
                    type="time"
                    value={manualEntry.startTime}
                    onChange={(e) => setManualEntry({...manualEntry, startTime: e.target.value})}
                    className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">End Time *</label>
                  <input
                    type="time"
                    value={manualEntry.endTime}
                    onChange={(e) => setManualEntry({...manualEntry, endTime: e.target.value})}
                    className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Description</label>
                <input
                  type="text"
                  value={manualEntry.description}
                  onChange={(e) => setManualEntry({...manualEntry, description: e.target.value})}
                  placeholder="What did you work on?"
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white placeholder-dark-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowManualEntry(false)}
                className="px-4 py-2 text-dark-500 hover:text-white transition-colors duration-200"
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