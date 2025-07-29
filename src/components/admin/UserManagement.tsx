import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppContext } from '../../context/AppContext'
import { AdminService, type AdminUser, type CreateUserData, type UpdateUserData } from '../../lib/adminService'
import { 
  Plus, 
  Edit, 
  Trash2, 
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Key,
  CheckCircle,
  Search,
  Filter
} from 'lucide-react'

const UserManagement = () => {
  const { currentUser } = useAppContext()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [newUser, setNewUser] = useState<CreateUserData>({
    email: '',
    password: '',
    full_name: '',
    company_id: '',
    role: 'team-member',
    hourly_rate: 0
  })

  const [inviteData, setInviteData] = useState({
    email: '',
    full_name: '',
    role: 'team-member' as const,
    hourly_rate: 0
  })

  const [editData, setEditData] = useState<UpdateUserData>({
    full_name: '',
    company_id: '',
    role: 'team-member',
    hourly_rate: 0
  })

  // Load users
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const usersData = await AdminService.getAllUsers()
      setUsers(usersData)
    } catch (error: any) {
      console.error('Error loading users:', error)
      setError(error.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const createUser = async () => {
    try {
      if (!newUser.email || !newUser.password || !newUser.full_name) {
        setError('Please fill in all required fields')
        return
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newUser.email)) {
        setError('Please enter a valid email address')
        return
      }

      // Password validation
      if (newUser.password.length < 6) {
        setError('Password must be at least 6 characters long')
        return
      }

      setLoading(true)
      setError('')
      await AdminService.createUser(newUser)
      setSuccess('User created successfully')
      setShowCreateModal(false)
      resetNewUser()
      await loadUsers()
    } catch (error: any) {
      console.error('Error creating user:', error)
      setError(error.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  const inviteUser = async () => {
    try {
      if (!inviteData.email || !inviteData.full_name) {
        setError('Please fill in email and full name')
        return
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(inviteData.email)) {
        setError('Please enter a valid email address')
        return
      }

      setLoading(true)
      setError('')
      await AdminService.inviteUser(inviteData.email, {
        full_name: inviteData.full_name,
        role: inviteData.role,
        hourly_rate: inviteData.hourly_rate
      })
      setSuccess('User invitation sent successfully')
      setShowInviteModal(false)
      resetInviteData()
    } catch (error: any) {
      console.error('Error inviting user:', error)
      setError(error.message || 'Failed to invite user')
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async () => {
    try {
      if (!editingUser || !editData.full_name) {
        setError('Please fill in required fields')
        return
      }

      setLoading(true)
      setError('')
      await AdminService.updateUser(editingUser.id, editData)
      setSuccess('User updated successfully')
      setEditingUser(null)
      await loadUsers()
    } catch (error: any) {
      console.error('Error updating user:', error)
      setError(error.message || 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return
      }

      setLoading(true)
      setError('')
      await AdminService.deleteUser(userId)
      setSuccess('User deleted successfully')
      await loadUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      setError(error.message || 'Failed to delete user')
    } finally {
      setLoading(false)
    }
  }

  const resetUserPassword = async (userId: string) => {
    try {
      const newPassword = prompt('Enter new password (minimum 6 characters):')
      if (!newPassword || newPassword.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }

      setLoading(true)
      setError('')
      await AdminService.resetUserPassword(userId, newPassword)
      setSuccess('Password reset successfully')
    } catch (error: any) {
      console.error('Error resetting password:', error)
      setError(error.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const resetNewUser = () => {
    setNewUser({
      email: '',
      password: '',
      full_name: '',
      company_id: '',
      role: 'team-member',
      hourly_rate: 0
    })
  }

  const resetInviteData = () => {
    setInviteData({
      email: '',
      full_name: '',
      role: 'team-member',
      hourly_rate: 0
    })
  }

  const startEditUser = (user: AdminUser) => {
    setEditingUser(user)
    setEditData({
      full_name: user.full_name,
      company_id: user.company_id || '',
      role: user.role,
      hourly_rate: user.hourly_rate || 0
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'manager':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'team-member':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'client':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.company_name && user.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">Access denied. Admin privileges required.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
          <p className="text-gray-400">Manage user accounts and permissions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>Invite User</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button onClick={clearMessages} className="text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
          <button onClick={clearMessages} className="text-green-400 hover:text-green-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-100 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="team-member">Team Member</option>
            </select>
          </div>
        </div>
        <div className="text-sm text-gray-400">
          {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700">
                  <th className="text-left p-4 text-gray-200">User</th>
                  <th className="text-left p-4 text-gray-200">Role</th>
                  <th className="text-left p-4 text-gray-200">Company</th>
                  <th className="text-left p-4 text-gray-200">Rate</th>
                  <th className="text-left p-4 text-gray-200">Status</th>
                  <th className="text-left p-4 text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user.id} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-white">{user.full_name}</div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs border ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">
                      {user.company_name || '-'}
                    </td>
                    <td className="p-4 text-gray-300">
                      {user.hourly_rate ? `$${user.hourly_rate}/hr` : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.email_confirmed_at ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {user.email_confirmed_at ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startEditUser(user)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => resetUserPassword(user.id)}
                          className="text-yellow-400 hover:text-yellow-300"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="text-red-400 hover:text-red-300"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white-800">Create New User</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email *
                </label>
                  <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 pr-10 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Company (auto-assigned)
                </label>
                <input
                  type="text"
                  value="Same as admin's company"
                  disabled={true}
                  className="w-full bg-gray-600 border border-gray-600 rounded-lg px-3 py-2 text-gray-400 cursor-not-allowed"
                  placeholder="Company will be auto-assigned"
                />
                <p className="text-xs text-gray-500 mt-1">
                  New users will be automatically assigned to your company.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Role *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="team-member">Team Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  value={newUser.hourly_rate}
                  onChange={(e) => setNewUser({ ...newUser, hourly_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={createUser}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white-800">Invite User</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={inviteData.full_name}
                  onChange={(e) => setInviteData({ ...inviteData, full_name: e.target.value })}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Role *
                </label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as any })}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="team-member">Team Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  value={inviteData.hourly_rate}
                  onChange={(e) => setInviteData({ ...inviteData, hourly_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={inviteUser}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white-800">Edit User</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email (readonly)
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="w-full bg-gray-600 border border-gray-600 rounded-lg px-3 py-2 text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Company (read-only)
                </label>
                <input
                  type="text"
                  value={editingUser.company_name || 'No company assigned'}
                  disabled={true}
                  className="w-full bg-gray-600 border border-gray-600 rounded-lg px-3 py-2 text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Company assignments cannot be changed through this interface.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Role *
                </label>
                <select
                  value={editData.role}
                  onChange={(e) => setEditData({ ...editData, role: e.target.value as any })}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="team-member">Team Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  value={editData.hourly_rate || 0}
                  onChange={(e) => setEditData({ ...editData, hourly_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={updateUser}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
