import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Loading from './pages/Loading';
import { Sidebar } from './components/layout/Sidebar';
import Credits from './pages/Credits';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import Layout from './pages/Layout';
import Chatbox from './components/Chatbox';
import ChatDetails from './components/ChatDetails';
import Profile from './components/Profile';
import { assets } from './assets/assets';
import { Toaster } from 'react-hot-toast';
import { Analytics } from "@vercel/analytics/react";
import './assets/prism.css';

function AppContent() {
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <Analytics />
      <Toaster />
      {!isMenuOpen && (
        <img
          src={assets.menu_icon}
          className="absolute top-3 left-3 w-8 h-8 cursor-pointer md:hidden invert dark:invert-0 z-50"
          onClick={() => setIsMenuOpen(true)}
        />
      )}
      <div className="bg-gradient-to-b from-[#F8F6FA] to-[#EDE8F2] text-[#2D2535] dark:from-[#242124] dark:to-[#000000] dark:text-white transition-colors duration-500">
        <div className="flex h-screen w-screen">
          {pathname !== '/' && pathname !== '/auth' && (
            <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
          )}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/loading" element={<Loading />} />
            <Route path="/main" element={<Layout />}>
              <Route path="chat">
                <Route index element={<Chatbox />} />
                <Route path=":id" element={<ChatDetails />} />
              </Route>
              <Route path="credits" element={<Credits />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </div>
      </div>
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;
