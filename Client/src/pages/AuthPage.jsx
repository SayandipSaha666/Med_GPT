import React,{useState} from 'react'
import {assets} from '../assets/assets.js'
import SignIn from '../components/auth/SignIn'
import SignUp from '../components/auth/SignUp'

function AuthPage() {
    const [isRegistered,setIsRegistered] = useState(false)
  return (
    <div className='flex-1 px-4 sm:px-6 lg:px-8 py-12 overflow-y-scroll'>
      {/* Background decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-400/10 blur-3xl" />
      </div>

      <div className='relative z-10 w-full max-w-md mx-auto animate-fade-in-up'>
        {/* Auth Card */}
        <div className="rounded-2xl border border-[#D4C5E2] dark:border-[#80609F]/50 bg-white/80 dark:bg-[#242124]/80 p-8 shadow-xl shadow-slate-900/[0.06] backdrop-blur-xl">
          {/* Logo */}
          <div className="flex justify-center mb-2">
            <img
            src={assets.logo_full}
            alt='MedGPT Logo'
            className='h-20 sm:h-24 md:h-28 w-auto object-contain drop-shadow-lg transition-transform hover:scale-105 duration-300'
          />
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-[#2D2535] dark:text-white">
              {isRegistered ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-purple-200">
              {isRegistered
                ? 'Sign in to continue'
                : 'Get started with MedGPT for free'}
            </p>
          </div>

          {/* Form */}
          <div>
            {isRegistered ? <SignIn/> : <SignUp/>}
          </div>

          {/* Switch */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-purple-200">
              {isRegistered ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                onClick={() => setIsRegistered(!isRegistered)}
                className="font-semibold text-[#A456F7] hover:text-[#8B44D9] transition-colors cursor-pointer"
              >
                {isRegistered ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage