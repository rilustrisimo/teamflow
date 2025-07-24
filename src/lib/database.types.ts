export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          company_id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          client_id: string | null
          status: 'active' | 'completed' | 'on-hold' | 'cancelled'
          budget: number | null
          due_date: string | null
          created_by: string | null
          archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          client_id?: string | null
          status?: 'active' | 'completed' | 'on-hold' | 'cancelled'
          budget?: number | null
          due_date?: string | null
          created_by?: string | null
          archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string | null
          client_id?: string | null
          status?: 'active' | 'completed' | 'on-hold' | 'cancelled'
          budget?: number | null
          due_date?: string | null
          created_by?: string | null
          archived?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          company_id: string
          title: string
          description: string | null
          project_id: string | null
          assigned_to: string | null
          status: 'todo' | 'inprogress' | 'review' | 'done'
          priority: 'low' | 'medium' | 'high'
          due_date: string | null
          deliverable_link: string | null
          video_link: string | null
          created_by: string | null
          archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          description?: string | null
          project_id?: string | null
          assigned_to?: string | null
          status?: 'todo' | 'inprogress' | 'review' | 'done'
          priority?: 'low' | 'medium' | 'high'
          due_date?: string | null
          deliverable_link?: string | null
          video_link?: string | null
          created_by?: string | null
          archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          title?: string
          description?: string | null
          project_id?: string | null
          assigned_to?: string | null
          status?: 'todo' | 'inprogress' | 'review' | 'done'
          priority?: 'low' | 'medium' | 'high'
          due_date?: string | null
          deliverable_link?: string | null
          video_link?: string | null
          created_by?: string | null
          archived?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          company_id: string | null
          company_name: string | null
          role: 'admin' | 'manager' | 'team-member' | 'client'
          hourly_rate: number | null
          avatar_url: string | null
          timezone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          company_id?: string | null
          company_name?: string | null
          role?: 'admin' | 'manager' | 'team-member' | 'client'
          hourly_rate?: number | null
          avatar_url?: string | null
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          company_id?: string | null
          company_name?: string | null
          role?: 'admin' | 'manager' | 'team-member' | 'client'
          hourly_rate?: number | null
          avatar_url?: string | null
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          user_id: string
          project_id: string
          task_id: string | null
          description: string
          start_time: string
          end_time: string
          duration: number
          date: string
          company_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          task_id?: string | null
          description: string
          start_time: string
          end_time: string
          duration: number
          date: string
          company_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          task_id?: string | null
          description?: string
          start_time?: string
          end_time?: string
          duration?: number
          date?: string
          company_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      task_priority: 'low' | 'medium' | 'high'
      task_status: 'todo' | 'inprogress' | 'review' | 'done'
      user_role: 'admin' | 'manager' | 'team-member' | 'client'
      project_status: 'active' | 'completed' | 'on-hold' | 'cancelled'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

// Type aliases for convenience
export type Task = Tables<'tasks'>
export type TaskInsert = TablesInsert<'tasks'>
export type TaskUpdate = TablesUpdate<'tasks'>

export type Project = Tables<'projects'>
export type ProjectInsert = TablesInsert<'projects'>
export type ProjectUpdate = TablesUpdate<'projects'>

export type Client = Tables<'clients'>
export type ClientInsert = TablesInsert<'clients'>
export type ClientUpdate = TablesUpdate<'clients'>

export type Profile = Tables<'profiles'>
export type ProfileInsert = TablesInsert<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>

export type TimeEntry = Tables<'time_entries'>
export type TimeEntryInsert = TablesInsert<'time_entries'>
export type TimeEntryUpdate = TablesUpdate<'time_entries'>
