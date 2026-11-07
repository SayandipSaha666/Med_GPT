import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import { useTheme } from '../store/themeStore';
import { useAuth } from '../store/authStore';
import '../secondary-pages.css';

const capabilities = [
  { title: 'Explore a health question', description: 'Ask about symptoms, medicines, or general wellness in your own words.' },
  { title: 'Bring your documents', description: 'Attach a supported report or image when it helps explain your question.' },
  { title: 'Keep the conversation', description: 'Return to your chats and review answers alongside their available supporting material.' },
];

export function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const chatDestination = user ? '/main/chat' : '/auth';

  return (
    <div className="med-page">
      <header style={{ borderBottom: '1px solid var(--med-border)', background: 'var(--med-surface)' }}>
        <div style={{ width: 'min(100%, 1080px)', minHeight: 66, margin: 'auto', padding: '10px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <button type="button" onClick={() => navigate('/')} aria-label="MedGPT home" style={{ display: 'flex', alignItems: 'center', gap: 10, border: 0, background: 'transparent', color: 'var(--med-ink)', fontWeight: 700, fontSize: 18 }}>
            <span className="med-logo-mark"><img src={theme === 'light' ? assets.logo_full_dark : assets.logo_full} alt="" /></span>
            MedGPT
          </button>
          <nav className="med-home-nav" aria-label="Main navigation" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a className="med-button med-button-quiet med-home-section-link" href="#how-it-works" style={{ minHeight: 38 }}>How it works</a>
            <button type="button" className="med-button med-button-quiet" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} style={{ minHeight: 38 }}>{theme === 'dark' ? 'Light' : 'Dark'}</button>
            <button type="button" className="med-button" onClick={() => navigate(chatDestination)}>{user ? 'Open chat' : 'Get started'}</button>
          </nav>
        </div>
      </header>

      <main>
        <section className="med-page-inner" style={{ paddingTop: 'clamp(56px, 10vw, 120px)', paddingBottom: 72 }}>
          <h1 className="med-display" style={{ maxWidth: 760 }}>Make sense of health information, one question at a time.</h1>
          <p className="med-lead" style={{ maxWidth: 600, margin: '22px 0 28px' }}>Ask a question, share a report, and read a clear response you can revisit. MedGPT helps you prepare for better conversations about your care.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button type="button" className="med-button" onClick={() => navigate(chatDestination)}>{user ? 'Continue to chat' : 'Start a conversation'} <span aria-hidden="true">→</span></button>
            <button type="button" className="med-button med-button-secondary" onClick={() => navigate('/main/credits')}>View plans</button>
          </div>
          <p className="med-faint" style={{ fontSize: 12, marginTop: 24 }}>For information only. MedGPT does not replace a clinician or provide a confirmed diagnosis.</p>
        </section>

        <section id="how-it-works" className="med-page-inner med-rule" aria-labelledby="how-heading">
          <h2 id="how-heading" className="med-page-title" style={{ maxWidth: 600 }}>Your question, with room for context.</h2>
          <div className="med-feature-grid" style={{ marginTop: 32 }}>
            {capabilities.map((item) => (
              <article key={item.title} className="med-card med-card-pad">
                <h3 style={{ fontSize: 17, margin: '0 0 8px', letterSpacing: '-.02em' }}>{item.title}</h3>
                <p className="med-muted" style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="med-page-inner med-rule" style={{ paddingBottom: 80 }}>
          <div className="med-card med-card-pad" style={{ background: 'var(--med-accent-soft)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div><h2 className="med-page-title" style={{ fontSize: 27 }}>What would you like to understand?</h2></div>
            <button type="button" className="med-button" onClick={() => navigate(chatDestination)}>Open MedGPT <span aria-hidden="true">→</span></button>
          </div>
        </section>
      </main>
      <footer className="med-rule med-muted" style={{ padding: '24px 18px', textAlign: 'center', fontSize: 12 }}>MedGPT · Health information for thoughtful questions</footer>
    </div>
  );
}

export default HomePage;
