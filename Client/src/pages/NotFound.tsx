import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#FAF9FC] to-[#EDE8F2] dark:from-[#0E0D16] dark:to-[#171424] text-gray-900 dark:text-white px-4 relative overflow-hidden transition-colors duration-300">
      {/* Background glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-lg w-full text-center p-8 sm:p-10 rounded-3xl bg-white/70 dark:bg-[#191629]/70 border border-purple-100 dark:border-purple-900/40 shadow-2xl shadow-purple-500/10 backdrop-blur-xl animate-fade-in">
        {/* Logo and Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative w-20 h-20 rounded-2xl bg-white dark:bg-[#1f1b33] p-3 border border-purple-100 dark:border-purple-800/40 flex items-center justify-center shadow-md">
              <img
                src={assets.logo_full}
                alt="MedGPT Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* 404 Big Number */}
        <h1 className="text-7xl sm:text-8xl font-black bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-600 bg-clip-text text-transparent tracking-tighter mb-2">
          404
        </h1>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Consultation or Page Not Found
        </h2>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
          The medical consultation, chat session, or requested page could not be located or may have been deleted.
        </p>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/main/chat')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-semibold shadow-lg shadow-purple-500/25 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Start New Consultation
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-gray-200 dark:border-purple-900/60 bg-white/80 dark:bg-purple-950/30 hover:bg-gray-100 dark:hover:bg-purple-900/40 text-gray-700 dark:text-gray-300 text-sm font-semibold transition-all active:scale-95 cursor-pointer"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
