import { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { Clock, DollarSign, Download, Calendar, Filter, Loader2, FileText, FileSpreadsheet } from 'lucide-react'
import jsPDF from 'jspdf'
import Papa from 'papaparse'

const Reports = () => {
  const { currentUser, timeEntries, projects, tasks, loading } = useAppContext()
  
  // Helper function to get current month's start and end dates
  const getCurrentMonthDates = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    
    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 0)
    
    return {
      start: startOfMonth.toISOString().split('T')[0],
      end: endOfMonth.toISOString().split('T')[0]
    }
  }

  const currentMonth = getCurrentMonthDates()
  const [startDate, setStartDate] = useState(currentMonth.start)
  const [endDate, setEndDate] = useState(currentMonth.end)
  const [showExportDropdown, setShowExportDropdown] = useState(false)

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

  // Filter time entries based on current user and date range
  const getFilteredEntries = () => {
    let filtered = timeEntries

    // Always show only the current user's time entries (regardless of role)
    if (currentUser?.id) {
      filtered = filtered.filter(entry => entry.user_id === currentUser.id)
    }

    // Apply date filter (always applied since we default to current month)
    if (startDate && endDate) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date)
        const start = new Date(startDate)
        const end = new Date(endDate)
        return entryDate >= start && entryDate <= end
      })
    }

    return filtered
  }

  const filteredEntries = getFilteredEntries()
  const totalHours = filteredEntries.reduce((sum, entry) => sum + (entry.duration / 60), 0) // Convert minutes to hours
  const totalEarnings = filteredEntries.reduce((sum, entry) => {
    const durationInHours = (entry.duration || 0) / 60
    const hourlyRate = entry.user_profile?.hourly_rate || currentUser?.hourly_rate || 0
    return sum + (durationInHours * hourlyRate)
  }, 0)

  // Group entries by project/task for detailed view
  const getDetailedData = () => {
    const grouped = filteredEntries.reduce((acc, entry) => {
      // Get project name
      const project = projects.find(p => p.id === entry.project_id)
      const projectName = project?.name || 'Unknown Project'
      
      // Get task name if task_id exists
      const task = entry.task_id ? tasks.find(t => t.id === entry.task_id) : null
      const taskName = task ? task.title : null
      
      // Create key for grouping
      const key = taskName ? `${projectName} - ${taskName}` : projectName
      
      if (!acc[key]) {
        acc[key] = { 
          duration: 0, 
          revenue: 0, 
          entries: [],
          projectName,
          taskName
        }
      }
      
      const durationInHours = entry.duration / 60 // Convert minutes to hours
      const hourlyRate = entry.user_profile?.hourly_rate || currentUser?.hourly_rate || 0
      const entryRevenue = durationInHours * hourlyRate
      
      acc[key].duration += durationInHours
      acc[key].revenue += entryRevenue
      acc[key].entries.push({
        ...entry,
        durationInHours,
        hourlyRate,
        entryRevenue
      })
      
      return acc
    }, {} as Record<string, { duration: number; revenue: number; entries: any[]; projectName: string; taskName: string | null }>)

    return Object.entries(grouped).map(([title, data]) => {
      const groupData = data as { duration: number; revenue: number; entries: any[]; projectName: string; taskName: string | null }
      return {
        title,
        duration: groupData.duration.toFixed(2),
        amount: groupData.revenue.toFixed(2),
        projectName: groupData.projectName,
        taskName: groupData.taskName,
        userName: currentUser?.full_name || 'Unknown User',
        entries: groupData.entries
      }
    })
  }

  const detailedData = getDetailedData()

  const clearFilters = () => {
    const currentMonth = getCurrentMonthDates()
    setStartDate(currentMonth.start)
    setEndDate(currentMonth.end)
  }

  // Export functions
  const exportToCSV = () => {
    const exportData = filteredEntries.map(entry => {
      const project = projects.find(p => p.id === entry.project_id)
      const task = entry.task_id ? tasks.find(t => t.id === entry.task_id) : null
      const durationInHours = (entry.duration || 0) / 60
      const hourlyRate = entry.user_profile?.hourly_rate || currentUser?.hourly_rate || 0
      const revenue = durationInHours * hourlyRate

      return {
        Date: entry.date,
        'Start Time': new Date(entry.start_time).toLocaleTimeString(),
        'End Time': new Date(entry.end_time).toLocaleTimeString(),
        Project: project?.name || 'Unknown Project',
        Task: task?.title || 'No Task',
        'Duration (Hours)': durationInHours.toFixed(2),
        'Hourly Rate': `$${hourlyRate}`,
        Revenue: `$${revenue.toFixed(2)}`,
        Description: entry.description || ''
      }
    })

    const csv = Papa.unparse(exportData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `earnings-report-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setShowExportDropdown(false)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.text('Earnings Report', 20, 20)
    
    doc.setFontSize(12)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30)
    doc.text(`Period: ${startDate} - ${endDate}`, 20, 40)
    
    // Summary
    doc.text(`Total Hours: ${totalHours.toFixed(2)}`, 20, 55)
    doc.text(`Total Earnings: $${totalEarnings.toFixed(2)}`, 20, 65)
    
    // Table headers
    let yPosition = 85
    doc.setFontSize(10)
    doc.text('Date', 20, yPosition)
    doc.text('Project/Task', 60, yPosition)
    doc.text('Hours', 120, yPosition)
    doc.text('Rate', 140, yPosition)
    doc.text('Revenue', 165, yPosition)
    
    // Draw header line
    doc.line(20, yPosition + 2, 190, yPosition + 2)
    yPosition += 10
    
    // Table data
    filteredEntries.forEach((entry) => {
      if (yPosition > 280) {
        doc.addPage()
        yPosition = 20
      }
      
      const project = projects.find(p => p.id === entry.project_id)
      const task = entry.task_id ? tasks.find(t => t.id === entry.task_id) : null
      const durationInHours = (entry.duration || 0) / 60
      const hourlyRate = entry.user_profile?.hourly_rate || currentUser?.hourly_rate || 0
      const revenue = durationInHours * hourlyRate
      
      const projectTask = task ? `${project?.name || 'Unknown'} - ${task.title}` : project?.name || 'Unknown'
      
      doc.text(entry.date, 20, yPosition)
      doc.text(projectTask.substring(0, 25), 60, yPosition)
      doc.text(durationInHours.toFixed(1), 120, yPosition)
      doc.text(`$${hourlyRate}`, 140, yPosition)
      doc.text(`$${revenue.toFixed(2)}`, 165, yPosition)
      
      yPosition += 8
    })
    
    doc.save(`earnings-report-${new Date().toISOString().split('T')[0]}.pdf`)
    setShowExportDropdown(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Earnings Report</h2>
          <p className="text-dark-500">Track your hours and earnings</p>
        </div>
        <div className="relative export-dropdown">
          <button 
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            className="flex items-center space-x-2 bg-secondary hover:bg-secondary/90 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          {showExportDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
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
            </div>
          )}
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-dark-200 rounded-xl p-4 border border-dark-300">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-dark-500" />
            <span className="text-sm text-dark-500">Filter by date:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-dark-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-gray-100 border border-gray-300 rounded px-3 py-1 text-gray-900 text-sm"
            />
            <span className="text-dark-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gray-100 border border-gray-300 rounded px-3 py-1 text-gray-900 text-sm"
            />
          </div>

          {(startDate !== currentMonth.start || endDate !== currentMonth.end) && (
            <button
              onClick={clearFilters}
              className="text-secondary hover:text-secondary/80 text-sm"
            >
              Reset to Current Month
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 bg-dark-200 rounded-xl border border-dark-300">
          <Loader2 className="w-8 h-8 animate-spin text-secondary mb-3" />
          <span className="text-dark-500">Loading reports...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-500 text-sm">Total Hours</p>
              <p className="text-2xl font-bold text-white">{totalHours.toFixed(1)}h</p>
            </div>
            <Clock className="w-8 h-8 text-secondary" />
          </div>
        </div>
        
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-500 text-sm">Hourly Rate</p>
              <p className="text-2xl font-bold text-white">${currentUser?.hourly_rate || 0}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-500 text-sm">Total Earnings</p>
              <p className="text-2xl font-bold text-green-400">${totalEarnings.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Detailed Breakdown Table */}
      <div className="bg-dark-200 rounded-xl border border-dark-300 overflow-hidden">
        <div className="p-6 border-b border-dark-300">
          <h3 className="text-xl font-semibold text-white-800">Detailed Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-300">
              <tr>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">#</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Task/Project</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">User</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Duration</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-300">
              {detailedData.map((item, index) => (
                <tr key={index} className="hover:bg-dark-300/30 transition-colors duration-200">
                  <td className="py-4 px-6 text-white text-sm">{index + 1}</td>
                  <td className="py-4 px-6 text-white text-sm">{item.title}</td>
                  <td className="py-4 px-6 text-white text-sm">{item.userName}</td>
                  <td className="py-4 px-6 text-white text-sm">{item.duration}h</td>
                  <td className="py-4 px-6 text-green-400 text-sm font-medium">${item.amount}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-dark-300">
              <tr>
                <td colSpan={3} className="py-4 px-6 text-white font-bold">Total</td>
                <td className="py-4 px-6 text-white font-bold">{totalHours.toFixed(2)}h</td>
                <td className="py-4 px-6 text-green-400 font-bold">${totalEarnings.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {detailedData.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-dark-500 mx-auto mb-4" />
            <p className="text-dark-500">No time entries found for the selected period</p>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  )
}

export default Reports