import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import AdminSignupPage from './pages/AdminSignupPage'
import OnboardingPage from './pages/OnboardingPage'
import AcceptInvitationPage from './pages/AcceptInvitationPage'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <div className="min-h-screen bg-dark-100">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/admin-signup" element={<AdminSignupPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
            <Route 
              path="/dashboard/*" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </AppProvider>
    </AuthProvider>
  )
}

export default App