import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { assets } from '../../assets/assets';

interface HeaderProps {
  isMenuOpen?: boolean;
  onMenuToggle?: () => void;
}

export function Header({ isMenuOpen, onMenuToggle }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Mobile Menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <img src={assets.menu_icon} alt="Menu" className="w-6 h-6" />
          </button>
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img
              src={assets.logo_full}
              alt="MedGPT Logo"
              className="h-8 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Theme Toggle (centered on larger screens) */}
        <div className="flex-1 flex justify-center">
          <ThemeToggle />
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/main/chat" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Chat
            </Link>
            <Link to="/main/credits" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Credits
            </Link>
          </nav>

          <Link
            to="/main/profile"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <img
              src={assets.user_icon}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
            <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">
              Profile
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
