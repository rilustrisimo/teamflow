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
      profiles: {
        Row: {
          id: string
          full_name: string
          company_name: string | null
          role: 'admin' | 'manager' | 'team-member' | 'client'
          hourly_rate: number | null
          avatar_url: string | null
          timezone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
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
          full_name?: string
          company_name?: string | null
          role?: 'admin' | 'manager' | 'team-member' | 'client'
          hourly_rate?: number | null
          avatar_url?: string | null
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          email: string
          company: string
          phone: string | null
          address: string | null
          status: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          company: string
          phone?: string | null
          address?: string | null
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          company?: string
          phone?: string | null
          address?: string | null
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          client_id: string | null
          status: 'active' | 'completed' | 'on-hold' | 'cancelled'
          budget: number | null
          due_date: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          client_id?: string | null
          status?: 'active' | 'completed' | 'on-hold' | 'cancelled'
          budget?: number | null
          due_date?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          client_id?: string | null
          status?: 'active' | 'completed' | 'on-hold' | 'cancelled'
          budget?: number | null
          due_date?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
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
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
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
          created_at?: string
          updated_at?: string
        }
      }
      task_checklist: {
        Row: {
          id: string
          task_id: string | null
          text: string
          completed: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id?: string | null
          text: string
          completed?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string | null
          text?: string
          completed?: boolean | null
          created_at?: string
        }
      }
      task_comments: {
        Row: {
          id: string
          task_id: string | null
          author_id: string | null
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id?: string | null
          author_id?: string | null
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string | null
          author_id?: string | null
          text?: string
          created_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          user_id: string | null
          project_id: string | null
          task_id: string | null
          description: string
          start_time: string
          end_time: string
          duration: number
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          project_id?: string | null
          task_id?: string | null
          description: string
          start_time: string
          end_time: string
          duration: number
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          project_id?: string | null
          task_id?: string | null
          description?: string
          start_time?: string
          end_time?: string
          duration?: number
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          client_id: string | null
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          amount: number
          balance: number
          due_date: string
          date_range_start: string
          date_range_end: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_number: string
          client_id?: string | null
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          amount?: number
          balance?: number
          due_date: string
          date_range_start: string
          date_range_end: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_number?: string
          client_id?: string | null
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          amount?: number
          balance?: number
          due_date?: string
          date_range_start?: string
          date_range_end?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string | null
          description: string
          hours: number
          rate: number
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id?: string | null
          description: string
          hours: number
          rate: number
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string | null
          description?: string
          hours?: number
          rate?: number
          amount?: number
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string | null
          work_schedule: Json | null
          reminder_enabled: boolean | null
          reminder_interval: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          work_schedule?: Json | null
          reminder_enabled?: boolean | null
          reminder_interval?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          work_schedule?: Json | null
          reminder_enabled?: boolean | null
          reminder_interval?: number | null
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}