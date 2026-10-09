import { useState } from 'react';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../api/api.service';
import toast from 'react-hot-toast';
import { useAuth } from '../store/authStore';

export function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const updateProfileMutation = ApiService.profile.useUpdateProfile();
  const logoutMutation = ApiService.auth.useLogout();

  if (!user) return null;

  const currentPlan = user.plan || { name: 'Free Tier', features: ['Standard AI Consultations', 'General Medical Knowledge', 'Community Support'] };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setUser(null);
        toast.success('Signed out successfully. See you soon! 👋');
        navigate('/auth');
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Error signing out');
      },
    });
  };

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditName(user.name);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    if (editName.trim() === '') {
      toast.error('Name cannot be empty');
      return;
    }
    try {
      const response = await updateProfileMutation.mutateAsync({ name: editName.trim() });
      setUser({ ...user, name: response.data.name });
      toast.success('Profile updated successfully! ✨');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error?.message || 'Error updating profile');
    }
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[#faf9fc] dark:bg-[#0e0d16] text-[#2D2535] dark:text-gray-100 transition-colors duration-300 px-4 sm:px-6 lg:px-8 py-10 scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-purple-900">
      {/* Background Decorative Ambient Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-8">
        {/* Main Profile Header Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-[#161426]/80 border border-purple-100 dark:border-purple-900/40 shadow-xl shadow-purple-500/5 backdrop-blur-xl animate-fade-in">
          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            {/* User Avatar with Glowing Ring */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 rounded-3xl blur-md opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative w-28 h-28 rounded-3xl bg-white dark:bg-[#1f1b33] p-1 border-2 border-purple-200 dark:border-purple-800 shadow-xl overflow-hidden flex items-center justify-center">
                <img
                  src={assets.user_icon}
                  alt="Profile"
                  className="w-full h-full rounded-2xl object-cover"
                />
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 border-4 border-white dark:border-[#161426] rounded-full shadow-md"
                title="Active Account"
              ></div>
            </div>

            {/* User Info & Edit Section */}
            <div className="text-center md:text-left flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3 mb-3">
                  <label className="block text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                    Edit Display Name
                  </label>
                  <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={50}
                      className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-[#12101e] focus:outline-none focus:ring-2 focus:ring-purple-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isPending}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleEditToggle}
                      className="px-3.5 py-2 bg-gray-100 dark:bg-purple-950/40 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-purple-900/60 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start mb-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight truncate">
                    {user.name}
                  </h1>
                  <button
                    onClick={handleEditToggle}
                    className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors cursor-pointer"
                    title="Edit Name"
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
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                </div>
              )}

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate">{user.email}</p>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100/80 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                  ✨ {currentPlan.name} Member
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                  🔒 HIPAA Privacy Standard
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <div className="shrink-0">
              <button
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="px-4 py-2.5 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/40 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <img src={assets.logout_icon} alt="Logout" className="w-4 h-4" />
                <span>{logoutMutation.isPending ? 'Signing out...' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Available Credits Card */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#161426]/80 border border-purple-100 dark:border-purple-900/40 shadow-lg shadow-purple-500/5 backdrop-blur-xl flex items-center justify-between group hover:border-purple-300 dark:hover:border-purple-700 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center p-2.5 shrink-0">
                <img src={assets.credit_icon} alt="Credits" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Available Credits</p>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-0.5">
                  {user.credits ?? 0}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/main/credits')}
              className="px-3.5 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 text-xs font-bold transition-colors cursor-pointer"
            >
              + Top Up
            </button>
          </div>

          {/* Membership Tier Card */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#161426]/80 border border-purple-100 dark:border-purple-900/40 shadow-lg shadow-purple-500/5 backdrop-blur-xl flex items-center justify-between group hover:border-blue-300 dark:hover:border-blue-700 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center p-2.5 shrink-0">
                <img src={assets.diamond_icon} alt="Membership" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Current Plan</p>
                <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                  {currentPlan.name}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/main/credits')}
              className="px-3.5 py-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Change
            </button>
          </div>
        </div>

        {/* Detailed Info Section */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-[#161426]/80 border border-purple-100 dark:border-purple-900/40 shadow-xl shadow-purple-500/5 backdrop-blur-xl space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-purple-100 dark:border-purple-950/60">
            <div className="w-2.5 h-6 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full"></div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Account Details & Preferences
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  User Identification
                </label>
                <div className="p-3 bg-purple-50/50 dark:bg-[#12101e] rounded-2xl border border-purple-100/80 dark:border-purple-950/60 font-mono text-xs text-gray-700 dark:text-gray-300 break-all select-all">
                  {user.id}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Account Creation Date
                </label>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Verified Member'}
                </div>
              </div>
            </div>

            {/* Plan Perks */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Active Tier Perks
              </label>
              <ul className="space-y-2.5">
                {currentPlan.features?.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-6 border-t border-purple-100 dark:border-purple-950/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
              Need assistance or want to review your consultation history?
            </p>
            <button
              onClick={() => navigate('/main/chat')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold shadow-md shadow-purple-500/20 hover:shadow-purple-500/35 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Go to Chat</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
