import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { Clock, DollarSign, Download, Calendar, Filter, Loader2 } from 'lucide-react'

const Reports = () => {
  const { currentUser, timeEntries, loading } = useAppContext()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Filter time entries based on current user and date range
  const getFilteredEntries = () => {
    let filtered = timeEntries

    // For team members, only show their own time entries
    if (currentUser?.role === 'team-member') {
      filtered = filtered.filter(entry => entry.user_id === currentUser.id)
    }

    // Apply date filter
    if (startDate || endDate) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date)
        const start = startDate ? new Date(startDate) : new Date('1900-01-01')
        const end = endDate ? new Date(endDate) : new Date('2100-12-31')
        return entryDate >= start && entryDate <= end
      })
    }

    return filtered
  }

  const filteredEntries = getFilteredEntries()
  const totalHours = filteredEntries.reduce((sum, entry) => sum + (entry.duration / 60), 0) // Convert minutes to hours
  const totalEarnings = totalHours * (currentUser?.hourly_rate || 0)

  // Group entries by project/task for detailed view
  const getDetailedData = () => {
    const grouped = filteredEntries.reduce((acc, entry) => {
      const key = entry.task?.title || entry.project?.name || 'General Work'
      if (!acc[key]) {
        acc[key] = { duration: 0, entries: [] }
      }
      acc[key].duration += entry.duration / 60 // Convert minutes to hours
      acc[key].entries.push(entry)
      return acc
    }, {} as Record<string, { duration: number; entries: any[] }>)

    return Object.entries(grouped).map(([title, data]) => ({
      title,
      duration: (data as any).duration.toFixed(2),
      amount: ((data as any).duration * (currentUser?.hourly_rate || 0)).toFixed(2)
    }))
  }

  const detailedData = getDetailedData()

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Earnings Report</h2>
          <p className="text-dark-500">Track your hours and earnings</p>
        </div>
        <button className="flex items-center space-x-2 bg-secondary hover:bg-secondary/90 text-white px-4 py-2 rounded-lg transition-colors duration-200">
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
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

          {(startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="text-secondary hover:text-secondary/80 text-sm"
            >
              Clear Filter
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
          <h3 className="text-xl font-semibold text-gray-800">Detailed Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-300">
              <tr>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">#</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Task/Project</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Duration</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-300">
              {detailedData.map((item, index) => (
                <tr key={index} className="hover:bg-dark-300/30 transition-colors duration-200">
                  <td className="py-4 px-6 text-white text-sm">{index + 1}</td>
                  <td className="py-4 px-6 text-white text-sm">{item.title}</td>
                  <td className="py-4 px-6 text-white text-sm">{item.duration}h</td>
                  <td className="py-4 px-6 text-green-400 text-sm font-medium">${item.amount}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-dark-300">
              <tr>
                <td colSpan={2} className="py-4 px-6 text-white font-bold">Total</td>
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