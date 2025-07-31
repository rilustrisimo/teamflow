import { supabase } from './supabase'
import type { Database } from './database.types'

// Helper function to get current authenticated user ID
async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('User not authenticated')
  }
  return user.id
}

// Type definitions for our database tables
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Company = Database['public']['Tables']['companies']['Row']
// export type UserInvitation = Database['public']['Tables']['user_invitations']['Row'] // Table may not exist yet
export type Client = Database['public']['Tables']['clients']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type TimeEntry = Database['public']['Tables']['time_entries']['Row']
// export type Invoice = Database['public']['Tables']['invoices']['Row'] // Table may not exist yet
// export type TaskChecklist = Database['public']['Tables']['task_checklist']['Row'] // Table may not exist yet
// export type TaskComment = Database['public']['Tables']['task_comments']['Row'] // Table may not exist yet

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
// export type UserInvitationInsert = Database['public']['Tables']['user_invitations']['Insert'] // Table may not exist yet
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TimeEntryInsert = Database['public']['Tables']['time_entries']['Insert']
// export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'] // Table may not exist yet

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']
// export type UserInvitationUpdate = Database['public']['Tables']['user_invitations']['Update'] // Table may not exist yet
export type ClientUpdate = Database['public']['Tables']['clients']['Update']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']
export type TimeEntryUpdate = Database['public']['Tables']['time_entries']['Update']
// export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update'] // Table may not exist yet

// Database service class
export class DatabaseService {
  // Company operations
  static async getCompany(companyId: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()
    
    if (error) throw error
    return data
  }

  static async getCurrentUserCompany() {
    try {
      const userId = await getCurrentUserId()
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, companies(*)')
        .eq('user_id', userId)
        .single()
      
      return profile?.companies || null
    } catch (error) {
      console.warn('Could not get current user company:', error)
      return null
    }
  }

