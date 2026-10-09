import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import { useTheme } from '../store/themeStore';
import { useAuth } from '../store/authStore';

const features = [
  {
    icon: '🩺',
    title: 'Symptom Analysis',
    badge: 'Clinical AI',
    description: 'Describe complex symptoms to receive rapid, structured medical insights regarding possible conditions.',
  },
  {
    icon: '💊',
    title: 'Drug & Interactions',
    badge: 'Pharmacology',
    description: 'Check pharmaceutical safety, dosages, common contraindications, and potential drug-to-drug interactions.',
  },
  {
    icon: '🧪',
    title: 'Lab Report Explanation',
    badge: 'Diagnostics',
    description: 'Break down complex lab results, blood work values, and diagnostic metrics into clear patient-friendly summaries.',
  },
  {
    icon: '🔒',
    title: 'Private & Confidential',
    badge: 'Security',
    description: 'All conversations and health queries are securely processed with high-standard data encryption and privacy.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Describe Your Concern',
    desc: 'Type your symptoms, medication questions, or paste your clinical lab metrics in plain language.',
    icon: '💬',
  },
  {
    step: '02',
    title: 'AI Clinical Analysis',
    desc: 'MedGPT analyzes your query against validated medical databases and contemporary clinical guidelines.',
    icon: '🧠',
  },
  {
    step: '03',
    title: 'Structured Action Plan',
    desc: 'Receive clear, actionable health insights, home remedies, and alerts on when to consult a specialist.',
    icon: '📋',
  },
];

const testimonials = [
  {
    name: 'Dr. Sarah Chen, MD',
    role: 'Primary Care Physician',
    rating: 5,
    text: 'MedGPT is a remarkable companion for patients. It explains complex medical diagnoses in accessible language, preparing them well for doctor visits.',
  },
  {
    name: 'Marcus Johnson',
    role: 'Patient & Runner',
    rating: 5,
    text: 'When I had acute joint pain after training, MedGPT helped me understand the difference between a strain and tendinitis before seeing my physio.',
  },
  {
    name: 'Elena Rodriguez',
    role: 'Medical Student',
    rating: 5,
    text: 'The accuracy in pharmacological breakdown and lab value analysis is unmatched. An invaluable reference tool for medical revision.',
  },
];

