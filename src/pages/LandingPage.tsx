import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  Clock, 
  Users, 
  BarChart3, 
  FileText, 
  Zap,
  CheckCircle,
  ArrowRight,
  Play
} from 'lucide-react'

const LandingPage = () => {
  const navigate = useNavigate()

  const features = [
    {
      icon: <Clock className="w-12 h-12" />,
      title: "Smart Time Tracking",
      description: "Automatic tracking with intelligent reminders. Never miss billable hours again with our advanced tracking system."
    },
    {
      icon: <FileText className="w-12 h-12" />,
      title: "Project Management",
      description: "Complete project boards with task assignment, deadlines, deliverables, and team collaboration tools."
    },
    {
      icon: <BarChart3 className="w-12 h-12" />,
      title: "Automated Invoicing",
      description: "Generate professional invoices automatically from tracked hours. Edit and customize before sending to clients."
    },
    {
      icon: <Users className="w-12 h-12" />,
      title: "Team Collaboration",
      description: "Built-in communication tools with video instructions, notes, and real-time updates for seamless teamwork."
    }
  ]

  return (
    <div className="min-h-screen bg-dark-100 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-dark-100/95 backdrop-blur-sm border-b border-dark-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center py-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">TeamFlow</span>
            </motion.div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-dark-500 hover:text-white transition-colors duration-200">Features</a>
              <a href="#pricing" className="text-dark-500 hover:text-white transition-colors duration-200">Pricing</a>
              <a href="#about" className="text-dark-500 hover:text-white transition-colors duration-200">About</a>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <button 
                onClick={() => navigate('/auth')}
                className="text-dark-500 hover:text-white transition-colors duration-200"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/auth')}
                className="bg-secondary hover:bg-secondary/90 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200"
              >
                Start Free Trial
              </button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="inline-flex items-center space-x-2 bg-dark-200 px-4 py-2 rounded-full text-sm text-secondary mb-8">
              <CheckCircle className="w-4 h-4" />
              <span>New in Beta • Join 1000+ Teams</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6">
              Streamline Your Team's
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">
                Productivity
              </span>
            </h1>
            <p className="text-xl text-dark-500 mb-8 max-w-3xl mx-auto leading-relaxed">
              The all-in-one solution for time tracking, project management, and automated invoicing. 
              Built for modern teams who demand efficiency and transparency.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <button 
              onClick={() => navigate('/auth')}
              className="bg-secondary hover:bg-secondary/90 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg text-lg flex items-center justify-center space-x-2"
            >
              <span>Start Your Free Trial</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 text-lg flex items-center justify-center space-x-2">
              <Play className="w-5 h-5" />
              <span>Watch Demo</span>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-dark-500"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-secondary" />
              <span>14-Day Free Trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-secondary" />
              <span>No Setup Fees</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-secondary" />
              <span>Cancel Anytime</span>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xs text-dark-500 mt-4"
          >
            Discover what makes us different. →
          </motion.p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-dark-200/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-dark-200 px-4 py-2 rounded-full text-sm text-secondary mb-6">
              Core Features
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Everything Your Team
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">
                Needs to Succeed
              </span>
            </h2>
            <p className="text-xl text-dark-500 max-w-3xl mx-auto">
              Powerful features designed to eliminate inefficiencies and boost your team's productivity
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-dark-200 rounded-2xl p-8 text-center hover:bg-dark-300 transition-all duration-300 border border-dark-300 hover:border-secondary/30"
              >
                <div className="text-secondary mb-6 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">{feature.title}</h3>
                <p className="text-dark-500 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-dark-200 to-dark-300 rounded-3xl p-12 text-center border border-dark-300 relative overflow-hidden"
          >
            <div className="absolute top-4 right-4">
              <div className="flex items-center space-x-2 bg-secondary/20 px-3 py-1 rounded-full text-xs text-secondary">
                <CheckCircle className="w-3 h-3" />
                <span>Limited Time Offer</span>
              </div>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
              Ready to Transform Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">
                Team's Workflow?
              </span>
            </h2>
            <p className="text-xl text-dark-500 mb-8 max-w-2xl mx-auto">
              Join thousands of teams who have revolutionized their productivity with TeamFlow. Start 
              your free trial today - no credit card required.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button 
                onClick={() => navigate('/auth')}
                className="bg-secondary hover:bg-secondary/90 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg text-lg"
              >
                Start Free Trial Now →
              </button>
              <button className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 text-lg">
                Schedule a Demo
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-dark-500">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-secondary" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-secondary" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-secondary" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-secondary" />
                <span>24/7 support</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-dark-200 border-t border-dark-300">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">TeamFlow</span>
              </div>
              <p className="text-dark-500 text-sm leading-relaxed">
                The ultimate productivity platform for modern teams. Track time, manage projects, and automate invoicing all in one place.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-dark-500">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-dark-500">
                <li><a href="#" className="hover:text-white transition-colors duration-200">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Terms</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-dark-500">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Contact Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-dark-300 text-center text-dark-500 text-sm">
            <p>&copy; 2024 TeamFlow. All rights reserved. | Built with ❤️ for modern teams</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage