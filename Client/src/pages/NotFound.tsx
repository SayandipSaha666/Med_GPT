import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import '../secondary-pages.css';

function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();
  return <main className="med-page" style={{ display: 'grid', placeItems: 'center', padding: 18 }}>
    <div className="med-page-narrow" style={{ width: '100%', maxWidth: 520 }}>
      <p className="med-eyebrow">404 · Page not found</p>
      <h1 className="med-display" style={{ fontSize: 'clamp(30px, 5vw, 46px)', marginTop: 14 }}>We couldn't find that page.</h1>
      <p className="med-lead" style={{ margin: '18px 0 28px' }}>It may have moved or the link may be out of date. You can return to your conversations or start from home.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <button type="button" className="med-button" onClick={() => navigate(user ? '/main/chat' : '/auth')}>{user ? 'Go to chat' : 'Sign in'}</button>
        <button type="button" className="med-button med-button-secondary" onClick={() => navigate('/')}>Go to home</button>
      </div>
    </div>
  </main>;
}

export default NotFound;
