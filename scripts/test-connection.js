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

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    console.log('URL:', supabaseUrl)
    console.log('Key:', supabaseAnonKey?.substring(0, 20) + '...')
    
    // Test database connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Database error:', error)
    } else {
      console.log('Database connection successful!')
      console.log('Query result:', data)
    }
    
    // Test auth connection
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('Auth error:', authError)
    } else {
      console.log('Auth connection successful!')
      console.log('Current session:', authData.session ? 'Authenticated' : 'Not authenticated')
    }
    
  } catch (error) {
    console.error('Connection test failed:', error)
  }
}

testConnection()