  static async updateCompany(companyId: string, updates: CompanyUpdate) {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // User invitation operations
  static async createInvitation(invitation: any) { // Using any since UserInvitationInsert may not exist
    const { data, error } = await supabase
      .from('user_invitations')
      .insert(invitation)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async getCompanyInvitations(companyId: string) {
    const { data, error } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async deleteInvitation(invitationId: string) {
    const { error } = await supabase
      .from('user_invitations')
      .delete()
      .eq('id', invitationId)
    
    if (error) throw error
  }

  static async getInvitationByToken(token: string) {
    const { data, error } = await supabase
      .from('user_invitations')
      .select('*, companies(*)')
      .eq('invitation_token', token)
      .maybeSingle()
    
    if (error) throw error
    return data
  }

  static async updateInvitation(invitationId: string, updates: any) { // Using any since UserInvitationUpdate may not exist
    const { data, error } = await supabase
      .from('user_invitations')
      .update(updates)
      .eq('id', invitationId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Profile operations
  static async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data
  }

  static async updateProfile(userId: string, updates: ProfileUpdate) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async createProfile(profile: ProfileInsert) {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async getAllProfiles() {
    // Get current user's company_id first
    const userId = await getCurrentUserId()
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', userId)
      .single()
    
    if (!currentProfile?.company_id) {
      throw new Error('User not associated with a company')
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('company_id', currentProfile.company_id)
      .order('full_name')
    
    if (error) throw error
    return data
  }

  // Client operations
  static async getClients() {
    // Get current user's company_id first
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', await getCurrentUserId())
      .single()
    
    if (!currentProfile?.company_id) {
      throw new Error('User not associated with a company')
    }

    const { data, error } = await supabase
      .from('clients')
      .select('id, company_id, name, email, phone, address, created_by, created_at, updated_at')
      .eq('company_id', currentProfile.company_id)
      .order('name')
    
    if (error) throw error
    return data
  }

  static async createClient(client: Omit<ClientInsert, 'company_id'>) {
    // Get current user's company_id
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', await getCurrentUserId())
      .single()
    
    if (!currentProfile?.company_id) {
      throw new Error('User not associated with a company')
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({ ...client, company_id: currentProfile.company_id })
      .select('id, company_id, name, email, phone, address, created_by, created_at, updated_at')
      .single()
    
    if (error) throw error
    return data
  }

  static async updateClient(id: string, updates: ClientUpdate) {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select('id, company_id, name, email, phone, address, created_by, created_at, updated_at')
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteClient(id: string) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Project operations
  static async getProjects(includeArchived = false) {
    // Get current user's company_id first
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', await getCurrentUserId())
      .single()
    
    if (!currentProfile?.company_id) {
      throw new Error('User not associated with a company')
    }

    let query = supabase
      .from('projects')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('company_id', currentProfile.company_id)

    // Filter by archived status unless explicitly including archived projects
    if (!includeArchived) {
      query = query.eq('archived', false)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async getArchivedProjects() {
    // Get current user's company_id first
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', await getCurrentUserId())
      .single()
    
    if (!currentProfile?.company_id) {
      throw new Error('User not associated with a company')
    }

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('company_id', currentProfile.company_id)
      .eq('archived', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async archiveProject(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .update({ archived: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async unarchiveProject(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .update({ archived: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async createProject(project: Omit<ProjectInsert, 'company_id'>) {
    const userId = await getCurrentUserId()
    console.log('Creating project for user:', userId)
    
    // Get current user's profile with company_id
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, company_id, full_name, role')
      .eq('user_id', userId) // profiles.user_id is the same as auth.users.id
      .single()
    
    console.log('Profile lookup result:', { currentProfile, profileError })
    
    if (profileError) {
      console.error('Profile lookup error:', profileError)
      throw new Error(`Profile lookup failed: ${profileError.message}`)
    }
    
    if (!currentProfile) {
      throw new Error('User profile not found. Please complete your profile setup.')
    }
    
    if (!currentProfile.company_id) {
      throw new Error('User not associated with a company')
    }

    // Create project data with proper created_by reference
    const projectData = {
      ...project,
      company_id: currentProfile.company_id,
      created_by: currentProfile.id // This references profiles.id
    }

    console.log('Creating project with data:', projectData)

    // Try to create the project, handling potential schema issues
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select(`
        *,
        client:clients(*)
      `)
      .single()
    
    if (error) {
      console.error('Project creation error:', error)
      
      // Handle specific errors
      if (error.message?.includes('due_date') && error.message?.includes('schema cache')) {
        console.log('Schema cache issue detected, retrying without due_date')
        // Retry without due_date if schema cache issue
        const { due_date, ...projectWithoutDueDate } = projectData
        const { data: retryData, error: retryError } = await supabase
          .from('projects')
          .insert(projectWithoutDueDate)
          .select(`
            *,
            client:clients(*)
          `)
          .single()
        
        if (retryError) {
          console.error('Retry failed:', retryError)
          throw retryError
        }
        console.log('Project created successfully without due_date:', retryData)
        return retryData
      }
      throw error
    }
    
    console.log('Project created successfully:', data)
    return data
  }

  static async updateProject(id: string, updates: ProjectUpdate) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        client:clients(*)
      `)
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteProject(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Task operations
  static async getTasks(includeArchived = false) {
    // Get current user's company_id first
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', await getCurrentUserId())
      .single()
    
    if (!currentProfile?.company_id) {
      throw new Error('User not associated with a company')
    }

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('company_id', currentProfile.company_id)
    
    // Exclude archived tasks by default
    if (!includeArchived) {
      query = query.eq('archived', false)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  // Get only archived tasks
  static async getArchivedTasks() {
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', await getCurrentUserId())
      .single()
    
    if (!currentProfile?.company_id) {
      throw new Error('User not associated with a company')
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('company_id', currentProfile.company_id)
      .eq('archived', true)
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  // Archive a task
  static async archiveTask(id: string) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ archived: true })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Unarchive a task
  static async unarchiveTask(id: string) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ archived: false })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async createTask(task: Omit<TaskInsert, 'company_id'>) {
    // Get current user's company_id
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', await getCurrentUserId())
      .single()
    
    if (!currentProfile?.company_id) {
      throw new Error('User not associated with a company')
    }

    const taskData = { ...task, company_id: currentProfile.company_id }

    // First try with all fields including deliverable_link and video_link
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select('*')
        .single()
      
      if (error) throw error
      return data
    } catch (error: any) {
      // If we get a schema cache error for deliverable_link or video_link, try without them
      if (error?.message?.includes('Could not find the') && 
          (error.message.includes('deliverable_link') || error.message.includes('video_link'))) {
        
        console.warn('Schema cache issue detected, retrying without deliverable fields')
        
        // Create a new object without the problematic fields
        const basicTaskData: any = { ...taskData }
        delete basicTaskData.deliverable_link
        delete basicTaskData.video_link
        
        const { data, error: retryError } = await supabase
          .from('tasks')
          .insert(basicTaskData)
          .select('*')
          .single()
        
        if (retryError) throw retryError
        
        // Log that we had to create without deliverable fields
        console.warn('Task created without deliverable fields due to schema cache issue')
        return data
      }
      
      // Re-throw other errors
      throw error
    }
  }

  static async updateTask(id: string, updates: TaskUpdate) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteTask(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Task checklist operations
  static async addChecklistItem(taskId: string, text: string) {
    // Get current user's company_id
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', await getCurrentUserId())
      .single()
    
    if (!currentProfile?.company_id) {
      throw new Error('User not associated with a company')
    }

    const { data, error } = await supabase
      .from('task_checklist')
      .insert({ task_id: taskId, text, company_id: currentProfile.company_id })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateChecklistItem(id: string, completed: boolean) {
    const { data, error } = await supabase
      .from('task_checklist')
      .update({ completed })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteChecklistItem(id: string) {
    const { error } = await supabase
      .from('task_checklist')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Task comment operations
  static async addTaskComment(taskId: string, authorId: string, text: string) {
    // Get current user's company_id
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', await getCurrentUserId())
      .single()
    
    if (!currentProfile?.company_id) {
      throw new Error('User not associated with a company')
    }

    const { data, error } = await supabase
      .from('task_comments')
      .insert({ task_id: taskId, author_id: authorId, text, company_id: currentProfile.company_id })
      .select('*')
      .single()
    
    if (error) throw error
    return data
  }

  // Time entry operations
  static async getTimeEntries(userId?: string) {
    // Get current user's company_id first
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', await getCurrentUserId())
      .single()
    
    if (!currentProfile?.company_id) {
      throw new Error('User not associated with a company')
    }

    let query = supabase
      .from('time_entries')
      .select('*')
      .eq('company_id', currentProfile.company_id)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data
  }

  // Get time entries with user profile data for revenue calculations
  static async getTimeEntriesWithUserRates(userId?: string) {
    // Get current user's company_id first
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', await getCurrentUserId())
      .single()
    
    if (!currentProfile?.company_id) {
      throw new Error('User not associated with a company')
    }

    let query = supabase
      .from('time_entries')
      .select(`
        *,
        user_profile:profiles!time_entries_user_id_fkey(
          full_name,
          hourly_rate
        )
      `)
      .eq('company_id', currentProfile.company_id)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data
  }

  static async createTimeEntry(timeEntry: Omit<TimeEntryInsert, 'company_id'>) {
    // Get current user's company_id
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', await getCurrentUserId())
      .single()
    
    if (!currentProfile?.company_id) {
      throw new Error('User not associated with a company')
    }

    const { data, error } = await supabase
      .from('time_entries')
      .insert({ ...timeEntry, company_id: currentProfile.company_id })
      .select('*')
      .single()
    
    if (error) throw error
    return data
  }

  static async updateTimeEntry(id: string, updates: TimeEntryUpdate) {
    const { data, error } = await supabase
      .from('time_entries')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteTimeEntry(id: string) {
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Find time entry by start time and user (for duplicate checking)
  static async findTimeEntryByStartTime(startTime: string, userId: string) {
    // Get current user's company_id
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', await getCurrentUserId())
      .single()
    
    if (!currentProfile?.company_id) {
      throw new Error('User not associated with a company')
    }

    // Convert start time to timestamp for comparison
    const startDate = new Date(startTime)
    const toleranceMs = 1000 // 1 second tolerance
    const startWindow = new Date(startDate.getTime() - toleranceMs).toISOString()
    const endWindow = new Date(startDate.getTime() + toleranceMs).toISOString()

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', currentProfile.company_id)
      .gte('start_time', startWindow)
      .lte('start_time', endWindow)
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error
    }
    
    return data
  }

  // Invoice operations
  static async getInvoices() {
    // Get current user's company_id first
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', await getCurrentUserId())
      .single()
    
    if (!currentProfile?.company_id) {
      throw new Error('User not associated with a company')
    }

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        items:invoice_items(*)
      `)
      .eq('company_id', currentProfile.company_id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createInvoice(invoice: any, items: Array<{ description: string; hours: number; rate: number; amount: number }>) { // Using any since InvoiceInsert may not exist
    // Get current user's company_id
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', await getCurrentUserId())
      .single()
    
    if (!currentProfile?.company_id) {
      throw new Error('User not associated with a company')
    }

    // Start a transaction
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert({ ...invoice, company_id: currentProfile.company_id })
      .select()
      .single()
    
    if (invoiceError) throw invoiceError

    // Add invoice items with company_id
    const invoiceItems = items.map(item => ({
      invoice_id: invoiceData.id,
      company_id: currentProfile.company_id,
      ...item
    }))

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems)
    
    if (itemsError) throw itemsError

    // Return complete invoice with items
    return this.getInvoice(invoiceData.id)
  }

  static async getInvoice(id: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        items:invoice_items(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async updateInvoice(id: string, updates: any) { // Using any since InvoiceUpdate may not exist
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        client:clients(*),
        items:invoice_items(*)
      `)
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteInvoice(id: string) {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // User settings operations
  static async getUserSettings(userId: string) {
    // Get current user's company_id
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', await getCurrentUserId())
      .single()
    
    if (!currentProfile?.company_id) {
      throw new Error('User not associated with a company')
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', currentProfile.company_id)
      .single()
    
    if (error) throw error
    return data
  }

  static async updateUserSettings(userId: string, settings: any) {
    // Get current user's company_id
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', await getCurrentUserId())
      .single()
    
    if (!currentProfile?.company_id) {
      throw new Error('User not associated with a company')
    }

    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        company_id: currentProfile.company_id,
        ...settings
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Real-time subscriptions
  static async subscribeToTable(table: string, callback: (payload: any) => void) {
    // Get current user's company_id for filtering
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', await getCurrentUserId())
      .single()
    
    if (!currentProfile?.company_id) {
      throw new Error('User not associated with a company')
    }

    return supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table, filter: `company_id=eq.${currentProfile.company_id}` }, 
        callback
      )
      .subscribe()
  }

  static async subscribeToUserData(userId: string, callback: (payload: any) => void) {
    // Get current user's company_id for filtering
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', await getCurrentUserId())
      .single()
    
    if (!currentProfile?.company_id) {
      throw new Error('User not associated with a company')
    }

    return supabase
      .channel('user_data_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'time_entries', filter: `user_id=eq.${userId}&company_id=eq.${currentProfile.company_id}` }, 
        callback
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks', filter: `assigned_to=eq.${userId}&company_id=eq.${currentProfile.company_id}` }, 
        callback
      )
      .subscribe()
  }
}