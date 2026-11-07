import { useState } from 'react';
import { billingService } from '../api/billing/billing.service';
import { authService } from '../api/auth/auth.service';
import toast from 'react-hot-toast';
import { useAuth } from '../store/authStore';
import { assets } from '../assets/assets';
import '../secondary-pages.css';

export function Credits() {
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const { user, setUser } = useAuth();
  const { data: plans = [], isLoading } = billingService.useGetPlans();
  const createOrderMutation = billingService.useCreateOrder();
  const paymentStatusMutation = billingService.usePaymentStatus();
  const getMeQuery = authService.useGetMe();

  const verifyPayment = async (orderId: string) => {
    let attempts = 0;
    const maxAttempts = 10;
    const pollStatus = async () => {
      try {
        const status = await paymentStatusMutation.mutateAsync(orderId);
        if (status?.isPaid) {
          toast.success('Credits added to your account');
          const updatedUser = await getMeQuery.refetch();
          if (updatedUser.data?.success) setUser(updatedUser.data.data);
          setPurchasingId(null);
          return;
        }
      } catch { /* Retry a transient verification error. */ }
      attempts++;
      if (attempts < maxAttempts) setTimeout(pollStatus, 2000);
      else { toast.error('Verification timed out. Refresh shortly to see your updated credits.'); setPurchasingId(null); }
    };
    void pollStatus();
  };

  const handlePurchase = async (plan: (typeof plans)[number]) => {
    if (plan.price === 0) { toast('This is the free plan.', { icon: 'ℹ️' }); return; }
    try {
      setPurchasingId(plan.id);
      const { orderId, amount, currency, keyId } = await createOrderMutation.mutateAsync(plan.id);
      const options = {
        key: keyId, amount, currency, name: 'MedGPT',
        description: `Purchase ${plan.name} Plan (${plan.credits} Credits)`,
        image: assets.logo_full, order_id: orderId,
        handler: () => { toast.success('Payment authorized. Verifying credits…'); void verifyPayment(orderId); },
        modal: { ondismiss: () => { setPurchasingId(null); toast.error('Payment cancelled'); } },
        theme: { color: '#176b63' },
      };
      const Razorpay = (window as Window & { Razorpay?: new (configuration: Record<string, unknown>) => { on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void; open: () => void } }).Razorpay;
      if (!Razorpay) throw new Error('Payment service is unavailable. Please try again later.');
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', (response) => { setPurchasingId(null); toast.error(response?.error?.description || 'Payment failed'); });
      rzp.open();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error initiating payment');
      setPurchasingId(null);
    }
  };

  if (isLoading) return <main className="med-page" role="status"><div className="med-page-inner">Loading available plans…</div></main>;

  return <main className="med-page"><div className="med-page-inner">
    <h1 className="med-page-title">Choose the credits that fit your use.</h1>
    <p className="med-lead" style={{ maxWidth: 620, margin: '10px 0 32px' }}>See your balance and compare the available plans. Your current pricing and plan details are shown below.</p>
    <section className="med-card med-card-pad" aria-label="Current account balance" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 34 }}>
      <div><p className="med-label">Available credits</p><p style={{ fontSize: 31, fontWeight: 650, margin: 0 }}>{user?.credits ?? 0}</p></div>
      <div><p className="med-label">Current plan</p><p style={{ fontSize: 17, fontWeight: 650, margin: 0 }}>{user?.plan?.name || 'Free Tier'}</p></div>
    </section>
    <section aria-labelledby="plans-heading">
      <h2 id="plans-heading" style={{ fontSize: 20, margin: '0 0 20px' }}>Available plans</h2>
      {plans.length === 0 ? <p className="med-muted">No plans are available right now. Please check back later.</p> : <div className="med-plan-grid">
        {plans.map((plan) => {
          const isCurrentPlan = plan.price === 0 && (!user?.plan || user.plan.name === plan.name);
          const isProcessing = purchasingId === plan.id;
          const isFeatured = plan.id === 2 || plan.name?.toLowerCase().includes('pro');
          return <article key={plan.id} className={`med-card med-plan ${isFeatured ? 'med-plan-featured' : ''}`}>
            <div>
              <h3 style={{ fontSize: 20, margin: '0 0 10px', overflowWrap: 'anywhere' }}>{plan.name}</h3>
              <p className="med-faint" style={{ fontSize: 13, margin: 0 }}>{plan.credits} credits</p>
              <p style={{ fontSize: 31, fontWeight: 650, margin: '24px 0 2px' }}>{plan.price === 0 ? 'Free' : `₹${plan.price}`}</p>
              {plan.price > 0 && <p className="med-faint" style={{ fontSize: 12, margin: 0 }}>One-time top-up</p>}
              {plan.features?.length ? <ul className="med-rule">{plan.features.map((feature: string, index: number) => <li key={index}>{feature}</li>)}</ul> : <div style={{ flex: 1 }} />}
            </div>
            <button type="button" className={`med-button ${isFeatured ? '' : 'med-button-secondary'}`} style={{ width: '100%', marginTop: 'auto' }} onClick={() => void handlePurchase(plan)} disabled={isProcessing || createOrderMutation.isPending || isCurrentPlan}>{isProcessing ? 'Processing…' : isCurrentPlan ? 'Current plan' : `Get ${plan.name}`}</button>
          </article>;
        })}
      </div>}
    </section>
    <p className="med-faint med-rule" style={{ paddingTop: 22, marginTop: 40, fontSize: 12 }}>Payments are processed through Razorpay. Credits appear in your account after payment verification.</p>
  </div></main>;
}

export default Credits;
