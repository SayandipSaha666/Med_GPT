import React, { useState, useEffect, useContext } from 'react'
import Loading from './Loading'
import { getPlansApi, createOrderApi, getPaymentStatusApi, callAuthUserApi } from '../services/api_services'
import { GlobalContext } from '../context/context'
import toast from 'react-hot-toast'

function Credits() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [purchasingId, setPurchasingId] = useState(null)
  const { setUser } = useContext(GlobalContext)
  
  const fetchPlans = async () => {
    try {
      const response = await getPlansApi()
      if (response.success) {
        setPlans(response.data)
      }
    } catch (error) {
      toast.error('Failed to load plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handlePurchase = async (plan) => {
    try {
      setPurchasingId(plan.id)
      const orderResponse = await createOrderApi(plan.id)
      
      if (!orderResponse.success) {
        toast.error('Failed to create order')
        setPurchasingId(null)
        return
      }

      const { orderId, amount, currency, keyId } = orderResponse.data

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "Research_GPT",
        description: `Purchase of ${plan.name} plan`,
        order_id: orderId,
        handler: function (response) {
          toast.success('Payment completed, verifying...')
          verifyPayment(orderId)
        },
        modal: {
          ondismiss: function() {
            setPurchasingId(null)
            toast.error('Payment cancelled')
          }
        },
        theme: {
          color: "#A456F7"
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (response) {
        setPurchasingId(null)
        toast.error('Payment failed: ' + response.error.description)
      })
      rzp.open()

    } catch (error) {
      console.error(error)
      toast.error('Error initiating payment')
      setPurchasingId(null)
    }
  }

  const verifyPayment = async (orderId) => {
    let attempts = 0
    const maxAttempts = 10
    
    const pollStatus = async () => {
      try {
        const response = await getPaymentStatusApi(orderId)
        if (response.success && response.data.isPaid) {
          toast.success('Credits updated successfully!')
          const userRes = await callAuthUserApi()
          if (userRes.success) {
            setUser(userRes.data)
          }
          setPurchasingId(null)
          return
        }
        
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(pollStatus, 2000)
        } else {
          toast.error('Payment verification timed out. Please refresh later.')
          setPurchasingId(null)
        }
      } catch (error) {
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(pollStatus, 2000)
        } else {
          toast.error('Error verifying payment status')
          setPurchasingId(null)
        }
      }
    }
    
    pollStatus()
  }

  if (loading) return <Loading/>

  return (
    <div className='max-w-7xl h-screen overflow-y-scroll mx-auto px-4 sm:px-6 lg:px-8 py-12'>
      <h2 className='text-3xl font-semibold text-center mb-10 xl:mt-30 text-gray-800 dark:text-white'>Credit Plans</h2>
      <div className='flex flex-wrap justify-center gap-8'>
        {plans.map((plan) => (
          <div key={plan.id} className={`border border-gray-200
            dark:border-purple-700 rounded-lg shadow hover:shadow-lg
            transition-shadow p-6 min-w-[300px] flex flex-col justify-between ${plan.id === 2 ?
            "bg-purple-50 dark:bg-purple-900" : "bg-white dark:bg-transparent"}`}>
            
            <div className='flex-1'>
              <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                {plan.name}
              </h3>

              <p className='text-2xl font-bold text-purple-600 dark:text-purple-300 mb-4'>
                ${plan.price}
                <span className='text-sm text-gray-500 dark:text-gray-400'>{' '}/ {plan.credits} credits</span>
              </p>
              <ul className='list-disc list-inside text-sm text-gray-700 dark:text-purple-200 space-y-2 mb-6'>
                {plan.features?.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
            
            <button 
              onClick={() => handlePurchase(plan)}
              disabled={purchasingId === plan.id}
              className={`w-full py-2.5 rounded-lg text-white font-medium transition-colors ${
                purchasingId === plan.id 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
              }`}
            >
              {purchasingId === plan.id ? 'Processing...' : 'Purchase Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Credits