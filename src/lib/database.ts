import { supabase } from './supabase'
import type { Database } from './database.types'

// Type definitions for our database tables
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type TimeEntry = Database['public']['Tables']['time_entries']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type TaskChecklist = Database['public']['Tables']['task_checklist']['Row']
export type TaskComment = Database['public']['Tables']['task_comments']['Row']

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TimeEntryInsert = Database['public']['Tables']['time_entries']['Insert']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type ClientUpdate = Database['public']['Tables']['clients']['Update']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']
export type TimeEntryUpdate = Database['public']['Tables']['time_entries']['Update']
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']

// Database service class
export class DatabaseService {
  // Profile operations
  static async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  }

  static async updateProfile(userId: string, updates: ProfileUpdate) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async getAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')
    
    if (error) throw error
    return data
  }

  // Client operations
  static async getClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('company')
    
    if (error) throw error
    return data
  }

  static async createClient(client: ClientInsert) {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateClient(id: string, updates: ClientUpdate) {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
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
  static async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createProject(project: ProjectInsert) {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select(`
        *,
        client:clients(*)
      `)
      .single()
    
    if (error) throw error
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
  static async getTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(*),
        assigned_user:profiles!tasks_assigned_to_fkey(*),
        checklist:task_checklist(*),
        comments:task_comments(*, author:profiles(*))
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createTask(task: TaskInsert) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select(`
        *,
        project:projects(*),
        assigned_user:profiles!tasks_assigned_to_fkey(*),
        checklist:task_checklist(*),
        comments:task_comments(*, author:profiles(*))
      `)
      .single()
    
    if (error) throw error
    return data
  }

  static async updateTask(id: string, updates: TaskUpdate) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        project:projects(*),
        assigned_user:profiles!tasks_assigned_to_fkey(*),
        checklist:task_checklist(*),
        comments:task_comments(*, author:profiles(*))
      `)
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
    const { data, error } = await supabase
      .from('task_checklist')
      .insert({ task_id: taskId, text })
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
    const { data, error } = await supabase
      .from('task_comments')
      .insert({ task_id: taskId, author_id: authorId, text })
      .select('*, author:profiles(*)')
      .single()
    
    if (error) throw error
    return data
  }

  // Time entry operations
  static async getTimeEntries(userId?: string) {
    let query = supabase
      .from('time_entries')
      .select(`
        *,
        project:projects(*),
        task:tasks(*),
        user:profiles(*)
      `)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data
  }

  static async createTimeEntry(timeEntry: TimeEntryInsert) {
    const { data, error } = await supabase
      .from('time_entries')
      .insert(timeEntry)
      .select(`
        *,
        project:projects(*),
        task:tasks(*),
        user:profiles(*)
      `)
      .single()
    
    if (error) throw error
    return data
  }

  static async updateTimeEntry(id: string, updates: TimeEntryUpdate) {
    const { data, error } = await supabase
      .from('time_entries')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        project:projects(*),
        task:tasks(*),
        user:profiles(*)
      `)
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

  // Invoice operations
  static async getInvoices() {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        items:invoice_items(*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createInvoice(invoice: InvoiceInsert, items: Array<{ description: string; hours: number; rate: number; amount: number }>) {
    // Start a transaction
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoice)
      .select()
      .single()
    
    if (invoiceError) throw invoiceError

    // Add invoice items
    const invoiceItems = items.map(item => ({
      invoice_id: invoiceData.id,
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

  static async updateInvoice(id: string, updates: InvoiceUpdate) {
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
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data
  }

  static async updateUserSettings(userId: string, settings: any) {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        ...settings
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Real-time subscriptions
  static subscribeToTable(table: string, callback: (payload: any) => void) {
    return supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table }, 
        callback
      )
      .subscribe()
  }

  static subscribeToUserData(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('user_data_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'time_entries', filter: `user_id=eq.${userId}` }, 
        callback
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks', filter: `assigned_to=eq.${userId}` }, 
        callback
      )
      .subscribe()
  }
}