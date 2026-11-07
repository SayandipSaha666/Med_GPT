import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ApiService } from '../api/api.service';
import { useAuth } from '../store/authStore';
import '../secondary-pages.css';

export function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const updateProfileMutation = ApiService.profile.useUpdateProfile();
  const logoutMutation = ApiService.auth.useLogout();
  if (!user) return null;

  const handleLogout = () => logoutMutation.mutate(undefined, {
    onSuccess: () => { setUser(null); toast.success('Signed out successfully'); navigate('/auth'); },
    onError: (error: Error) => toast.error(error?.message || 'Error signing out'),
  });
  const handleSaveProfile = async () => {
    if (!editName.trim()) { toast.error('Name cannot be empty'); return; }
    try {
      const response = await updateProfileMutation.mutateAsync({ name: editName.trim() });
      setUser({ ...user, name: response.data.name });
      toast.success('Profile updated');
      setIsEditing(false);
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Error updating profile'); }
  };
  const planName = user.plan?.name || 'Free Tier';

  return (
    <main className="med-page">
      <div className="med-page-inner med-page-narrow">
        <h1 className="med-page-title">Your profile</h1>
        <p className="med-muted" style={{ margin: '8px 0 32px', lineHeight: 1.6 }}>Manage your details and return to your conversations.</p>
        <section className="med-card med-card-pad" aria-labelledby="profile-details-heading">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
            <div aria-hidden="true" style={{ width: 54, height: 54, borderRadius: 12, background: 'var(--med-accent-soft)', color: 'var(--med-accent)', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 700 }}>{user.name?.slice(0, 1).toUpperCase() || 'M'}</div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <h2 id="profile-details-heading" style={{ fontSize: 19, margin: 0 }}>{user.name}</h2>
              <p className="med-muted" style={{ margin: '4px 0 0', overflowWrap: 'anywhere', fontSize: 14 }}>{user.email}</p>
            </div>
            <button type="button" className="med-button med-button-danger" onClick={handleLogout} disabled={logoutMutation.isPending}>{logoutMutation.isPending ? 'Signing out…' : 'Sign out'}</button>
          </div>
          <div className="med-rule" style={{ marginTop: 24, paddingTop: 24 }}>
            <label className="med-label" htmlFor="profile-name">Display name</label>
            {isEditing ? <form onSubmit={(event) => { event.preventDefault(); void handleSaveProfile(); }} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <input id="profile-name" className="med-input" style={{ flex: '1 1 180px' }} type="text" value={editName} onChange={(event) => setEditName(event.target.value)} maxLength={50} autoFocus required />
              <button type="submit" className="med-button" disabled={updateProfileMutation.isPending}>{updateProfileMutation.isPending ? 'Saving…' : 'Save'}</button>
              <button type="button" className="med-button med-button-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
            </form> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}><span>{user.name}</span><button type="button" className="med-button med-button-quiet" onClick={() => { setEditName(user.name); setIsEditing(true); }}>Edit name</button></div>}
          </div>
        </section>

        <div className="med-feature-grid" style={{ marginTop: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
          <section className="med-card med-card-pad"><p className="med-label">Available credits</p><p style={{ fontSize: 31, fontWeight: 650, margin: '4px 0 18px' }}>{user.credits ?? 0}</p><button type="button" className="med-button med-button-secondary" onClick={() => navigate('/main/credits')}>View plans</button></section>
          <section className="med-card med-card-pad"><p className="med-label">Current plan</p><p style={{ fontSize: 23, fontWeight: 650, margin: '4px 0 18px' }}>{planName}</p><button type="button" className="med-button med-button-secondary" onClick={() => navigate('/main/credits')}>Manage credits</button></section>
        </div>

        <section className="med-card med-card-pad" style={{ marginTop: 16 }} aria-labelledby="account-info-heading">
          <h2 id="account-info-heading" style={{ fontSize: 17, margin: '0 0 18px' }}>Account details</h2>
          <dl style={{ margin: 0, display: 'grid', gap: 15, fontSize: 13 }}>
            <div><dt className="med-label">Account ID</dt><dd style={{ margin: 0, overflowWrap: 'anywhere' }}>{user.id}</dd></div>
            <div><dt className="med-label">Member since</dt><dd style={{ margin: 0 }}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date unavailable'}</dd></div>
          </dl>
          {user.plan?.features?.length ? <div className="med-rule" style={{ marginTop: 20, paddingTop: 20 }}><h3 style={{ fontSize: 14, margin: '0 0 10px' }}>Plan features</h3><ul className="med-muted" style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>{user.plan.features.map((feature: string, index: number) => <li key={index}>{feature}</li>)}</ul></div> : null}
        </section>
        <button type="button" className="med-button med-button-quiet" style={{ marginTop: 22 }} onClick={() => navigate('/main/chat')}>← Back to chat</button>
      </div>
    </main>
  );
}

export default Profile;
