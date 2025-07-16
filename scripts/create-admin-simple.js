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
    
    // First, try to create the user with simple metadata
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'admin@example.com',
      password: 'admin123'
    })

    if (signUpError) {
      console.error('Error creating admin user:', signUpError)
      return
    }

    console.log('Admin user created successfully!')
    console.log('User ID:', signUpData.user?.id)
    
    // If user was created, try to manually update the profile
    if (signUpData.user?.id) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signUpData.user.id,
          full_name: 'System Administrator',
          role: 'admin',
          hourly_rate: 100
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        console.log('Profile may have been created automatically via trigger')
      } else {
        console.log('Profile created manually')
      }
    }
    
    console.log('Email: admin@example.com')
    console.log('Password: admin123')
    console.log('Role: admin')
    
  } catch (error) {
    console.error('Exception creating admin user:', error)
  }
}

// Run the script
createAdminUser()
