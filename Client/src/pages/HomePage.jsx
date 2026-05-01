import { useContext } from 'react'
import { GlobalContext } from '../context/context'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'

const features = [
  {
    icon: assets.diamond_icon,
    title: 'Symptom Analysis',
    description: 'Describe your symptoms and receive instant AI-driven insights regarding potential conditions.'
  },
  {
    icon: assets.search_icon,
    title: 'Treatment Basics',
    description: 'Learn about standard treatment protocols, home remedies, and when to seek professional medical help.'
  },
  {
    icon: assets.credit_icon,
    title: 'Secure & Private',
    description: 'Your health data and queries are processed securely with privacy as our top priority.'
  },
  {
    icon: assets.user_icon,
    title: '24/7 Availability',
    description: 'Access medical knowledge and guidance at any time, from anywhere, whenever you need it.'
  }
]

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Patient',
    text: 'MedGPT helped me understand my symptoms before visiting the doctor. The insights were accurate and incredibly reassuring.',
    avatar: assets.user_icon
  },
  {
    name: 'Marcus Johnson',
    role: 'Healthcare Professional',
    text: 'A fantastic tool for patients to get preliminary information. It bridges the gap between waiting room and consultation.',
    avatar: assets.user_icon
  },
  {
    name: 'Elena Rodriguez',
    role: 'Student',
    text: 'The ability to quickly look up treatment basics and understand medical jargon has been a lifesaver for my health awareness.',
    avatar: assets.user_icon
  }
]

function HomePage() {
  const { theme, user } = useContext(GlobalContext)
  const navigate = useNavigate()

  return (
    <div className='flex-1 px-4 sm:px-6 lg:px-8 py-12 overflow-y-scroll'>
      {/* Hero Section */}
      <div className='max-w-6xl mx-auto text-center mb-16'>
        <div className='mb-8 flex items-center justify-center gap-4'>
          <img
            src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark}
            alt='MedGPT Logo'
            className='h-20 sm:h-24 md:h-28 w-auto object-contain drop-shadow-lg transition-transform hover:scale-105 duration-300'
          />
          <span className='text-5xl sm:text-6xl md:text-7xl font-extrabold text-black dark:text-white tracking-tight drop-shadow-sm'>MedGPT</span>
        </div>
        <h1 className='text-3xl sm:text-4xl font-bold mb-4 text-[#2D2535] dark:text-white'>
          Your AI-Powered Medical Companion
        </h1>
        <p className='text-base text-gray-600 dark:text-purple-200 mb-8 max-w-2xl mx-auto'>
          Ask any medical related queries
Your AI-powered medical assistant. Get instant, reliable answers to your health questions — from symptoms and medications to wellness tips — all in a secure, private conversation.
        </p>
        <div className='flex flex-wrap justify-center gap-4'>
          {!user && (
            <button
              onClick={() => navigate('/auth')}
              className='px-6 py-2.5 rounded-md bg-linear-to-r from-[#A456F7] to-[#3D81F6] text-white font-medium text-sm hover:opacity-90 transition-opacity'
            >
              Get Started Free
            </button>
          )}
          <button
            onClick={() => navigate('/main/credits')}
            className='px-6 py-2.5 rounded-md border border-[#D4C5E2] dark:border-[#80609F]/50 bg-white/80 dark:bg-[#242124]/80 text-[#2D2535] dark:text-white font-medium text-sm hover:bg-white/90 dark:hover:bg-[#242124] transition-colors'
          >
            View Plans
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className='max-w-6xl mx-auto mb-16'>
        <h2 className='text-2xl font-semibold text-center mb-8 text-gray-800 dark:text-purple-100'>
          Everything You Need for Health Guidance
        </h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {features.map((feature, index) => (
            <div
              key={index}
              className='p-6 rounded-lg border border-[#D4C5E2] dark:border-[#80609F]/30 bg-white/60 dark:bg-[#242124]/60 backdrop-blur-sm hover:shadow-lg transition-shadow'
            >
              <div className='w-12 h-12 mb-4 rounded-lg bg-linear-to-r from-[#A456F7]/10 to-[#3D81F6]/10 flex items-center justify-center'>
                <img src={feature.icon} className='w-6 h-6 not-dark:invert' alt={feature.title} />
              </div>
              <h3 className='text-lg font-semibold mb-2 text-[#2D2535] dark:text-white'>
                {feature.title}
              </h3>
              <p className='text-sm text-gray-600 dark:text-purple-200'>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className='max-w-6xl mx-auto mb-16'>
        <h2 className='text-2xl font-semibold text-center mb-8 text-gray-800 dark:text-purple-100'>
          How It Works
        </h2>
        <div className='flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8'>
          {[
            { step: '1', title: 'Describe Symptoms', desc: 'Type in your symptoms, health queries, or medical conditions' },
            { step: '2', title: 'AI Analyzes', desc: 'Our advanced models process your query against medical literature' },
            { step: '3', title: 'Get Insights', desc: 'Receive structured, easy-to-understand health guidance' }
          ].map((item, index) => (
            <div key={index} className='flex flex-col items-center text-center max-w-48'>
              <div className='w-12 h-12 rounded-full bg-linear-to-r from-[#A456F7] to-[#3D81F6] text-white font-bold flex items-center justify-center mb-3'>
                {item.step}
              </div>
              <h4 className='font-semibold text-[#2D2535] dark:text-white mb-1'>{item.title}</h4>
              <p className='text-sm text-gray-600 dark:text-purple-200'>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className='max-w-6xl mx-auto mb-16'>
        <h2 className='text-2xl font-semibold text-center mb-8 text-gray-800 dark:text-purple-100'>
          What Our Users Say
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className='p-6 rounded-lg border border-[#D4C5E2] dark:border-[#80609F]/30 bg-white/60 dark:bg-[#242124]/60 backdrop-blur-sm'
            >
              <div className='flex items-center gap-3 mb-4'>
                <img src={testimonial.avatar} className='w-10 h-10 rounded-full' alt={testimonial.name} />
                <div>
                  <p className='font-semibold text-[#2D2535] dark:text-white'>{testimonial.name}</p>
                  <p className='text-xs text-gray-500 dark:text-purple-300'>{testimonial.role}</p>
                </div>
              </div>
              <p className='text-sm text-gray-600 dark:text-purple-200 italic'>"{testimonial.text}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className='max-w-4xl mx-auto mb-8'>
        <div className='rounded-2xl bg-linear-to-r from-[#A456F7]/10 to-[#3D81F6]/10 border border-[#D4C5E2] dark:border-[#80609F]/30 p-8 text-center backdrop-blur-sm'>
          <h2 className='text-2xl font-bold mb-3 text-[#2D2535] dark:text-white'>
            Ready to Start Your Research Journey?
          </h2>
          <p className='text-gray-600 dark:text-purple-200 mb-6'>
            Join thousands of users who are already exploring ideas with MedGPT.
          </p>
          {!user ? (
            <button
              onClick={() => navigate('/auth')}
              className='px-8 py-3 rounded-md bg-linear-to-r from-[#A456F7] to-[#3D81F6] text-white font-semibold text-sm hover:opacity-90 transition-opacity'
            >
              Create Free Account
            </button>
          ) : (
            <button
              onClick={() => navigate('/main/chat')}
              className='px-8 py-3 rounded-md bg-linear-to-r from-[#A456F7] to-[#3D81F6] text-white font-semibold text-sm hover:opacity-90 transition-opacity'
            >
              Start Chatting
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default HomePage