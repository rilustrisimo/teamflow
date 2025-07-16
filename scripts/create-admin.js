#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createAdminUser() {
  try {
    console.log('Creating admin user...')
    
    // Sign up the admin user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'admin@example.com',
      password: 'admin123',
      options: {
        data: {
          full_name: 'System Administrator',
          role: 'admin'
        }
      }
    })

    if (signUpError) {
      console.error('Error creating admin user:', signUpError)
      return
    }

    console.log('Admin user created successfully!')
    console.log('Email: admin@example.com')
    console.log('Password: admin123')
    console.log('Role: admin')
    
    // Note: The user profile will be created automatically via the database trigger
    
  } catch (error) {
    console.error('Exception creating admin user:', error)
  }
}

// Run the script
createAdminUser()
