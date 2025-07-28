import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import { EmailService } from '../lib/emailService'
import { Plus, Send, Eye, Download, DollarSign, Calendar, User, FileText, Mail, Filter, MoreHorizontal, X } from 'lucide-react'

interface Invoice {
  id: string
  client_id: string
  client_name: string
  amount: number
  hours: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date: string
  created_date: string
  items: InvoiceItem[]
  client_email: string
  balance: number
  date_range: { start: string; end: string }
  notes?: string
}

interface InvoiceItem {
  id?: string
  description: string
  hours: number
  rate: number
  amount: number
  type: 'time_entry' | 'additional'
  time_entry_ids?: string[]
}

const Invoices = () => {
  const { clients, timeEntries, projects, currentUser } = useAppContext()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState('')
  
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
  const [invoiceDateRange, setInvoiceDateRange] = useState({
    start: currentMonth.start,
    end: currentMonth.end
  })
  const [additionalItems, setAdditionalItems] = useState<InvoiceItem[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFiltered, setShowFiltered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Guard clause for null currentUser
  if (!currentUser) {
    return <div>Loading...</div>
  }

  // Initialize invoices from localStorage or empty array
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('invoices')
    return saved ? JSON.parse(saved) : []
  })

  // Save invoices to localStorage whenever invoices change
  useEffect(() => {
    localStorage.setItem('invoices', JSON.stringify(invoices))
  }, [invoices])

  // Filter invoices based on user role
  const getFilteredInvoices = () => {
    if (!currentUser) return invoices
    if (currentUser.role === 'client') {
      return invoices.filter(invoice => invoice.client_name === currentUser.company_name)
    }
    return invoices
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500/20 text-gray-400 border-gray-500'
      case 'sent': return 'bg-blue-500/20 text-blue-400 border-blue-500'
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500'
      case 'overdue': return 'bg-red-500/20 text-red-400 border-red-500'
      case 'cancelled': return 'bg-orange-500/20 text-orange-400 border-orange-500'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500'
    }
  }

  // Get time entries for selected client and date range
  const getTimeEntriesForInvoice = () => {
    if (!selectedClient || !invoiceDateRange.start || !invoiceDateRange.end) {
      return []
    }

    // Find the selected client object
    const client = clients.find(c => c.name === selectedClient)
    if (!client) return []

    // Find all projects for this client
    const clientProjects = projects.filter(p => p.client_id === client.id)
    const projectIds = clientProjects.map(p => p.id)

    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.date)
      const startDate = new Date(invoiceDateRange.start)
      const endDate = new Date(invoiceDateRange.end)
      
      return projectIds.includes(entry.project_id || '') && 
             entryDate >= startDate && 
             entryDate <= endDate
    })
  }

  // Calculate invoice preview data
  const getInvoicePreview = () => {
    const entries = getTimeEntriesForInvoice()
    
    // Group entries by project/task and user
    const groupedEntries = entries.reduce((groups, entry) => {
      // Find project and task names
      const project = projects.find(p => p.id === entry.project_id)
      const task = entry.task_id ? projects.flatMap(p => p.tasks || []).find(t => t.id === entry.task_id) : null
      
      const projectTaskKey = task ? `${project?.name || 'Unknown Project'} - ${task.title}` : project?.name || 'General Work'
      const userRate = entry.user_profile?.hourly_rate || currentUser?.hourly_rate || 0
      const userName = entry.user_profile?.full_name || 'Unknown User'
      
      // Create unique key for project/task + user + rate combination
      const key = `${projectTaskKey} (${userName} @ $${userRate}/h)`
      
      if (!groups[key]) {
        groups[key] = { 
          description: projectTaskKey,
          userName,
          hours: 0, 
          rate: userRate,
          entries: [] 
        }
      }
      groups[key].hours += entry.duration / 60 // Convert minutes to hours
      groups[key].entries.push(entry)
      return groups
    }, {} as Record<string, { description: string; userName: string; hours: number; rate: number; entries: any[] }>)

    const timeBasedItems: InvoiceItem[] = Object.values(groupedEntries).map((group: any) => ({
      description: `${group.description} (${group.userName})`,
      hours: Math.round(group.hours * 100) / 100,
      rate: group.rate,
      amount: Math.round(group.hours * group.rate * 100) / 100,
      type: 'time_entry' as const,
      time_entry_ids: group.entries.map((entry: any) => entry.id)
    }))

    // Combine with additional items
    const allItems = [...timeBasedItems, ...additionalItems]
    const totalHours = timeBasedItems.reduce((sum, item) => sum + item.hours, 0)
    const totalAmount = allItems.reduce((sum, item) => sum + item.amount, 0)

    return { items: allItems, totalHours, totalAmount }
  }

  const applyFilters = () => {
    setShowFiltered(true)
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setStatusFilter('all')
    setClientFilter('all')
    setShowFiltered(false)
  }

  const resetInvoiceForm = () => {
    setSelectedClient('')
    const currentMonth = getCurrentMonthDates()
    setInvoiceDateRange({
      start: currentMonth.start,
      end: currentMonth.end
    })
    setAdditionalItems([])
  }

  const generateInvoice = () => {
    if (!selectedClient || !invoiceDateRange.start || !invoiceDateRange.end) {
      alert('Please select client and date range')
      return
    }
    
    try {
      const { items, totalHours, totalAmount } = getInvoicePreview()
      
      if (items.length === 0) {
        alert('No time entries or additional items found for the selected client and date range')
        return
      }

      // Find client data
      const client = clients.find(c => c.name === selectedClient)
      if (!client) {
        alert('Client not found')
        return
      }

      const newInvoice: Invoice = {
        id: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
        client_id: client.id,
        client_name: selectedClient,
        amount: Math.round(totalAmount * 100) / 100,
        hours: Math.round(totalHours * 100) / 100,
        status: 'draft',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_date: new Date().toISOString().split('T')[0],
        client_email: client.email || '',
        balance: Math.round(totalAmount * 100) / 100,
        date_range: { start: invoiceDateRange.start, end: invoiceDateRange.end },
        items
      }

      setInvoices(prev => [...prev, newInvoice])
      setShowCreateModal(false)
      resetInvoiceForm()
      alert(`Invoice ${newInvoice.id} created successfully!`)
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Error creating invoice. Please try again.')
    }
  }

  const prepareEmailPreview = (invoice: Invoice) => {
    const subject = `Invoice ${invoice.id} from TeamFlow - $${invoice.amount.toLocaleString()}`
    const body = `Dear ${invoice.client_name} Team,

I hope this email finds you well. Please find attached invoice ${invoice.id} for the services provided.

Invoice Details:
- Invoice Number: ${invoice.id}
- Amount: $${invoice.amount.toLocaleString()}
- Due Date: ${new Date(invoice.due_date).toLocaleDateString()}
- Total Hours: ${invoice.hours}h
- Period: ${new Date(invoice.date_range.start).toLocaleDateString()} - ${new Date(invoice.date_range.end).toLocaleDateString()}

Services Provided:
${invoice.items.map(item => `• ${item.description}: ${item.hours}h @ $${item.rate}/h = $${item.amount.toLocaleString()}`).join('\n')}

Payment Terms: Net 30 days
Payment can be made via bank transfer or check. Please reference invoice number ${invoice.id} with your payment.

If you have any questions regarding this invoice, please don't hesitate to contact me.

Thank you for your business!

Best regards,
Your TeamFlow Team

---
This invoice was generated automatically by TeamFlow.`

    setEmailSubject(subject)
    setEmailBody(body)
    setSelectedInvoice(invoice)
    setShowEmailPreview(true)
  }

  const sendInvoice = async () => {
    if (!selectedInvoice) return
    
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      
      // Prepare invoice data for email
      const invoiceData = {
        clientEmail: selectedInvoice.client_email,
        clientName: selectedInvoice.client_name,
        invoiceNumber: selectedInvoice.id,
        amount: selectedInvoice.amount,
        dueDate: selectedInvoice.due_date,
        items: selectedInvoice.items.map(item => ({
          description: item.description,
          hours: item.hours,
          rate: item.rate,
          total: item.amount
        })),
        dateRange: {
          start: selectedInvoice.date_range.start,
          end: selectedInvoice.date_range.end
        }
      }

      // Send email using EmailService
      await EmailService.sendInvoiceEmail(invoiceData)
      
      // Update invoice status to sent
      setInvoices(prev => prev.map(inv => 
        inv.id === selectedInvoice.id ? { ...inv, status: 'sent' } : inv
      ))
      
      setShowEmailPreview(false)
      setSelectedInvoice(null)
      setSuccess('Invoice sent successfully!')
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000)
    } catch (error) {
      console.error('Error sending invoice:', error)
      setError('Failed to send invoice. Please try again.')
      
      // Clear error message after 10 seconds
      setTimeout(() => setError(''), 10000)
    } finally {
      setLoading(false)
    }
  }

  const updateInvoiceStatus = (invoiceId: string, newStatus: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled') => {
    try {
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId ? { 
          ...inv, 
          status: newStatus,
          balance: newStatus === 'paid' ? 0 : inv.amount
        } : inv
      ))
    } catch (error) {
      console.error('Error updating invoice status:', error)
    }
  }

  const deleteInvoice = (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        setInvoices(prev => prev.filter(inv => inv.id !== invoiceId))
      } catch (error) {
        console.error('Error deleting invoice:', error)
      }
    }
  }

  // Filter invoices
  const baseInvoices = getFilteredInvoices()
  const filteredInvoices = baseInvoices.filter(invoice => {
    if (statusFilter !== 'all' && invoice.status !== statusFilter) return false
    if (currentUser.role !== 'client' && clientFilter !== 'all' && invoice.client_name !== clientFilter) return false
    
    // Date range filter
    if (startDate || endDate) {
      const invoiceDate = new Date(invoice.created_date)
      const start = startDate ? new Date(startDate) : new Date('1900-01-01')
      const end = endDate ? new Date(endDate) : new Date('2100-12-31')
      if (invoiceDate < start || invoiceDate > end) return false
    }
    
    return true
  })

  const invoicePreview = getInvoicePreview()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {currentUser.role === 'client' ? 'My Invoices' : 'Invoices'}
          </h2>
          <p className="text-dark-500">
            {currentUser.role === 'client' 
              ? 'View your invoices and payment status' 
              : 'Manage and generate client invoices'
            }
          </p>
        </div>
        {currentUser.role !== 'client' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-secondary hover:bg-secondary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>New Invoice</span>
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {currentUser.role === 'client' ? (
          <>
            <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-500 text-sm">Total Invoices</p>
                  <p className="text-2xl font-bold text-white">{filteredInvoices.length}</p>
                </div>
                <FileText className="w-8 h-8 text-secondary" />
              </div>
            </div>
            
            <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-500 text-sm">Paid Invoices</p>
                  <p className="text-2xl font-bold text-green-400">
                    {filteredInvoices.filter(inv => inv.status === 'paid').length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-500 text-sm">Pending Payment</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {filteredInvoices.filter(inv => inv.status === 'sent').length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-500 text-sm">Overdue</p>
                  <p className="text-2xl font-bold text-red-400">
                    {filteredInvoices.filter(inv => inv.status === 'overdue').length}
                  </p>
                </div>
                <User className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-500 text-sm">Total Invoiced</p>
                  <p className="text-2xl font-bold text-white">
                    ${filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-500 text-sm">Paid</p>
                  <p className="text-2xl font-bold text-green-400">
                    ${filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-500 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-blue-400">
                    ${filteredInvoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-500 text-sm">Overdue</p>
                  <p className="text-2xl font-bold text-red-400">
                    ${filteredInvoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
                  </p>
                </div>
                <User className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="bg-dark-200 rounded-xl p-4 border border-dark-300">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-dark-500" />
            <span className="text-sm text-dark-500">Filters:</span>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-100 border border-gray-300 rounded px-3 py-1 text-gray-900 text-sm"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {currentUser.role !== 'client' && (
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="bg-gray-100 border border-gray-300 rounded px-3 py-1 text-gray-900 text-sm"
            >
              <option value="all">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.name}>{client.name}</option>
              ))}
            </select>
          )}

          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-dark-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-gray-100 border border-gray-300 rounded px-3 py-1 text-gray-900 text-sm"
              placeholder="Start Date"
            />
            <span className="text-dark-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gray-100 border border-gray-300 rounded px-3 py-1 text-gray-900 text-sm"
              placeholder="End Date"
            />
          </div>

          <button
            onClick={applyFilters}
            className="bg-secondary hover:bg-secondary/90 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm"
          >
            Apply Filter
          </button>

          {(statusFilter !== 'all' || clientFilter !== 'all' || startDate || endDate || showFiltered) && (
            <button
              onClick={clearFilters}
              className="text-secondary hover:text-secondary/80 text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
        
        {showFiltered && (startDate || endDate) && (
          <div className="text-xs text-secondary">
            Filters applied: {startDate && `From ${new Date(startDate).toLocaleDateString()}`} {endDate && `To ${new Date(endDate).toLocaleDateString()}`}
          </div>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-dark-200 rounded-xl border border-dark-300">
        <div>
          <table className="w-full">
            <thead className="bg-dark-300 border-b border-dark-400">
              <tr>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Status</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Number</th>
                {currentUser.role !== 'client' && (
                  <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Client</th>
                )}
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Amount</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">
                  {currentUser.role === 'client' ? 'Payment Status' : 'Balance'}
                </th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Period</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Due Date</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-300">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-dark-300/30 transition-colors duration-200">
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-secondary font-medium">{invoice.id}</span>
                  </td>
                  {currentUser.role !== 'client' && (
                    <td className="py-4 px-6">
                      <span className="text-white font-medium">{invoice.client_name}</span>
                    </td>
                  )}
                  <td className="py-4 px-6">
                    <span className="text-white font-medium">${invoice.amount.toLocaleString()}</span>
                  </td>
                  <td className="py-4 px-6">
                    {currentUser.role === 'client' ? (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'paid' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {invoice.status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    ) : (
                      <span className={`font-medium ${invoice.balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        ${invoice.balance.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-dark-500 text-sm">
                      {new Date(invoice.date_range.start).toLocaleDateString()} - {new Date(invoice.date_range.end).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-dark-500">{new Date(invoice.due_date).toLocaleDateString()}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="p-2 text-dark-500 hover:text-white hover:bg-dark-400 rounded transition-colors duration-200"
                        title="View Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {currentUser.role !== 'client' && (
                        <>
                          <button
                            onClick={() => prepareEmailPreview(invoice)}
                            className="p-2 text-dark-500 hover:text-secondary hover:bg-dark-400 rounded transition-colors duration-200"
                            title="Send Invoice"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <div className="relative group">
                            <button className="p-2 text-dark-500 hover:text-white hover:bg-dark-400 rounded transition-colors duration-200">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 bg-dark-300 border border-dark-400 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[120px]">
                              <button
                                onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-dark-400 transition-colors duration-200 rounded-t-lg"
                              >
                                Mark as Paid
                              </button>
                              <button
                                onClick={() => updateInvoiceStatus(invoice.id, 'sent')}
                                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-dark-400 transition-colors duration-200"
                              >
                                Mark as Sent
                              </button>
                              <button
                                onClick={() => updateInvoiceStatus(invoice.id, 'cancelled')}
                                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-dark-400 transition-colors duration-200"
                              >
                                Cancel Invoice
                              </button>
                              <button
                                onClick={() => deleteInvoice(invoice.id)}
                                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-dark-400 transition-colors duration-200 rounded-b-lg"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-dark-500 mx-auto mb-4" />
            <p className="text-dark-500">No invoices found matching your filters</p>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && currentUser.role !== 'client' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-200 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-white-800 mb-6">Create New Invoice</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Client *</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.name}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Invoice Period *</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-dark-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={invoiceDateRange.start}
                      onChange={(e) => setInvoiceDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={invoiceDateRange.end}
                      onChange={(e) => setInvoiceDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Items Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-dark-500">Additional Items</label>
                  <button
                    type="button"
                    onClick={() => setAdditionalItems(prev => [...prev, {
                      description: '',
                      hours: 0,
                      rate: currentUser?.hourly_rate || 80,
                      amount: 0,
                      type: 'additional'
                    }])}
                    className="text-secondary hover:text-secondary/80 text-sm"
                  >
                    + Add Item
                  </button>
                </div>
                
                {additionalItems.length > 0 && (
                  <div className="space-y-3 bg-dark-300 rounded-lg p-4">
                    {additionalItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          <label className="block text-xs text-dark-500 mb-1">Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...additionalItems]
                              newItems[index].description = e.target.value
                              setAdditionalItems(newItems)
                            }}
                            className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-1 text-gray-900 text-sm"
                            placeholder="Item description"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-dark-500 mb-1">Hours</label>
                          <input
                            type="number"
                            step="0.1"
                            value={item.hours}
                            onChange={(e) => {
                              const newItems = [...additionalItems]
                              const hours = parseFloat(e.target.value) || 0
                              newItems[index].hours = hours
                              newItems[index].amount = hours * newItems[index].rate
                              setAdditionalItems(newItems)
                            }}
                            className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-1 text-gray-900 text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-dark-500 mb-1">Rate ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => {
                              const newItems = [...additionalItems]
                              const rate = parseFloat(e.target.value) || 0
                              newItems[index].rate = rate
                              newItems[index].amount = newItems[index].hours * rate
                              setAdditionalItems(newItems)
                            }}
                            className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-1 text-gray-900 text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-dark-500 mb-1">Amount</label>
                          <div className="bg-dark-400 rounded px-3 py-1 text-white text-sm">
                            ${item.amount.toFixed(2)}
                          </div>
                        </div>
                        <div className="col-span-1">
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = additionalItems.filter((_, i) => i !== index)
                              setAdditionalItems(newItems)
                            }}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors duration-200"
                            title="Remove item"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedClient && invoiceDateRange.start && invoiceDateRange.end && (
                <div className="bg-dark-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-700">Invoice Preview</h4>
                    {invoiceDateRange.start === currentMonth.start && invoiceDateRange.end === currentMonth.end && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Current Month</span>
                    )}
                  </div>
                  {invoicePreview.items.length > 0 ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {invoicePreview.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <div className="flex-1">
                              <span className="text-dark-500">{item.description}</span>
                              {item.type === 'additional' && (
                                <span className="ml-2 px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded">Additional</span>
                              )}
                            </div>
                            <span className="text-white">{item.hours}h × ${item.rate} = ${item.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-dark-400 pt-2 flex justify-between font-medium">
                        <span className="text-white">Total Hours: {invoicePreview.totalHours.toFixed(2)}h</span>
                        <span className="text-secondary">Total Amount: ${invoicePreview.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-dark-500 text-sm">
                      {additionalItems.length > 0 ? 'Only additional items added' : 'No time entries or additional items found for this period'}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetInvoiceForm()
                }}
                className="px-4 py-2 text-dark-500 hover:text-white transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={generateInvoice}
                disabled={!selectedClient || !invoiceDateRange.start || !invoiceDateRange.end}
                className="bg-secondary hover:bg-secondary/90 disabled:bg-dark-400 disabled:text-dark-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                Create Invoice
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Email Preview Modal */}
      {showEmailPreview && selectedInvoice && currentUser.role !== 'client' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-200 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Email Preview - Invoice {selectedInvoice.id}</h3>
              <button
                onClick={() => setShowEmailPreview(false)}
                className="text-dark-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">To:</label>
                <div className="bg-dark-300 rounded-lg px-4 py-2 text-white">
                  {selectedInvoice.client_email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Subject:</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Message:</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  rows={15}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Attachment:</label>
                <div className="bg-dark-300 rounded-lg px-4 py-2 text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-secondary" />
                  <span>Invoice_{selectedInvoice.id}.pdf</span>
                  <span className="text-dark-500 text-sm">({Math.round(selectedInvoice.amount / 100)}KB)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEmailPreview(false)}
                className="px-4 py-2 text-dark-500 hover:text-white transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={sendInvoice}
                disabled={loading}
                className="flex items-center space-x-2 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                <Mail className="w-4 h-4" />
                <span>{loading ? 'Sending...' : 'Send Invoice'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && !showEmailPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-200 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Invoice {selectedInvoice.id}</h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-dark-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Client</h4>
                  <p className="text-dark-500">{selectedInvoice.client_name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Status</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedInvoice.status)}`}>
                    {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Invoice Period</h4>
                  <p className="text-dark-500">
                    {new Date(selectedInvoice.date_range.start).toLocaleDateString()} - {new Date(selectedInvoice.date_range.end).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Due Date</h4>
                  <p className="text-dark-500">{new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-4">Invoice Items</h4>
                <div className="bg-dark-300 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-dark-400">
                      <tr>
                        <th className="text-left py-3 px-4 text-dark-500 font-medium">Description</th>
                        <th className="text-left py-3 px-4 text-dark-500 font-medium">Hours</th>
                        <th className="text-left py-3 px-4 text-dark-500 font-medium">Rate</th>
                        <th className="text-left py-3 px-4 text-dark-500 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, index) => (
                        <tr key={index} className="border-t border-dark-400">
                          <td className="py-3 px-4 text-white">{item.description}</td>
                          <td className="py-3 px-4 text-white">{item.hours}h</td>
                          <td className="py-3 px-4 text-white">${item.rate}</td>
                          <td className="py-3 px-4 text-white">${item.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-dark-400 bg-dark-400">
                        <td className="py-3 px-4 text-white font-bold">Total</td>
                        <td className="py-3 px-4 text-secondary font-bold">{selectedInvoice.hours}h</td>
                        <td className="py-3 px-4"></td>
                        <td className="py-3 px-4 text-green-400 font-bold">${selectedInvoice.amount.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button className="flex items-center space-x-2 bg-dark-300 hover:bg-dark-400 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              {currentUser.role !== 'client' && (
                <button 
                  onClick={() => prepareEmailPreview(selectedInvoice)}
                  className="flex items-center space-x-2 bg-secondary hover:bg-secondary/90 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  <Send className="w-4 h-4" />
                  <span>Send to Client</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Invoices