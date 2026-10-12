import { useState } from 'react';
import Loading from './Loading';
import { billingService } from '../api/billing/billing.service';
import { authService } from '../api/auth/auth.service';
import toast from 'react-hot-toast';
import { useAuth } from '../store/authStore';
import { assets } from '../assets/assets';

export function Credits() {
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const { user, setUser } = useAuth();

  const { data: plans = [], isLoading } = billingService.useGetPlans();
  const createOrderMutation = billingService.useCreateOrder();
  const paymentStatusMutation = billingService.usePaymentStatus();
  const getMeQuery = authService.useGetMe();

  const handlePurchase = async (plan: any) => {
    if (plan.price === 0) {
      toast('You are currently on the Free plan or it has already been claimed.', {
        icon: 'ℹ️',
      });
      return;
    }

    try {
      setPurchasingId(plan.id);
      const orderData = await createOrderMutation.mutateAsync(plan.id);
      const { orderId, amount, currency, keyId } = orderData;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'MedGPT AI',
        description: `Purchase ${plan.name} Plan (${plan.credits} Credits)`,
        image: assets.logo_full,
        order_id: orderId,
        handler: function () {
          toast.success('Payment authorized! Verifying credits allocation...');
          verifyPayment(orderId);
        },
        modal: {
          ondismiss: function () {
            setPurchasingId(null);
            toast.error('Payment cancelled');
          },
        },
        theme: {
          color: '#9333ea',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setPurchasingId(null);
        toast.error('Payment failed: ' + (response?.error?.description || 'Transaction unsuccessful'));
      });
      rzp.open();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Error initiating secure payment');
      setPurchasingId(null);
    }
  };

  const verifyPayment = async (orderId: string) => {
    let attempts = 0;
    const maxAttempts = 10;

    const pollStatus = async () => {
      try {
        const status = await paymentStatusMutation.mutateAsync(orderId);
        if (status?.isPaid) {
          toast.success('🎉 Credits added to your account successfully!');
          const updatedUser = await getMeQuery.refetch();
          if (updatedUser.data) {
            setUser(updatedUser.data);
          }
          setPurchasingId(null);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(pollStatus, 2000);
        } else {
          toast.error('Verification timed out. Please refresh in a moment to see updated credits.');
          setPurchasingId(null);
        }
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(pollStatus, 2000);
        } else {
          toast.error('Error verifying payment status. If debited, credits will reflect shortly.');
          setPurchasingId(null);
        }
      }
    };

    pollStatus();
  };

  if (isLoading) return <Loading />;

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[#faf9fc] dark:bg-[#0e0d16] text-[#2D2535] dark:text-gray-100 transition-colors duration-300 px-4 sm:px-6 lg:px-8 py-10 scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-purple-900">
      {/* Background Decorative Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-[140px]"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* User Balance Overview Card */}
        <div className="mb-10 p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-[#161426]/80 border border-purple-100 dark:border-purple-900/40 shadow-xl shadow-purple-500/5 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 p-0.5 shadow-lg shadow-purple-500/20 shrink-0">
              <div className="w-full h-full bg-white dark:bg-gray-900 rounded-[14px] flex items-center justify-center p-2.5">
                <img
                  src={assets.credit_icon}
                  alt="Credits"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Current Account Balance
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2 justify-center sm:justify-start">
                <span>{user?.credits ?? 0}</span>
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Credits Available</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/40 text-center">
              <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Active Tier</p>
              <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
                {user?.plan?.name || 'Free Tier'}
              </p>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/80 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 text-xs font-semibold text-purple-800 dark:text-purple-300 mb-3">
            💎 Flexible Credit Packages
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Transparent Pricing for Health AI
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400">
            Choose a plan that fits your clinical consultation needs. Credits never expire and can be replenished anytime.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {plans.map((plan) => {
            const isPopular = plan.id === 2 || plan.name?.toLowerCase().includes('pro');
            const isCurrentPlan = plan.price === 0 && (!user?.plan || user?.plan?.name === plan.name);
            const isProcessing = purchasingId === plan.id;

            return (
              <div
                key={plan.id}
                className={`
                  relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between
                  transition-all duration-300 backdrop-blur-xl
                  ${
                    isPopular
                      ? 'bg-gradient-to-b from-white to-purple-50/70 dark:from-[#1b172e] dark:to-[#141122] border-2 border-purple-500 dark:border-purple-500 shadow-2xl shadow-purple-500/15 md:-translate-y-2'
                      : 'bg-white/80 dark:bg-[#161426]/80 border border-purple-100 dark:border-purple-900/40 shadow-lg shadow-purple-500/5 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-xl'
                  }
                `}
              >
                {/* Popular Ribbon */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-md shadow-purple-500/30">
                    ⭐ Most Popular
                  </div>
                )}

                <div>
                  {/* Plan Name & Tag */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                      {plan.credits} Credits
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">
                        {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          / one-time top-up
                        </span>
                      )}
                    </div>
                    {plan.price > 0 && (
                      <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1">
                        ₹{(plan.price / plan.credits).toFixed(2)} per consultation query
                      </p>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="pt-4 border-t border-purple-100 dark:border-purple-950/60 mb-8">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                      Plan Inclusions
                    </p>
                    <ul className="space-y-3">
                      {plan.features?.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                          <svg
                            className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={() => handlePurchase(plan)}
                  disabled={isProcessing || createOrderMutation.isPending || isCurrentPlan}
                  className={`
                    w-full py-3 px-4 rounded-2xl font-bold text-sm
                    transition-all duration-200 shadow-md active:scale-95 flex items-center justify-center gap-2
                    ${
                      isCurrentPlan
                        ? 'bg-gray-100 dark:bg-purple-950/40 text-gray-400 dark:text-gray-500 cursor-default shadow-none'
                        : isPopular
                        ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-purple-500/25 cursor-pointer'
                        : 'bg-white dark:bg-[#1f1b33] border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/40 cursor-pointer'
                    }
                  `}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : (
                    `Get ${plan.name}`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Security & FAQ Info Bar */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-100 dark:border-purple-900/40 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                🔒
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Bank-Grade Encryption</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Processed securely via Razorpay PCI-DSS compliant gateway</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                ⚡
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Instant Credit Delivery</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Credits are immediately credited to your active wallet</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                ♾️
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">No Expiration Dates</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Your purchased credits stay in your account forever</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Credits;
