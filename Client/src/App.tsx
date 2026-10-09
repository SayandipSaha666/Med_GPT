import { Routes, Route } from 'react-router-dom';
import Loading from './pages/Loading';
import Credits from './pages/Credits';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import Layout from './pages/Layout';
import Chatbox from './components/Chatbox';
import ChatDetails from './components/ChatDetails';
import Profile from './components/Profile';
import NotFound from './pages/NotFound';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import { Analytics } from "@vercel/analytics/react";
import { useTheme } from './store/themeStore';

function AppContent() {
  const { theme } = useTheme();

  return (
    <>
      <Analytics />
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 3500,
          style: {
            background: theme === 'dark' ? '#181524' : '#ffffff',
            color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
            border: theme === 'dark' ? '1px solid rgba(168, 85, 247, 0.25)' : '1px solid #e5e7eb',
            borderRadius: '14px',
            boxShadow: theme === 'dark'
              ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(168, 85, 247, 0.15)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            fontSize: '13px',
            fontWeight: 500,
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <div className="min-h-screen w-screen bg-[#faf9fc] text-[#2D2535] dark:bg-[#0e0d16] dark:text-white transition-colors duration-300">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/loading" element={<Loading />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/main" element={<Layout />}>
              <Route path="chat">
                <Route index element={<Chatbox />} />
                <Route path=":id" element={<ChatDetails />} />
              </Route>
              <Route path="credits" element={<Credits />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>
          {/* Explicit 404 and Catch-all routes */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;
