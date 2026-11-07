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
import { FilePreviewProvider } from './store/previewStore';
import { FilePreviewModal } from './components/FilePreviewModal';

function AppContent() {
  const { theme } = useTheme();

  return (
    <FilePreviewProvider>
      <Analytics />
      <FilePreviewModal />
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 3500,
          style: {
            background: theme === 'dark' ? '#1c2926' : '#ffffff',
            color: theme === 'dark' ? '#edf5f1' : '#172826',
            border: theme === 'dark' ? '1px solid #354640' : '1px solid #dce5df',
            borderRadius: '9px',
            fontSize: '13px',
            fontWeight: 500,
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#176b63',
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
      <div className="min-h-screen w-screen bg-[var(--med-bg)] text-[var(--med-ink)]">
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
              <Route path="folder/:folderId" element={<Chatbox />} />
              <Route path="credits" element={<Credits />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>
          {/* Explicit 404 and Catch-all routes */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </FilePreviewProvider>
  );
}

function App() {
  return <AppContent />;
}

export default App;
