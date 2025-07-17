import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Create a separate admin client with service role key
const supabaseAdmin = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export interface AdminUser {
  id: string
  email: string
  full_name: string
  company_name: string | null
  role: 'admin' | 'manager' | 'team-member' | 'client'
  hourly_rate: number | null
  created_at: string
  updated_at: string
  email_confirmed_at: string | null
  last_sign_in_at: string | null
}

export interface CreateUserData {
  email: string
  password: string
  full_name: string
  company_name?: string
  role: 'admin' | 'manager' | 'team-member' | 'client'
  hourly_rate?: number
}

export interface UpdateUserData {
  full_name?: string
  company_name?: string
  role?: 'admin' | 'manager' | 'team-member' | 'client'
  hourly_rate?: number
}

export class AdminService {
  // Get all users with their auth and profile data
  static async getAllUsers(): Promise<AdminUser[]> {
    try {
      // Get all auth users
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (authError) {
        console.error('Auth error:', authError)
        throw authError
      }

      // Get all profiles
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profileError) {
        console.error('Profile error:', profileError)
        throw profileError
      }

      // Combine auth and profile data
      const users: AdminUser[] = profiles?.map(profile => {
        const authUser = authUsers?.users.find(u => u.id === profile.id)
        return {
          id: profile.id,
          email: authUser?.email || '',
          full_name: profile.full_name,
          company_name: profile.company_name,
          role: profile.role,
          hourly_rate: profile.hourly_rate,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          email_confirmed_at: authUser?.email_confirmed_at || null,
          last_sign_in_at: authUser?.last_sign_in_at || null
        }
      }) || []

      return users
    } catch (error) {
      console.error('Error getting all users:', error)
      throw error
    }
  }

  // Create a new user
  static async createUser(userData: CreateUserData): Promise<AdminUser> {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: userData.full_name,
          company_name: userData.company_name,
          role: userData.role
        }
      })

      if (authError) {
        console.error('Auth creation error:', authError)
        throw authError
      }

      if (!authData.user) {
        throw new Error('Failed to create user')
      }

      // Update profile with additional data
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: userData.full_name,
          company_name: userData.company_name,
          role: userData.role,
          hourly_rate: userData.hourly_rate
        })
        .eq('id', authData.user.id)
        .select()
        .single()

      if (profileError) {
        console.error('Profile update error:', profileError)
        throw profileError
      }

      return {
        id: authData.user.id,
        email: authData.user.email || '',
        full_name: profile.full_name,
        company_name: profile.company_name,
        role: profile.role,
        hourly_rate: profile.hourly_rate,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        email_confirmed_at: authData.user.email_confirmed_at || null,
        last_sign_in_at: authData.user.last_sign_in_at || null
      }
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  // Update user profile
  static async updateUser(userId: string, userData: UpdateUserData): Promise<AdminUser> {
    try {
      // Update profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(userData)
        .eq('id', userId)
        .select()
        .single()

      if (profileError) {
        console.error('Profile update error:', profileError)
        throw profileError
      }

      // Get auth user data
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

      if (authError) {
        console.error('Auth user error:', authError)
        throw authError
      }

      return {
        id: profile.id,
        email: authUser.user?.email || '',
        full_name: profile.full_name,
        company_name: profile.company_name,
        role: profile.role,
        hourly_rate: profile.hourly_rate,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        email_confirmed_at: authUser.user?.email_confirmed_at || null,
        last_sign_in_at: authUser.user?.last_sign_in_at || null
      }
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  // Delete user
  static async deleteUser(userId: string): Promise<void> {
    try {
      // Delete auth user (this will cascade to profile due to foreign key)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

      if (error) {
        console.error('Delete user error:', error)
        throw error
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  // Invite user (send invitation email)
  static async inviteUser(email: string, userData: Omit<CreateUserData, 'email' | 'password'>): Promise<void> {
    try {
      const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: userData.full_name,
          company_name: userData.company_name,
          role: userData.role,
          hourly_rate: userData.hourly_rate
        }
      })

      if (error) {
        console.error('Invite user error:', error)
        throw error
      }
    } catch (error) {
      console.error('Error inviting user:', error)
      throw error
    }
  }

  // Reset user password
  static async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
      })

      if (error) {
        console.error('Reset password error:', error)
        throw error
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      throw error
    }
  }

  // Toggle user status (enable/disable)
  static async toggleUserStatus(userId: string, enabled: boolean): Promise<void> {
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { enabled }
      })

      if (error) {
        console.error('Toggle user status error:', error)
        throw error
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      throw error
    }
  }
}
