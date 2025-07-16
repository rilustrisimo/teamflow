import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import { Plus, Send, Eye, Download, DollarSign, Calendar, User, FileText, Mail, Filter, MoreHorizontal, X } from 'lucide-react'

interface Invoice {
  id: string
  client: string
  amount: number
  hours: number
  rate: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  dueDate: string
  createdDate: string
  items: { description: string; hours: number; rate: number }[]
  clientEmail: string
  balance: number
  dateRange: { start: string; end: string }
}

const Invoices = () => {
  const { clients, timeEntries, currentUser } = useAppContext()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState('')
  const [hourlyRate, setHourlyRate] = useState(80)
  const [invoiceDateRange, setInvoiceDateRange] = useState({
    start: '',
    end: ''
  })
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFiltered, setShowFiltered] = useState(false)

  // Guard clause for null currentUser
  if (!currentUser) {
    return <div>Loading...</div>
  }

  const clientEmails = {
    'TechCorp': 'contact@techcorp.com',
    'StartupXYZ': 'billing@startupxyz.com',
    'Creative Co': 'admin@creativeco.com',
    'E-commerce Plus': 'finance@ecommerceplus.com'
  }

  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'INV-001',
      client: 'TechCorp',
      amount: 3256,
      hours: 40.7,
      rate: 80,
      status: 'sent',
      dueDate: '2024-02-15',
      createdDate: '2024-01-15',
      clientEmail: 'contact@techcorp.com',
      balance: 3256,
      dateRange: { start: '2024-01-01', end: '2024-01-15' },
      items: [
        { description: 'Website Redesign', hours: 24.5, rate: 80 },
        { description: 'API Integration', hours: 16.2, rate: 80 }
      ]
    },
    {
      id: 'INV-002',
      client: 'StartupXYZ',
      amount: 4104,
      hours: 51.3,
      rate: 80,
      status: 'paid',
      dueDate: '2024-02-10',
      createdDate: '2024-01-10',
      clientEmail: 'billing@startupxyz.com',
      balance: 0,
      dateRange: { start: '2024-01-01', end: '2024-01-10' },
      items: [
        { description: 'Mobile App Development', hours: 32.8, rate: 80 },
        { description: 'Backend Setup', hours: 18.5, rate: 80 }
      ]
    },
    {
      id: 'INV-003',
      client: 'Creative Co',
      amount: 2264,
      hours: 28.3,
      rate: 80,
      status: 'overdue',
      dueDate: '2024-01-30',
      createdDate: '2024-01-01',
      clientEmail: 'admin@creativeco.com',
      balance: 2264,
      dateRange: { start: '2023-12-01', end: '2024-01-01' },
      items: [
        { description: 'Brand Identity Design', hours: 28.3, rate: 80 }
      ]
    }
  ])

  // Filter invoices based on user role
  const getFilteredInvoices = () => {
    if (!currentUser) return invoices
    if (currentUser.role === 'client') {
      return invoices.filter(invoice => invoice.client === currentUser.company_name)
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

    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.date)
      const startDate = new Date(invoiceDateRange.start)
      const endDate = new Date(invoiceDateRange.end)
      
      return entry.client === selectedClient && 
             entryDate >= startDate && 
             entryDate <= endDate
    })
  }

  // Calculate invoice preview data
  const getInvoicePreview = () => {
    const entries = getTimeEntriesForInvoice()
    
    // Group entries by project/task
    const groupedEntries = entries.reduce((groups, entry) => {
      const key = entry.task || entry.project || 'General Work'
      if (!groups[key]) {
        groups[key] = { description: key, hours: 0, entries: [] }
      }
      groups[key].hours += entry.duration
      groups[key].entries.push(entry)
      return groups
    }, {} as Record<string, { description: string; hours: number; entries: any[] }>)

    const items = Object.values(groupedEntries).map((group: any) => ({
      description: group.description,
      hours: Math.round(group.hours * 100) / 100,
      rate: hourlyRate
    }))

    const totalHours = items.reduce((sum, item) => sum + item.hours, 0)
    const totalAmount = totalHours * hourlyRate

    return { items, totalHours, totalAmount }
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

  const generateInvoice = () => {
    if (!selectedClient || !invoiceDateRange.start || !invoiceDateRange.end) {
      alert('Please select client and date range')
      return
    }
    
    try {
      const { items, totalHours, totalAmount } = getInvoicePreview()
      
      if (items.length === 0) {
        alert('No time entries found for the selected client and date range')
        return
      }

      const newInvoice: Invoice = {
        id: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
        client: selectedClient,
        amount: Math.round(totalAmount * 100) / 100,
        hours: Math.round(totalHours * 100) / 100,
        rate: hourlyRate,
        status: 'draft',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdDate: new Date().toISOString().split('T')[0],
        clientEmail: clientEmails[selectedClient as keyof typeof clientEmails] || '',
        balance: Math.round(totalAmount * 100) / 100,
        dateRange: { start: invoiceDateRange.start, end: invoiceDateRange.end },
        items
      }

      setInvoices(prev => [...prev, newInvoice])
      setShowCreateModal(false)
      setSelectedClient('')
      setInvoiceDateRange({ start: '', end: '' })
      alert(`Invoice ${newInvoice.id} created successfully!`)
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Error creating invoice. Please try again.')
    }
  }

  const prepareEmailPreview = (invoice: Invoice) => {
    const subject = `Invoice ${invoice.id} from TeamFlow - $${invoice.amount.toLocaleString()}`
    const body = `Dear ${invoice.client} Team,

I hope this email finds you well. Please find attached invoice ${invoice.id} for the services provided.

Invoice Details:
- Invoice Number: ${invoice.id}
- Amount: $${invoice.amount.toLocaleString()}
- Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
- Total Hours: ${invoice.hours}h
- Period: ${new Date(invoice.dateRange.start).toLocaleDateString()} - ${new Date(invoice.dateRange.end).toLocaleDateString()}

Services Provided:
${invoice.items.map(item => `• ${item.description}: ${item.hours}h @ $${item.rate}/h = $${(item.hours * item.rate).toLocaleString()}`).join('\n')}

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

  const sendInvoice = () => {
    if (!selectedInvoice) return
    
    try {
      console.log('Sending invoice email:', {
        to: selectedInvoice.clientEmail,
        subject: emailSubject,
        body: emailBody,
        invoice: selectedInvoice
      })
      
      // Update invoice status to sent
      setInvoices(prev => prev.map(inv => 
        inv.id === selectedInvoice.id ? { ...inv, status: 'sent' } : inv
      ))
      
      setShowEmailPreview(false)
      setSelectedInvoice(null)
      alert('Invoice sent successfully!')
    } catch (error) {
      console.error('Error sending invoice:', error)
      alert('Error sending invoice. Please try again.')
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
    if (currentUser.role !== 'client' && clientFilter !== 'all' && invoice.client !== clientFilter) return false
    
    // Date range filter
    if (startDate || endDate) {
      const invoiceDate = new Date(invoice.createdDate)
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
          <h2 className="text-2xl font-bold text-white">
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
            className="bg-dark-300 border border-dark-400 rounded px-3 py-1 text-white text-sm"
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
              className="bg-dark-300 border border-dark-400 rounded px-3 py-1 text-white text-sm"
            >
              <option value="all">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.company}>{client.company}</option>
              ))}
            </select>
          )}

          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-dark-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-dark-300 border border-dark-400 rounded px-3 py-1 text-white text-sm"
              placeholder="Start Date"
            />
            <span className="text-dark-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-dark-300 border border-dark-400 rounded px-3 py-1 text-white text-sm"
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
      <div className="bg-dark-200 rounded-xl border border-dark-300 overflow-hidden">
        <div className="overflow-x-auto">
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
                      <span className="text-white font-medium">{invoice.client}</span>
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
                      {new Date(invoice.dateRange.start).toLocaleDateString()} - {new Date(invoice.dateRange.end).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-dark-500">{new Date(invoice.dueDate).toLocaleDateString()}</span>
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
                            <div className="absolute right-0 top-full mt-1 bg-dark-300 border border-dark-400 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[120px]">
                              <button
                                onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-dark-400 transition-colors duration-200"
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
                                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-dark-400 transition-colors duration-200"
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
            <h3 className="text-xl font-bold text-white mb-6">Create New Invoice</h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">Client *</label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.company}>{client.company}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">Hourly Rate ($) *</label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                  />
                </div>
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
                      className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={invoiceDateRange.end}
                      onChange={(e) => setInvoiceDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              {selectedClient && invoiceDateRange.start && invoiceDateRange.end && (
                <div className="bg-dark-300 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3">Invoice Preview</h4>
                  {invoicePreview.items.length > 0 ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {invoicePreview.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-dark-500">{item.description}</span>
                            <span className="text-white">{item.hours}h × ${item.rate} = ${(item.hours * item.rate).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-dark-400 pt-2 flex justify-between font-medium">
                        <span className="text-white">Total Hours: {invoicePreview.totalHours.toFixed(2)}h</span>
                        <span className="text-secondary">Total Amount: ${invoicePreview.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-dark-500 text-sm">No time entries found for the selected period</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
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
              <h3 className="text-xl font-bold text-white">Email Preview - Invoice {selectedInvoice.id}</h3>
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
                  {selectedInvoice.clientEmail}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Subject:</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Message:</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
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
                className="flex items-center space-x-2 bg-secondary hover:bg-secondary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                <Mail className="w-4 h-4" />
                <span>Send Invoice</span>
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
              <h3 className="text-xl font-bold text-white">Invoice {selectedInvoice.id}</h3>
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
                  <h4 className="font-medium text-white mb-2">Client</h4>
                  <p className="text-dark-500">{selectedInvoice.client}</p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Status</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedInvoice.status)}`}>
                    {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-white mb-2">Invoice Period</h4>
                  <p className="text-dark-500">
                    {new Date(selectedInvoice.dateRange.start).toLocaleDateString()} - {new Date(selectedInvoice.dateRange.end).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Due Date</h4>
                  <p className="text-dark-500">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-white mb-4">Invoice Items</h4>
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
                          <td className="py-3 px-4 text-white">${(item.hours * item.rate).toLocaleString()}</td>
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