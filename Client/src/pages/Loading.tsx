import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../secondary-pages.css';

function Loading() {
  const navigate = useNavigate();
  useEffect(() => {
    const timeout = setTimeout(() => navigate('/'), 3000);
    return () => clearTimeout(timeout);
  }, [navigate]);

  return <main className="med-page" style={{ display: 'grid', placeItems: 'center' }} aria-busy="true">
    <div role="status" style={{ textAlign: 'center' }}>
      <div aria-hidden="true" style={{ width: 34, height: 34, border: '3px solid var(--med-border)', borderTopColor: 'var(--med-accent)', borderRadius: '50%', animation: 'med-spin .8s linear infinite', margin: '0 auto 16px' }} />
      <span className="med-muted" style={{ fontSize: 14 }}>Loading MedGPT…</span>
    </div>
  </main>;
}

export default Loading;
