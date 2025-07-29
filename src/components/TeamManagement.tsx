import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import { Plus, Mail, X, Users, Shield, UserCheck, Briefcase, Loader2 } from 'lucide-react'

const TeamManagement = () => {
  const { currentUser, teamMembers, inviteUser, loading } = useAppContext()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'team-member' as 'manager' | 'team-member' | 'client',
    message: ''
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  // Only allow admins and managers to manage team
  if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 text-dark-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">Access Restricted</h3>
        <p className="text-dark-500">Only admins and managers can manage team members.</p>
      </div>
    )
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: {[key: string]: string} = {}
    
    if (!inviteForm.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(inviteForm.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    // Check if user already exists
    const existingUser = teamMembers.find(member => 
      member.user_id === inviteForm.email // Using user_id as a temporary check since email field doesn't exist
    )
    if (existingUser) {
      newErrors.email = 'User with this email already exists in your team'
    }
    
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    try {
      await inviteUser(inviteForm.email, inviteForm.role)
      
      setInviteForm({ email: '', role: 'team-member', message: '' })
      setShowInviteModal(false)
      showNotification(`Invitation sent to ${inviteForm.email}`, 'success')
    } catch (error: any) {
      showNotification(error.message || 'Failed to send invitation', 'error')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setInviteForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />
      case 'manager': return <UserCheck className="w-4 h-4" />
      case 'client': return <Briefcase className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'manager': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'client': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default: return 'bg-green-500/20 text-green-400 border-green-500/30'
    }
  }

  // Group team members by role
  const groupedMembers = teamMembers.reduce((acc, member) => {
    const role = member.role || 'team-member'
    if (!acc[role]) acc[role] = []
    acc[role].push(member)
    return acc
  }, {} as Record<string, typeof teamMembers>)

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}
        >
          {notification.message}
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Team Management</h2>
          <p className="text-dark-500">Manage your team members and send invitations</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['admin', 'manager', 'team-member', 'client'].map(role => {
          const members = groupedMembers[role] || []
          const roleLabel = role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
          
          return (
            <div key={role} className="bg-dark-200 rounded-xl p-6 border border-dark-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getRoleIcon(role)}
                  <h3 className="font-medium text-gray-800">{roleLabel}s</h3>
                </div>
                <span className="text-2xl font-bold text-primary">{members.length}</span>
              </div>
              <div className="space-y-2">
                {members.slice(0, 3).map(member => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-medium text-white">
                      {member.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-dark-400 text-sm truncate">{member.full_name}</span>
                  </div>
                ))}
                {members.length > 3 && (
                  <p className="text-dark-500 text-xs">+{members.length - 3} more</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Team Members List */}
      <div className="bg-dark-200 rounded-xl p-6 border border-dark-300">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">All Team Members ({teamMembers.length})</h3>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <span className="text-dark-500">Loading team members...</span>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-dark-500 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-800 mb-2">No team members yet</h4>
            <p className="text-dark-500 mb-4">Start building your team by inviting members</p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
            >
              Send First Invitation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-300">
                  <th className="text-left py-3 text-dark-500 font-medium">Member</th>
                  <th className="text-left py-3 text-dark-500 font-medium">Role</th>
                  <th className="text-left py-3 text-dark-500 font-medium">Company</th>
                  <th className="text-left py-3 text-dark-500 font-medium">Joined</th>
                  <th className="text-left py-3 text-dark-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map(member => (
                  <tr key={member.id} className="border-b border-dark-300/50">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                          {member.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{member.full_name}</p>
                          <p className="text-gray-500 text-sm">ID: {member.user_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium border ${getRoleColor(member.role)}`}>
                        {getRoleIcon(member.role)}
                        <span>{member.role.replace('-', ' ')}</span>
                      </span>
                    </td>
                    <td className="py-4 text-dark-400">{member.company_name || 'N/A'}</td>
                    <td className="py-4 text-dark-400">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      {member.id !== currentUser.id && (
                        <button className="text-dark-500 hover:text-red-400 transition-colors duration-200">
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-200 rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white-800">Invite Team Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-dark-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={inviteForm.email}
                  onChange={handleInputChange}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">
                  Role *
                </label>
                <select
                  name="role"
                  value={inviteForm.role}
                  onChange={handleInputChange}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                >
                  <option value="team-member">Team Member</option>
                  <option value="manager">Manager</option>
                  <option value="client">Client</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  name="message"
                  value={inviteForm.message}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  placeholder="Add a personal message to the invitation..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-dark-500 hover:text-white transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Invitation</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default TeamManagement
