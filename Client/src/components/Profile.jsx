import React, { useContext } from 'react'
import { GlobalContext } from '../context/context.jsx'
import { assets } from '../assets/assets.js'
import { useNavigate } from 'react-router-dom'

function Profile() {
  const { user, setUser } = useContext(GlobalContext)
  const navigate = useNavigate()

  if (!user) return null;

  const currentPlan = user.plan || { name: 'Free', features: ['Basic features'] };

  const handleLogout = () => {
    setUser(null)
    navigate('/auth')
  }

  return (
    <div className='flex-1 h-screen overflow-y-auto bg-linear-to-b from-[#F8F6FA] to-[#EDE8F2] dark:from-[#1a1a1a] dark:to-[#0a0a0a] transition-all duration-500'>
      <div className='max-w-4xl mx-auto px-6 py-12 md:py-20'>
        
        {/* Profile Header */}
        <div className='bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-8 mb-8 shadow-2xl shadow-purple-500/10 animate-in fade-in slide-in-from-bottom-4 duration-700'>
          <div className='flex flex-col md:flex-row items-center gap-8'>
            <div className='relative group'>
              <div className='absolute -inset-1 bg-linear-to-r from-purple-600 to-blue-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200'></div>
              <img 
                src={assets.user_icon} 
                alt="Profile" 
                className='relative w-32 h-32 rounded-full border-4 border-white dark:border-white/10 shadow-xl object-cover'
              />
              <div className='absolute bottom-0 right-0 w-8 h-8 bg-green-500 border-4 border-white dark:border-[#242124] rounded-full'></div>
            </div>
            
            <div className='text-center md:text-left flex-1'>
              <h1 className='text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight'>
                {user.name}
              </h1>
              <p className='text-gray-500 dark:text-gray-400 text-lg mb-4'>
                {user.email}
              </p>
              <div className='flex flex-wrap gap-3 justify-center md:justify-start'>
                <span className='px-4 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium border border-purple-200 dark:border-purple-800/50'>
                  {currentPlan.name} Member
                </span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className='mt-4 md:mt-0 px-6 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all font-medium flex items-center gap-2 border border-red-100 dark:border-red-900/30'
            >
              <img src={assets.logout_icon} alt="" className='w-4 h-4 not-dark:invert' />
              Logout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
          <div className='bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-xl hover:translate-y-[-4px] transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100'>
            <div className='flex items-center gap-4 mb-4'>
              <div className='p-3 bg-purple-500/10 rounded-xl'>
                <img src={assets.credit_icon} alt="" className='w-6 h-6 not-dark:invert' />
              </div>
              <h3 className='text-gray-500 dark:text-gray-400 font-medium'>Available Credits</h3>
            </div>
            <p className='text-3xl font-bold text-gray-900 dark:text-white'>{user.credits}</p>
          </div>

          <div className='bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-xl hover:translate-y-[-4px] transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200'>
            <div className='flex items-center gap-4 mb-4'>
              <div className='p-3 bg-blue-500/10 rounded-xl'>
                <img src={assets.diamond_icon} alt="" className='w-6 h-6 not-dark:invert' />
              </div>
              <h3 className='text-gray-500 dark:text-gray-400 font-medium'>Membership</h3>
            </div>
            <p className='text-3xl font-bold text-gray-900 dark:text-white'>{currentPlan.name}</p>
          </div>
        </div>

        {/* Detailed Info Section */}
        <div className='bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400'>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2'>
            <div className='w-2 h-8 bg-purple-600 rounded-full'></div>
            Account Details
          </h2>
          
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div className='space-y-6'>
              <div>
                <label className='block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1'>User ID</label>
                <div className='p-3 bg-gray-100/50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 font-mono text-sm text-gray-700 dark:text-gray-300 break-all'>
                  {user.id}
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1'>Join Date</label>
                <div className='text-gray-900 dark:text-white font-medium'>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                </div>
              </div>
            </div>

            <div className='space-y-6'>
              <div>
                <label className='block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1'>Current Plan Perks</label>
                <ul className='space-y-2'>
                  {currentPlan.features?.length > 0 ? (
                    currentPlan.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className='flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300'>
                        <div className='w-1 h-1 bg-purple-500 rounded-full'></div>
                        {feature}
                      </li>
                    ))
                  ) : (
                    <li className='flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300'>
                      <div className='w-1 h-1 bg-purple-500 rounded-full'></div>
                      Standard Chat Access
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className='mt-10 pt-8 border-t border-gray-200 dark:border-white/10 flex justify-between items-center'>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              Manage your personal information and preferences.
            </p>
            <button className='px-6 py-2 bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all hover:scale-105 active:scale-95'>
              Edit Profile
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Profile