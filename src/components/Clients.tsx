import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useAppContext } from '../context/AppContext'
import { Plus, Edit, Mail, Phone, Building, Clock, FileText, X, Save, Eye, MoreHorizontal, Loader2 } from 'lucide-react'

const Clients = () => {
  const { clients, addClient, updateClient, deleteClient, projects, timeEntries, loading } = useAppContext()
  const [showAddClientModal, setShowAddClientModal] = useState(false)
  const [editingClient, setEditingClient] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: ''
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as Element).closest('.dropdown-trigger')) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeDropdown])

  const handleDropdownToggle = (clientId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (activeDropdown === clientId) {
      setActiveDropdown(null)
      return
    }

    const buttonElement = event.currentTarget as HTMLButtonElement
    const rect = buttonElement.getBoundingClientRect()
    
    setDropdownPosition({
      top: rect.bottom + window.scrollY + 4,
      right: window.innerWidth - rect.right - window.scrollX
    })
    setActiveDropdown(clientId)
  }

  // Helper functions to calculate metrics (excluding archived projects)
  const getClientTotalHours = (clientId: string) => {
    const clientProjects = projects.filter(p => p.client_id === clientId && !p.archived)
    const projectIds = clientProjects.map(p => p.id)
    const totalMinutes = timeEntries
      .filter(entry => projectIds.includes(entry.project_id || ''))
      .reduce((sum, entry) => sum + (entry.duration || 0), 0)
    // Convert minutes to hours
    return totalMinutes / 60
  }

  const getClientActiveProjects = (clientId: string) => {
    return projects.filter(p => p.client_id === clientId && p.status === 'active' && !p.archived).length
  }

  const getClientTotalRevenue = (clientId: string) => {
    const clientProjects = projects.filter(p => p.client_id === clientId && !p.archived)
    const projectIds = clientProjects.map(p => p.id)
    return timeEntries
      .filter(entry => projectIds.includes(entry.project_id || ''))
      .reduce((sum, entry) => {
        const durationInHours = (entry.duration || 0) / 60 // Convert minutes to hours
        const hourlyRate = entry.user_profile?.hourly_rate || 0 // Get actual user rate
        return sum + (durationInHours * hourlyRate)
      }, 0)
  }

  const getClientLastActivity = (clientId: string) => {
    const clientProjects = projects.filter(p => p.client_id === clientId && !p.archived)
    const projectIds = clientProjects.map(p => p.id)
    const latestEntry = timeEntries
      .filter(entry => projectIds.includes(entry.project_id || ''))
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0]
    return latestEntry ? latestEntry.start_time : new Date().toISOString()
  }

  const addNewClient = async () => {
    if (!newClient.name || !newClient.email) {
      alert('Please fill in name and email')
      return
    }

    try {
      await addClient({
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        address: null
      })

      setNewClient({ name: '', email: '', phone: '' })
      setShowAddClientModal(false)
      alert(`Client "${newClient.name}" added successfully!`)
    } catch (error) {
      console.error('Error adding client:', error)
      alert('Error adding client. Please try again.')
    }
  }

  const updateClientField = async (clientId: string, field: string, value: any) => {
    try {
      await updateClient(clientId, { [field]: value })
    } catch (error) {
      console.error('Error updating client:', error)
      alert('Error updating client. Please try again.')
    }
  }

  const saveClientChanges = () => {
    setEditingClient(null)
    alert('Client information updated successfully!')
  }

  const handleDeleteClient = async (clientId: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteClient(clientId)
        alert('Client deleted successfully!')
      } catch (error) {
        console.error('Error deleting client:', error)
        alert('Error deleting client. Please try again.')
      }
    }
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Clients</h2>
          <p className="text-dark-500">Manage your client relationships and track project progress</p>
        </div>
        <button
          onClick={() => setShowAddClientModal(true)}
          className="flex items-center space-x-2 bg-secondary hover:bg-secondary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-500 text-sm">Total Clients</p>
              <p className="text-2xl font-bold text-white">{clients.length}</p>
            </div>
            <Building className="w-8 h-8 text-secondary" />
          </div>
        </div>
        
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-500 text-sm">Active Clients</p>
              <p className="text-2xl font-bold text-green-400">
                {clients.length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-500 text-sm">Total Hours</p>
              <p className="text-2xl font-bold text-blue-400">
                {clients.reduce((sum, client) => sum + getClientTotalHours(client.id), 0).toFixed(1)}h
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-500 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-yellow-400">
                ${clients.reduce((sum, client) => sum + getClientTotalRevenue(client.id), 0).toLocaleString()}
              </p>
            </div>
            <Building className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-dark-200 rounded-xl border border-dark-300">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full">
            <thead className="bg-dark-300 border-b border-dark-400">
              <tr>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Client</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Contact</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Company</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Hours</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Projects</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Revenue</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Last Activity</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-6 h-6 text-secondary animate-spin" />
                      <span className="text-dark-500">Loading clients...</span>
                    </div>
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="text-dark-500">
                      <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No clients found</p>
                      <p className="text-sm mt-2">Add your first client to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                <tr key={client.id} className="hover:bg-dark-300/30 transition-colors duration-200 relative">
                  <td className="py-4 px-6">
                    {editingClient === client.id ? (
                      <input
                        type="text"
                        value={client.name}
                        onChange={(e) => updateClientField(client.id, 'name', e.target.value)}
                        className="w-full bg-dark-400 border border-dark-500 rounded px-3 py-1 text-white text-sm"
                      />
                    ) : (
                      <div>
                        <p className="text-white font-medium">{client.name}</p>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {editingClient === client.id ? (
                      <div className="space-y-2">
                        <input
                          type="email"
                          value={client.email}
                          onChange={(e) => updateClientField(client.id, 'email', e.target.value)}
                          className="w-full bg-dark-400 border border-dark-500 rounded px-3 py-1 text-white text-sm"
                          placeholder="Email"
                        />
                        <input
                          type="tel"
                          value={client.phone || ''}
                          onChange={(e) => updateClientField(client.id, 'phone', e.target.value)}
                          className="w-full bg-dark-400 border border-dark-500 rounded px-3 py-1 text-white text-sm"
                          placeholder="Phone"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="w-3 h-3 text-dark-500" />
                          <span className="text-white">{client.email}</span>
                        </div>
                        {client.phone && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="w-3 h-3 text-dark-500" />
                            <span className="text-white">{client.phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {editingClient === client.id ? (
                      <input
                        type="text"
                        value={client.phone || ''}
                        onChange={(e) => updateClientField(client.id, 'phone', e.target.value)}
                        className="w-full bg-dark-400 border border-dark-500 rounded px-3 py-1 text-white text-sm"
                      />
                    ) : (
                      <span className="text-white">{client.phone || 'N/A'}</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-white font-medium">{getClientTotalHours(client.id).toFixed(1)}h</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-white font-medium">{getClientActiveProjects(client.id)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-white font-medium">${getClientTotalRevenue(client.id).toLocaleString()}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-dark-500 text-sm">{new Date(getClientLastActivity(client.id)).toLocaleDateString()}</span>
                  </td>
                  <td className="py-4 px-6 relative">
                    <div className="flex items-center space-x-2">
                      {editingClient === client.id ? (
                        <>
                          <button
                            onClick={() => saveClientChanges()}
                            className="p-1 text-secondary hover:text-secondary/80 transition-colors duration-200"
                            title="Save Changes"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingClient(null)}
                            className="p-1 text-dark-500 hover:text-white transition-colors duration-200"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setSelectedClient({
                              ...client,
                              totalHours: getClientTotalHours(client.id).toFixed(2),
                              activeProjects: getClientActiveProjects(client.id),
                              totalRevenue: getClientTotalRevenue(client.id),
                              lastActivity: getClientLastActivity(client.id)
                            })}
                            className="p-1 text-dark-500 hover:text-white transition-colors duration-200"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingClient(client.id)}
                            className="p-1 text-dark-500 hover:text-white transition-colors duration-200"
                            title="Edit Client"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDropdownToggle(client.id, e)}
                            className="dropdown-trigger p-1 text-dark-500 hover:text-white transition-colors duration-200"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-200 rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white-800">Add New Client</h3>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="text-dark-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Client Name *</label>
                <input
                  type="text"
                  value={newClient.name}
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  placeholder="Enter client name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Email *</label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  placeholder="client@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Phone</label>
                <input
                  type="tel"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddClientModal(false)}
                className="px-4 py-2 text-dark-500 hover:text-white transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={addNewClient}
                className="bg-secondary hover:bg-secondary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                Add Client
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-200 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white-800">{selectedClient.name}</h3>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-dark-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-white-700 mb-2">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="w-4 h-4 text-dark-500" />
                      <span className="text-white">{selectedClient.email}</span>
                    </div>
                    {selectedClient.phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="w-4 h-4 text-dark-500" />
                        <span className="text-white">{selectedClient.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="w-6 h-6 text-secondary" />
                  </div>
                  <p className="text-2xl font-bold text-white">{selectedClient.totalHours}h</p>
                  <p className="text-sm text-dark-500">Total Hours</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-white">{selectedClient.activeProjects}</p>
                  <p className="text-sm text-dark-500">Active Projects</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Building className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-white">${selectedClient.totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-dark-500">Total Revenue</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-white-700 mb-2">Last Activity</h4>
                <p className="text-dark-500">{new Date(selectedClient.lastActivity).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedClient(null)}
                className="bg-secondary hover:bg-secondary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Portal-based dropdown menu */}
      {activeDropdown && createPortal(
        <div 
          className="fixed bg-dark-300 border border-dark-400 rounded-lg shadow-lg z-[10000] min-w-[120px]"
          style={{
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`
          }}
        >
          <button
            onClick={() => {
              handleDeleteClient(activeDropdown)
              setActiveDropdown(null)
            }}
            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-dark-400 transition-colors duration-200 rounded-lg"
          >
            Delete Client
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}

export default Clients