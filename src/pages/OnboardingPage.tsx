import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Shield, Building2, Users, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

const OnboardingPage = () => {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(1) // 1: Welcome, 2: Set Password, 3: Complete
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [invitationData, setInvitationData] = useState<any>(null)

  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    // Get invitation data from URL params or metadata
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    const fullName = searchParams.get('full_name')
    const role = searchParams.get('role')
    const companyName = searchParams.get('company_name')

    if (email) {
      setInvitationData({
        token,
        email,
        full_name: fullName,
        role,
        company_name: companyName
      })
    }
  }, [searchParams])

  const validatePassword = () => {
    const errors: string[] = []
    
    if (!passwordData.password) {
      errors.push('Password is required')
    } else if (passwordData.password.length < 6) {
      errors.push('Password must be at least 6 characters')
    }
    
    if (passwordData.password !== passwordData.confirmPassword) {
      errors.push('Passwords do not match')
    }
    
    if (errors.length > 0) {
      setError(errors.join(', '))
      return false
    }
    
    return true
  }

  const handleSetPassword = async () => {
    if (!validatePassword()) return

    try {
      setLoading(true)
      setError('')
      
      // Use the invitation token to complete the signup
      const { error: signUpError } = await signIn(invitationData.email, passwordData.password)
      
      if (signUpError) {
        setError(signUpError.message || 'Failed to set password')
        return
      }

      setStep(3)
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    navigate('/dashboard')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  if (!invitationData) {
    return (
      <div className="min-h-screen bg-dark-100 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h2>
          <p className="text-dark-500 mb-6">
            This invitation link is invalid or has expired.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-dark-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-200 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center"
        >
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to TeamFlow!</h2>
            <p className="text-dark-500">
              Your account has been set up successfully. You're now part of{' '}
              <strong className="text-primary">{invitationData.company_name}</strong>.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-dark-300 rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">Your Role:</h3>
              <p className="text-primary font-semibold capitalize">{invitationData.role}</p>
            </div>
            
            <div className="bg-dark-300 rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">Next Steps:</h3>
              <ul className="text-dark-400 text-sm space-y-1 text-left">
                <li>• Explore your dashboard</li>
                <li>• Set up your profile</li>
                <li>• Start collaborating with your team</li>
                <li>• Track your time and manage tasks</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
          >
            Continue to Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Welcome */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block"
        >
          <h1 className="text-4xl font-bold text-white mb-6">
            Welcome to
            <span className="text-primary block">{invitationData.company_name}</span>
          </h1>
          <p className="text-dark-400 text-lg mb-8">
            You've been invited to join the team! Set up your account to get started
            with project management, time tracking, and collaboration.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Building2 className="w-5 h-5 text-primary" />
              <span className="text-dark-300">Join your company workspace</span>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-dark-300">Collaborate with your team</span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-dark-300">Secure and private</span>
            </div>
          </div>
        </motion.div>

        {/* Right side - Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-dark-200 rounded-2xl shadow-2xl p-8"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {step === 1 ? 'You\'re Invited!' : 'Set Your Password'}
            </h2>
            <p className="text-dark-500">
              {step === 1 
                ? `Complete your account setup for ${invitationData.company_name}` 
                : 'Create a secure password for your account'
              }
            </p>
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <div className="bg-dark-300 rounded-lg p-4">
                <div className="text-sm text-dark-400 mb-2">Email:</div>
                <div className="text-white font-medium">{invitationData.email}</div>
              </div>
              
              <div className="bg-dark-300 rounded-lg p-4">
                <div className="text-sm text-dark-400 mb-2">Full Name:</div>
                <div className="text-white font-medium">{invitationData.full_name}</div>
              </div>
              
              <div className="bg-dark-300 rounded-lg p-4">
                <div className="text-sm text-dark-400 mb-2">Role:</div>
                <div className="text-white font-medium capitalize">{invitationData.role}</div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Set Up Account
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={passwordData.password}
                    onChange={handleChange}
                    className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-3 pr-12 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Create a secure password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handleChange}
                    className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-3 pr-12 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-dark-400 hover:bg-dark-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                >
                  Back
                </button>
                <button
                  onClick={handleSetPassword}
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Complete Setup'
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default OnboardingPage
