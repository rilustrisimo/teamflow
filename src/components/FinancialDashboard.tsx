import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { DollarSign, TrendingUp, TrendingDown, Clock } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'manager' | 'team-member' | 'admin'
  hourlyRate: number
  totalHours: number
  monthlyHours: number
  ytdHours: number
  monthlyPayout: number
  ytdPayout: number
}

const FinancialDashboard = () => {
  const { clients, currentUser } = useAppContext()
  const [viewType, setViewType] = useState<'monthly' | 'ytd'>('monthly')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  // Generate dynamic year options (current year and previous 4 years)
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = 0; i < 5; i++) {
      years.push(currentYear - i)
    }
    return years
  }

  // Calculate team members data from real data
  const teamMembers: TeamMember[] = [
    // This would be populated from actual user profiles and time entries
    // For now, we'll use a placeholder
  ]

  // Mock invoice data - in real app this would come from invoices
  const mockInvoices = [
    { id: 'INV-001', amount: 3256, status: 'paid', date: '2024-01-15', client: 'TechCorp' },
    { id: 'INV-002', amount: 4104, status: 'paid', date: '2024-01-10', client: 'StartupXYZ' },
    { id: 'INV-003', amount: 2264, status: 'pending', date: '2024-01-30', client: 'Creative Co' },
    { id: 'INV-004', amount: 5890, status: 'paid', date: '2024-01-25', client: 'E-commerce Plus' }
  ]

  const calculateFinancials = () => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()

    // Calculate revenue from paid invoices
    const monthlyRevenue = mockInvoices
      .filter(inv => {
        const invDate = new Date(inv.date)
        return inv.status === 'paid' && 
               invDate.getMonth() === (viewType === 'monthly' ? selectedMonth : currentMonth) &&
               invDate.getFullYear() === selectedYear
      })
      .reduce((sum, inv) => sum + inv.amount, 0)

    const ytdRevenue = mockInvoices
      .filter(inv => {
        const invDate = new Date(inv.date)
        return inv.status === 'paid' && invDate.getFullYear() === selectedYear
      })
      .reduce((sum, inv) => sum + inv.amount, 0)

    // Calculate expenses (team member payouts)
    const monthlyExpenses = teamMembers.reduce((sum, member) => 
      sum + (viewType === 'monthly' ? member.monthlyPayout : member.monthlyPayout), 0)
    
    const ytdExpenses = teamMembers.reduce((sum, member) => sum + member.ytdPayout, 0)

    return {
      revenue: viewType === 'monthly' ? monthlyRevenue : ytdRevenue,
      expenses: viewType === 'monthly' ? monthlyExpenses : ytdExpenses,
      profit: viewType === 'monthly' ? (monthlyRevenue - monthlyExpenses) : (ytdRevenue - ytdExpenses),
      profitMargin: viewType === 'monthly' 
        ? (monthlyRevenue > 0 ? ((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100 : 0)
        : (ytdRevenue > 0 ? ((ytdRevenue - ytdExpenses) / ytdRevenue) * 100 : 0)
    }
  }

  const financials = calculateFinancials()
  const currentUserData = teamMembers.find(member => member.id === currentUser?.id)

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Return loading state if no current user
  if (!currentUser) {
    return <div>Loading...</div>
  }

  // Team Member View
  if (currentUser.role === 'team-member') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">My Earnings</h2>
            <p className="text-dark-500">Track your hours and earnings</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value as 'monthly' | 'ytd')}
              className="bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
            >
              <option value="monthly">Monthly View</option>
              <option value="ytd">Year to Date</option>
            </select>
            {viewType === 'monthly' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Team Member Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-500 text-sm">Hours Worked</p>
                <p className="text-2xl font-bold text-white">
                  {viewType === 'monthly' ? currentUserData?.monthlyHours.toFixed(1) : currentUserData?.ytdHours.toFixed(1)}h
                </p>
              </div>
              <Clock className="w-8 h-8 text-secondary" />
            </div>
          </div>
          
          <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-500 text-sm">Hourly Rate</p>
                <p className="text-2xl font-bold text-white">${currentUserData?.hourlyRate}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-500 text-sm">
                  {viewType === 'monthly' ? 'Monthly' : 'YTD'} Earnings
                </p>
                <p className="text-2xl font-bold text-green-400">
                  ${viewType === 'monthly' ? currentUserData?.monthlyPayout.toLocaleString() : currentUserData?.ytdPayout.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Earnings Breakdown */}
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
          <h3 className="text-xl font-semibold text-white mb-4">Earnings Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-dark-300">
              <span className="text-dark-500">Base Hours</span>
              <span className="text-white">
                {viewType === 'monthly' ? currentUserData?.monthlyHours.toFixed(1) : currentUserData?.ytdHours.toFixed(1)}h
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-dark-300">
              <span className="text-dark-500">Rate per Hour</span>
              <span className="text-white">${currentUserData?.hourlyRate}</span>
            </div>
            <div className="flex justify-between items-center py-3 font-semibold">
              <span className="text-white">Total Earnings</span>
              <span className="text-green-400">
                ${viewType === 'monthly' ? currentUserData?.monthlyPayout.toLocaleString() : currentUserData?.ytdPayout.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Agency Owner/Manager View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Financial Dashboard</h2>
          <p className="text-dark-500">Revenue, expenses, and team payouts overview</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value as 'monthly' | 'ytd')}
            className="bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
          >
            <option value="monthly">Monthly View</option>
            <option value="ytd">Year to Date</option>
          </select>
          {viewType === 'monthly' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          )}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
          >
            {getAvailableYears().map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-500 text-sm">Revenue</p>
              <p className="text-2xl font-bold text-green-400">${financials.revenue.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-500 text-sm">Expenses</p>
              <p className="text-2xl font-bold text-red-400">${financials.expenses.toLocaleString()}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-500 text-sm">Profit</p>
              <p className={`text-2xl font-bold ${financials.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${financials.profit.toLocaleString()}
              </p>
            </div>
            <DollarSign className={`w-8 h-8 ${financials.profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </div>
        </div>
        
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-500 text-sm">Profit Margin</p>
              <p className={`text-2xl font-bold ${financials.profitMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {financials.profitMargin.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className={`w-8 h-8 ${financials.profitMargin >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Revenue Breakdown */}
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
          <h3 className="text-xl font-semibold text-white mb-4">Revenue Sources</h3>
          <div className="space-y-4">
            {clients.map((client) => {
              const clientRevenue = mockInvoices
                .filter(inv => {
                  const invDate = new Date(inv.date)
                  const isCorrectPeriod = viewType === 'monthly' 
                    ? invDate.getMonth() === selectedMonth && invDate.getFullYear() === selectedYear
                    : invDate.getFullYear() === selectedYear
                  return inv.client === client.company && inv.status === 'paid' && isCorrectPeriod
                })
                .reduce((sum, inv) => sum + inv.amount, 0)
              
              if (clientRevenue === 0) return null
              
              const percentage = financials.revenue > 0 ? (clientRevenue / financials.revenue) * 100 : 0
              
              return (
                <div key={client.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-secondary rounded-full"></div>
                    <span className="text-white">{client.company}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">${clientRevenue.toLocaleString()}</div>
                    <div className="text-dark-500 text-sm">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Team Member Payouts */}
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
          <h3 className="text-xl font-semibold text-white mb-4">Team Payouts</h3>
          <div className="space-y-4">
            {teamMembers.map((member) => {
              const payout = viewType === 'monthly' ? member.monthlyPayout : member.ytdPayout
              const hours = viewType === 'monthly' ? member.monthlyHours : member.ytdHours
              
              return (
                <div key={member.id} className="flex items-center justify-between p-3 bg-dark-300 rounded-lg">
                  <div>
                    <div className="text-white font-medium">{member.name}</div>
                    <div className="text-dark-500 text-sm">{hours.toFixed(1)}h @ ${member.hourlyRate}/hr</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">${payout.toLocaleString()}</div>
                    <div className="text-dark-500 text-sm capitalize">{member.role.replace('-', ' ')}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Detailed Financial Table */}
      <div className="bg-dark-200 rounded-xl border border-dark-300 overflow-hidden">
        <div className="p-6 border-b border-dark-300">
          <h3 className="text-xl font-semibold text-white">Financial Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-300">
              <tr>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Category</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Description</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Amount</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-300">
              <tr className="hover:bg-dark-300/30 transition-colors duration-200">
                <td className="py-4 px-6">
                  <span className="text-green-400 font-medium">Revenue</span>
                </td>
                <td className="py-4 px-6 text-white">Client Payments</td>
                <td className="py-4 px-6 text-green-400 font-medium">${financials.revenue.toLocaleString()}</td>
                <td className="py-4 px-6 text-white">100%</td>
              </tr>
              <tr className="hover:bg-dark-300/30 transition-colors duration-200">
                <td className="py-4 px-6">
                  <span className="text-red-400 font-medium">Expenses</span>
                </td>
                <td className="py-4 px-6 text-white">Team Payouts</td>
                <td className="py-4 px-6 text-red-400 font-medium">-${financials.expenses.toLocaleString()}</td>
                <td className="py-4 px-6 text-white">
                  {financials.revenue > 0 ? ((financials.expenses / financials.revenue) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr className="hover:bg-dark-300/30 transition-colors duration-200 bg-dark-400">
                <td className="py-4 px-6">
                  <span className={`font-bold ${financials.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    Net Profit
                  </span>
                </td>
                <td className="py-4 px-6 text-white">Total Profit</td>
                <td className={`py-4 px-6 font-bold ${financials.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${financials.profit.toLocaleString()}
                </td>
                <td className="py-4 px-6 text-white font-bold">
                  {financials.profitMargin.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default FinancialDashboard