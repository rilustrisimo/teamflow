import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { UserPlus, Building2, Shield, Users, ArrowRight } from 'lucide-react'

const AdminSignupPage = () => {
  const { signUp, loading } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: ''
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [step, setStep] = useState(1) // 1: Company Info, 2: Admin Details, 3: Success

  const validateStep1 = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep2()) return

    try {
      const result = await signUp(formData.email, formData.password, {
        fullName: formData.fullName,
        companyName: formData.companyName,
        role: 'admin' // Force admin role for direct signup
      })

      if (result.error) {
        setErrors({ submit: result.error.message || 'Failed to create account' })
      } else {
        setStep(3)
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'An unexpected error occurred' })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
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
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to TeamFlow!</h2>
            <p className="text-dark-500">
              Your company <strong className="text-primary">{formData.companyName}</strong> has been created successfully.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-dark-300 rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">Next Steps:</h3>
              <ul className="text-dark-400 text-sm space-y-1 text-left">
                <li>• Check your email for verification</li>
                <li>• Set up your team by inviting members</li>
                <li>• Create your first project</li>
                <li>• Start tracking time and managing tasks</li>
              </ul>
            </div>
          </div>

          <Link
            to="/auth"
            className="inline-flex items-center justify-center w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
          >
            Continue to Login
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Marketing */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block"
        >
          <h1 className="text-4xl font-bold text-white mb-6">
            Start Your TeamFlow
            <span className="text-primary block">Company Today</span>
          </h1>
          <p className="text-dark-400 text-lg mb-8">
            Create your own isolated workspace where you can manage projects, track time, 
            and collaborate with your team securely.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Building2 className="w-5 h-5 text-primary" />
              <span className="text-dark-300">Your own company workspace</span>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-dark-300">Invite unlimited team members</span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-dark-300">Complete data isolation & security</span>
            </div>
          </div>
        </motion.div>

        {/* Right side - Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-dark-200 rounded-2xl shadow-2xl p-8"
        >
          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-primary text-white' : 'bg-dark-400 text-dark-500'
              }`}>
                1
              </div>
              <div className={`w-8 h-1 rounded ${step >= 2 ? 'bg-primary' : 'bg-dark-400'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-primary text-white' : 'bg-dark-400 text-dark-500'
              }`}>
                2
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-2">
            {step === 1 ? 'Create Your Company' : 'Set Up Your Admin Account'}
          </h2>
          <p className="text-dark-500 text-center mb-6">
            {step === 1 
              ? 'Start by telling us about your company' 
              : 'Create your admin account to manage your team'
            }
          </p>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNextStep(); } : handleSubmit} className="space-y-6">
            {step === 1 ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your company name"
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-400">{errors.companyName}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-400">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Create a password"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                  )}
                </div>

                {errors.submit && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{errors.submit}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-dark-400 hover:bg-dark-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Company
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-dark-500 text-sm">
              Already have an account?{' '}
              <Link to="/auth" className="text-primary hover:text-primary/80 transition-colors duration-200">
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminSignupPage
