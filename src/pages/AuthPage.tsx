import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Zap, AlertCircle, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const AuthPage = () => {
  const navigate = useNavigate()
  const { signIn, resetPassword } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
    setSuccess('')
  }

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await signIn(formData.email, formData.password)
      if (error) {
        setError(error.message || 'Failed to sign in')
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await resetPassword(formData.email)
      if (error) {
        setError(error.message || 'Failed to send reset email')
      } else {
        setSuccess('Password reset email sent! Check your inbox.')
        setShowForgotPassword(false)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-dark-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setShowForgotPassword(false)}
            className="flex items-center space-x-2 text-dark-500 hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Sign In</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold gradient-text">Reset Password</h2>
            <p className="mt-2 text-dark-500">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 text-sm">{success}</span>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleForgotPassword}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-dark-500 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-500" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field pl-10"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-dark-500 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold gradient-text">Welcome Back</h2>
          <p className="mt-2 text-dark-500">
            Sign in to your account to continue
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 text-sm">{success}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-500 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field pl-10"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-500 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input-field pl-10 pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-500 hover:text-white transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-secondary focus:ring-secondary border-dark-300 rounded bg-dark-200"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-dark-500">
                  Remember me
                </label>
              </div>
              <button 
                type="button" 
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-secondary hover:text-secondary/80 transition-colors duration-200"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-dark-200 text-dark-500">New to our platform?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate('/admin-signup')}
                className="inline-flex items-center space-x-2 text-secondary hover:text-secondary/80 transition-colors duration-200"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create a new company account</span>
              </button>
              <p className="mt-2 text-xs text-dark-500">
                Looking to join an existing company? Check your email for an invitation.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-dark-500"
        >
          <p>By using our platform, you agree to our Terms of Service and Privacy Policy</p>
        </motion.div>
      </div>
    </div>
  )
}

export default AuthPage