import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppContext } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  X,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string
  company_name: string | null
  role: 'admin' | 'manager' | 'team-member' | 'client'
  hourly_rate: number | null
  created_at: string
  updated_at: string
}

const UserManagement = () => {
  const { currentUser } = useAppContext()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    company_name: '',
    role: 'team-member' as const,
    hourly_rate: 0
  })

  // Load users
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Get auth users to include email
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      
      const usersWithEmail = profiles?.map(profile => {
        const authUser = authUsers?.users.find(u => u.id === profile.id)
        return {
          ...profile,
          email: authUser?.email || ''
        }
      }) || []

      setUsers(usersWithEmail)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const createUser = async () => {
    try {
      if (!newUser.email || !newUser.password || !newUser.full_name) {
        alert('Please fill in all required fields')
        return
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        user_metadata: {
          full_name: newUser.full_name,
          company_name: newUser.company_name,
          role: newUser.role
        }
      })

      if (authError) throw authError

      // Update profile with additional data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          hourly_rate: newUser.hourly_rate || 0
        })
        .eq('id', authData.user.id)

      if (profileError) throw profileError

      setNewUser({
        email: '',
        password: '',
        full_name: '',
        company_name: '',
        role: 'team-member',
        hourly_rate: 0
      })
      setShowCreateModal(false)
      loadUsers()
      alert('User created successfully!')
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Error creating user. Please try again.')
    }
  }

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)

      if (error) throw error
      
      loadUsers()
      setEditingUser(null)
      alert('User updated successfully!')
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error updating user. Please try again.')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      // Delete auth user (will cascade to profile via foreign key)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      if (authError) throw authError

      loadUsers()
      alert('User deleted successfully!')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user. Please try again.')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500'
      case 'manager': return 'bg-blue-500/20 text-blue-400 border-blue-500'
      case 'team-member': return 'bg-green-500/20 text-green-400 border-green-500'
      case 'client': return 'bg-purple-500/20 text-purple-400 border-purple-500'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />
      case 'manager': return <Users className="w-4 h-4" />
      case 'team-member': return <Users className="w-4 h-4" />
      case 'client': return <Users className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-dark-500">You don't have permission to access user management.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-dark-500">Manage system users and their permissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-secondary hover:bg-secondary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          <span>Add User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-dark-200 rounded-xl border border-dark-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-300 border-b border-dark-400">
              <tr>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">User</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Email</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Role</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Company</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Hourly Rate</th>
                <th className="text-left py-4 px-6 text-dark-500 font-medium uppercase text-xs tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 px-6 text-center text-dark-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-6 text-center text-dark-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-dark-300/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{user.full_name}</div>
                          <div className="text-sm text-dark-500">
                            Created {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-white">{user.email}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span className="capitalize">{user.role}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-white">{user.company_name || '-'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-white">${user.hourly_rate || 0}/hr</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-200 rounded-xl border border-dark-300 p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Create New User</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-dark-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white placeholder-dark-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white placeholder-dark-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white placeholder-dark-500 pr-12"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                >
                  <option value="team-member">Team Member</option>
                  <option value="manager">Manager</option>
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Company Name</label>
                <input
                  type="text"
                  value={newUser.company_name}
                  onChange={(e) => setNewUser({...newUser, company_name: e.target.value})}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white placeholder-dark-500"
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Hourly Rate ($)</label>
                <input
                  type="number"
                  value={newUser.hourly_rate}
                  onChange={(e) => setNewUser({...newUser, hourly_rate: parseFloat(e.target.value) || 0})}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white placeholder-dark-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={createUser}
                className="flex-1 bg-secondary hover:bg-secondary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                Create User
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-dark-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-200 rounded-xl border border-dark-300 p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Edit User</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-dark-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Full Name</label>
                <input
                  type="text"
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white placeholder-dark-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white"
                >
                  <option value="team-member">Team Member</option>
                  <option value="manager">Manager</option>
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Company Name</label>
                <input
                  type="text"
                  value={editingUser.company_name || ''}
                  onChange={(e) => setEditingUser({...editingUser, company_name: e.target.value})}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white placeholder-dark-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">Hourly Rate ($)</label>
                <input
                  type="number"
                  value={editingUser.hourly_rate || 0}
                  onChange={(e) => setEditingUser({...editingUser, hourly_rate: parseFloat(e.target.value) || 0})}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white placeholder-dark-500"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => updateUser(editingUser.id, editingUser)}
                className="flex-1 bg-secondary hover:bg-secondary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                Update User
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-dark-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
