import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { DatabaseService } from '../lib/database'

const AcceptInvitationPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invitation, setInvitation] = useState<any>(null)
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError('Invalid invitation link')
      setLoading(false)
      return
    }

    fetchInvitation(token)
  }, [searchParams])

  const fetchInvitation = async (token: string) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching invitation for token:', token)
      
      const invitationData = await DatabaseService.getInvitationByToken(token)
      
      if (!invitationData) {
        setError('Invitation not found')
        setLoading(false)
        return
      }

      console.log('Invitation data:', invitationData)

      // Check if invitation is expired
      const now = new Date()
      const expiresAt = new Date(invitationData.expires_at)
      
      if (now > expiresAt) {
        setError('This invitation has expired')
        setLoading(false)
        return
      }

      if (invitationData.status !== 'pending') {
        setError('This invitation has already been used')
        setLoading(false)
        return
      }

      setInvitation(invitationData)
      setLoading(false)
    } catch (err: any) {
      console.error('Error fetching invitation:', err)
      
      // Handle specific Supabase errors
      if (err.code === 'PGRST116') {
        setError('Invitation not found. The link may be invalid or expired.')
      } else {
        setError(`Failed to load invitation: ${err.message}`)
      }
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!invitation) return

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Sign up the user
      console.log('Signing up user with invitation data:', {
        email: invitation.email,
        full_name: invitation.full_name,
        role: invitation.role,
        company_id: invitation.company_id
      })
      
      const { error: authError, data: authData } = await supabase.auth.signUp({
        email: invitation.email,
        password: formData.password,
        options: {
          data: {
            full_name: invitation.full_name,
            role: invitation.role,
            company_id: invitation.company_id
          }
        }
      })

      if (authError) {
        console.error('Auth signup error:', authError)
        throw authError
      }
      
      console.log('User signup successful:', authData.user?.id)

      // Update invitation status
      await DatabaseService.updateInvitation(invitation.id, {
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })

      // Navigate to dashboard
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Error accepting invitation:', err)
      
      // Handle specific error cases
      if (err.message?.includes('Cannot determine company')) {
        setError('There was an issue with your invitation. Please contact your administrator or try again.')
      } else if (err.message?.includes('User already registered')) {
        setError('An account with this email already exists. Please try signing in instead.')
      } else if (err.message?.includes('Database error saving new user')) {
        setError('There was a database error creating your account. Please try again or contact support.')
      } else {
        setError(err.message || 'Failed to accept invitation. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Invitation Not Found</h1>
          <p className="text-gray-400">The invitation link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Accept Invitation</h1>
        <div className="mb-6">
          <p className="text-gray-300 mb-2">
            You've been invited to join <strong>{invitation.companies?.name || 'a company'}</strong> as a{' '}
            <strong>{invitation.role}</strong>.
          </p>
          <p className="text-gray-400 text-sm">
            Email: {invitation.email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Confirm your password"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            {loading ? 'Processing...' : 'Accept Invitation'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AcceptInvitationPage
