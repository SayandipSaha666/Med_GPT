import {useContext} from 'react'
import {GlobalContext} from '../context/context'
import {assets} from '../assets/assets'
import { useNavigate } from 'react-router-dom'

const features = [
  {
    icon: assets.diamond_icon,
    title: 'AI-Powered Research',
    description: 'Get intelligent responses powered by advanced language models trained on vast research data.'
  },
  {
    icon: assets.gallery_icon,
    title: 'Image Generation',
    description: 'Transform your ideas into stunning visuals with our AI image generation capabilities.'
  },
  {
    icon: assets.credit_icon,
    title: 'Credit System',
    description: 'Flexible credit-based pricing that scales with your needs. Purchase only what you use.'
  },
  {
    icon: assets.user_icon,
    title: 'Community Showcase',
    description: 'Share your creations with a vibrant community and explore inspired work from others.'
  }
]

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Researcher',
    text: 'Research_GPT has transformed how I conduct literature reviews. The AI understands context and provides relevant insights.',
    avatar: assets.user_icon
  },
  {
    name: 'Marcus Johnson',
    role: 'Content Creator',
    text: 'The image generation feature is incredible. I can visualize concepts quickly and share them with my audience.',
    avatar: assets.user_icon
  },
  {
    name: 'Elena Rodriguez',
    role: 'Student',
    text: 'As a graduate student, having an AI research assistant has been invaluable for my thesis work.',
    avatar: assets.user_icon
  }
]

function HomePage() {
  const {theme, user} = useContext(GlobalContext)
  const navigate = useNavigate()

  return (
    <div className='flex-1 px-4 sm:px-6 lg:px-8 py-12 overflow-y-scroll'>
      {/* Hero Section */}
      <div className='max-w-6xl mx-auto text-center mb-16'>
        <div className='mb-6'>
          <img
            src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark}
            alt='Research_GPT'
            className='w-full max-w-64 mx-auto'
          />
        </div>
        <h1 className='text-3xl sm:text-4xl font-bold mb-4 text-[#2D2535] dark:text-white'>
          Your AI-Powered Research Companion
        </h1>
        <p className='text-base text-gray-600 dark:text-purple-200 mb-8 max-w-2xl mx-auto'>
          Ask questions, generate images, and explore ideas with cutting-edge AI technology.
          Join thousands of researchers, creators, and learners who trust Research_GPT.
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
          Everything You Need for Research
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
            { step: '1', title: 'Ask Your Question', desc: 'Type anything you want to research or explore' },
            { step: '2', title: 'AI Processes', desc: 'Our models analyze and generate insightful responses' },
            { step: '3', title: 'Get Results', desc: 'Receive detailed answers and generated images' }
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
            Join thousands of users who are already exploring ideas with Research_GPT.
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