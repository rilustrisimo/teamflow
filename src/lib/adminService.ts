import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { supabase } from './supabase'
import { EmailService } from './emailService'

// Create a separate admin client with service role key
// Note: This will show a warning about multiple clients, but it's intentional
// as we need different clients for user auth vs admin operations
const supabaseAdmin = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'X-Client-Info': 'admin-client'
      }
    }
  }
)

export interface AdminUser {
  id: string
  email: string
  full_name: string
  company_id: string | null
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
  company_id?: string
  role: 'admin' | 'manager' | 'team-member' | 'client'
  hourly_rate?: number
}

export interface UpdateUserData {
  full_name?: string
  company_id?: string
  role?: 'admin' | 'manager' | 'team-member' | 'client'
  hourly_rate?: number
}

export class AdminService {
  // Get all users with their auth and profile data (scoped to current admin's company)
  static async getAllUsers(): Promise<AdminUser[]> {
    try {
      // Get current admin from regular supabase client (not service role)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('Admin not authenticated')
      }

      // Get admin's profile to get company_id
      const { data: adminProfile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single()

      if (profileError || !adminProfile?.company_id) {
        throw new Error('Admin profile not found or no company associated')
      }

      // Get all profiles in the admin's company
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('company_id', adminProfile.company_id)
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.error('Profile error:', profilesError)
        throw profilesError
      }

      // Get auth users for the profile IDs
      const profileIds = profiles?.map(p => p.user_id) || []
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (authError) {
        console.error('Auth error:', authError)
        throw authError
      }

      // Filter auth users to only include those with profiles in this company
      const filteredAuthUsers = authUsers?.users.filter(u => profileIds.includes(u.id)) || []

      // Combine auth and profile data
      const users: AdminUser[] = profiles?.map(profile => {
        const authUser = filteredAuthUsers.find(u => u.id === profile.user_id)
        return {
          id: profile.user_id,
          email: authUser?.email || '',
          full_name: profile.full_name,
          company_id: profile.company_id,
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
      // Get current admin from regular supabase client (not service role)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('Admin not authenticated')
      }

      // Get admin's profile to get company_id
      const { data: adminProfile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single()

      if (profileError || !adminProfile?.company_id) {
        throw new Error('Admin profile not found or no company associated')
      }

      // Create auth user with metadata - the trigger will handle profile creation
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: userData.full_name,
          company_id: userData.company_id || adminProfile.company_id,
          role: userData.role,
          hourly_rate: userData.hourly_rate,
          is_admin_signup: false, // This is not an admin signup
          admin_company_id: adminProfile.company_id // Pass the admin's company ID
        }
      })

      if (authError) {
        console.error('Auth creation error:', authError)
        throw authError
      }

      if (!authData.user) {
        throw new Error('Failed to create user')
      }

      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Get the created profile
      const { data: profile, error: profileFetchError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single()

      if (profileFetchError) {
        console.error('Profile fetch error:', profileFetchError)
        throw profileFetchError
      }

      return {
        id: authData.user.id,
        email: authData.user.email || '',
        full_name: profile.full_name,
        company_id: profile.company_id,
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
      // Update profile using user_id, not id
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(userData)
        .eq('user_id', userId)
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
        id: profile.user_id, // Use user_id as the ID, not profile.id
        email: authUser.user?.email || '',
        full_name: profile.full_name,
        company_id: profile.company_id,
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
  static async inviteUser(email: string, userData: Omit<CreateUserData, 'email' | 'password' | 'company_name'>): Promise<void> {
    try {
      // Get current admin from regular supabase client (not service role)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('Admin not authenticated')
      }

      // Get admin's profile to get company_id
      const { data: adminProfile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single()

      if (profileError || !adminProfile?.company_id) {
        throw new Error('Admin profile not found or no company associated')
      }

      // Generate unique invitation token
      const invitationToken = crypto.randomUUID()
      
      // Set expiration date to 7 days from now
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)
      
      // Create invitation record using service role
      const { error: invitationError } = await supabaseAdmin
        .from('user_invitations')
        .insert({
          email,
          company_id: adminProfile.company_id,
          invited_by: user.id,
          role: userData.role,
          full_name: userData.full_name,
          hourly_rate: userData.hourly_rate,
          status: 'pending',
          invitation_token: invitationToken,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single()

      if (invitationError) {
        console.error('Invitation record error:', invitationError)
        throw invitationError
      }

      // Get inviter's profile for email
      const { data: inviterProfile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single()

      // Get company name for email
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('name')
        .eq('id', adminProfile.company_id)
        .single()

      // Send invitation email using custom email service
      try {
        await EmailService.sendInvitationEmail({
          recipientEmail: email,
          recipientName: userData.full_name,
          companyName: company?.name || 'TeamFlow',
          inviterName: inviterProfile?.full_name || 'TeamFlow Admin',
          role: userData.role,
          invitationToken: invitationToken,
          expiresAt: expiresAt.toISOString()
        })
      } catch (emailError) {
        console.error('Email sending error:', emailError)
        // Don't throw here - invitation record is already created
        // Just log the error and continue
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