export function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[#faf9fc] dark:bg-[#0e0d16] text-[#2D2535] dark:text-gray-100 transition-colors duration-300 scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-purple-900">
      {/* Background Decorative Ambient Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-purple-500/10 dark:bg-purple-600/15 blur-[120px]"></div>
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-[120px]"></div>
        <div className="absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/15 blur-[120px]"></div>
      </div>

      {/* Top Sticky Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-[#12101e]/80 backdrop-blur-xl border-b border-purple-100/60 dark:border-purple-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 p-0.5 shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white dark:bg-gray-900 rounded-[10px] flex items-center justify-center p-1">
                <img
                  src={theme === 'light' ? assets.logo_full_dark : assets.logo_full}
                  alt="MedGPT Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 dark:from-purple-300 dark:via-purple-100 dark:to-blue-300 bg-clip-text text-transparent">
                MedGPT
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                AI
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              How It Works
            </a>
            <a href="#reviews" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Reviews
            </a>
            <button
              onClick={() => navigate('/main/credits')}
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
            >
              Plans
            </button>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-purple-100 dark:border-purple-900/40 bg-white/80 dark:bg-[#191629]/80 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>

            {user ? (
              <button
                onClick={() => navigate('/main/chat')}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md shadow-purple-500/25 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Launch App</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md shadow-purple-500/25 active:scale-95 transition-all cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100/80 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/60 mb-6 shadow-sm">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
          </span>
          <span className="text-xs font-semibold text-purple-800 dark:text-purple-300">
            Next-Generation Medical AI Platform • v2.0
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Your AI-Powered <br />
          <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Clinical Companion
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Get instant, clinical-grade answers to your health queries — from symptoms and medication facts to lab report insights — in a secure, private environment.
        </p>

        {/* Hero CTA Buttons */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
          <button
            onClick={() => navigate(user ? '/main/chat' : '/auth')}
            className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-semibold text-sm sm:text-base shadow-xl shadow-purple-600/25 hover:shadow-purple-600/40 active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            <span>{user ? 'Start Consultation' : 'Get Started Free'}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>

          <button
            onClick={() => navigate('/main/credits')}
            className="px-7 py-3.5 rounded-2xl border border-purple-200 dark:border-purple-800/60 bg-white/80 dark:bg-[#181527]/80 hover:bg-purple-50 dark:hover:bg-[#201c34] text-gray-800 dark:text-gray-200 font-semibold text-sm sm:text-base shadow-md shadow-purple-500/5 transition-all active:scale-95 cursor-pointer"
          >
            View Credit Plans
          </button>
        </div>

        {/* Simulated Interactive Medical AI Preview Card */}
        <div className="mt-16 max-w-4xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-35 transition duration-700"></div>
          <div className="relative rounded-3xl bg-white/90 dark:bg-[#151324]/90 border border-purple-200/80 dark:border-purple-900/50 shadow-2xl p-6 sm:p-8 backdrop-blur-2xl text-left">
            {/* Mock Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-purple-100 dark:border-purple-950/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 p-0.5 flex items-center justify-center">
                  <div className="w-full h-full bg-white dark:bg-gray-900 rounded-[10px] flex items-center justify-center p-1">
                    <img src={assets.logo_full} alt="MedGPT" className="w-full h-full object-contain" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Live Clinical Consultation Preview</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">● Verified AI Engine Active</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
                General Diagnostics
              </span>
            </div>

            {/* Mock Chat Conversation */}
            <div className="space-y-4">
              {/* User message */}
              <div className="flex justify-end">
                <div className="max-w-lg p-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs sm:text-sm shadow-md">
                  <p className="font-medium">"I have sudden dizziness when standing up and mild fatigue. What could be the potential causes?"</p>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/70 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
                  🩺
                </div>
                <div className="flex-1 p-4 rounded-2xl bg-purple-50/60 dark:bg-[#1c192d]/80 border border-purple-100 dark:border-purple-900/40 text-xs sm:text-sm text-gray-800 dark:text-gray-200 space-y-2">
                  <p className="font-semibold text-purple-700 dark:text-purple-300">
                    Preliminary Clinical Analysis:
                  </p>
                  <p className="leading-relaxed">
                    Dizziness upon standing is commonly associated with <strong>Orthostatic Hypotension</strong> (a temporary drop in blood pressure), mild dehydration, or electrolyte imbalance.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="p-2 rounded-xl bg-white dark:bg-[#151324] border border-purple-100/80 dark:border-purple-950/60">
                      <p className="font-bold text-gray-900 dark:text-white">💡 Immediate Steps</p>
                      <p className="text-gray-500 dark:text-gray-400 text-[11px]">Hydrate adequately, stand up gradually in stages, and check blood pressure.</p>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-[#151324] border border-purple-100/80 dark:border-purple-950/60">
                      <p className="font-bold text-red-600 dark:text-red-400">⚠️ Red Flags</p>
                      <p className="text-gray-500 dark:text-gray-400 text-[11px]">Seek immediate care if accompanied by chest pain, shortness of breath, or fainting.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Metrics Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {[
            { metric: '99.4%', label: 'Clinical Accuracy Alignment' },
            { metric: '24 / 7', label: 'Instant Medical Availability' },
            { metric: '100% Encrypted', label: 'Privacy & Data Security' },
            { metric: '< 2 Sec', label: 'Real-Time Response Speed' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white/60 dark:bg-[#161426]/60 border border-purple-100 dark:border-purple-950/40 backdrop-blur-sm"
            >
              <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {item.metric}
              </p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-2">
            Intelligent Features
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            Everything You Need for Health Clarity
          </h3>
          <p className="mt-3 text-sm sm:text-base text-gray-500 dark:text-gray-400">
            Built with medical-grade precision and designed for fast, compassionate, and reliable patient guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="
                p-6 rounded-3xl
                bg-white/70 dark:bg-[#171428]/70 border border-purple-100 dark:border-purple-900/40
                hover:border-purple-400 dark:hover:border-purple-600
                hover:bg-white dark:hover:bg-[#1e1a34]
                shadow-lg shadow-purple-500/5 hover:shadow-purple-500/15
                hover:-translate-y-1 transition-all duration-300 backdrop-blur-xl group
              "
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100/80 dark:border-purple-900/40">
                  {feature.icon}
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                  {feature.badge}
                </span>
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {feature.title}
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-2">
            Simple 3-Step Process
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            How MedGPT Works
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, index) => (
            <div
              key={index}
              className="relative p-7 rounded-3xl bg-white/60 dark:bg-[#161426]/60 border border-purple-100 dark:border-purple-950/40 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-3xl font-black text-purple-300 dark:text-purple-800">
                  {item.step}
                </span>
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {item.title}
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-2">
            User Testimonials
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            Trusted by Patients and Practitioners
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <div
              key={index}
              className="p-6 rounded-3xl bg-white/70 dark:bg-[#171428]/70 border border-purple-100 dark:border-purple-900/30 backdrop-blur-xl shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3 text-sm">
                  {'★'.repeat(t.rating)}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 italic leading-relaxed mb-6">
                  "{t.text}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-purple-100/60 dark:border-purple-950/40">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-0.5 flex items-center justify-center">
                  <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600">
                    {t.name[0]}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Card */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="relative rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 sm:p-12 text-center text-white overflow-hidden shadow-2xl shadow-purple-600/30">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight">
              Ready to experience smarter health guidance?
            </h2>
            <p className="text-purple-100 text-sm sm:text-base mb-8">
              Join thousands of users utilizing MedGPT for quick, reliable, and private medical answers.
            </p>
            <button
              onClick={() => navigate(user ? '/main/chat' : '/auth')}
              className="px-8 py-3.5 rounded-2xl bg-white text-purple-700 hover:bg-purple-50 font-bold text-sm sm:text-base shadow-xl active:scale-95 transition-all cursor-pointer"
            >
              {user ? 'Open Dashboard' : 'Create Free Account'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-100 dark:border-purple-950/60 py-10 px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500 dark:text-gray-400 space-y-3">
        <p className="font-semibold text-gray-700 dark:text-gray-300">
          MedGPT — Next-Generation Medical AI Platform
        </p>
        <p className="max-w-2xl mx-auto text-[11px] leading-relaxed opacity-75">
          Disclaimer: MedGPT is an informational artificial intelligence tool and does not provide formal medical diagnosis, treatment, or clinical prescriptions. Always consult a qualified medical professional for acute emergencies.
        </p>
        <p className="text-[11px] opacity-60">
          © {new Date().getFullYear()} MedGPT. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default HomePage;
