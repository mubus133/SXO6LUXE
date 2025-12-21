import axios from 'axios'

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
const PAYSTACK_SECRET_KEY = import.meta.env.VITE_PAYSTACK_SECRET_KEY

/**
 * Initialize Paystack payment
 */
export const initializePayment = async (paymentData) => {
  try {
    const { email, amount, reference, metadata } = paymentData

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: Math.round(amount * 100), // Convert to kobo
        reference,
        metadata,
        currency: 'NGN',
        callback_url: `${window.location.origin}/order/confirmation`
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return {
      success: true,
      data: response.data.data
    }
  } catch (error) {
    console.error('Paystack initialization error:', error)
    return {
      success: false,
      error: error.response?.data?.message || 'Payment initialization failed'
    }
  }
}

/**
 * Verify Paystack payment
 */
export const verifyPayment = async (reference) => {
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      }
    )

    return {
      success: response.data.data.status === 'success',
      data: response.data.data
    }
  } catch (error) {
    console.error('Paystack verification error:', error)
    return {
      success: false,
      error: error.response?.data?.message || 'Payment verification failed'
    }
  }
}

/**
 * Open Paystack popup for inline payment
 */
export const openPaystackPopup = (paymentData, onSuccess, onClose) => {
  const { email, amount, reference, metadata } = paymentData

  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount: Math.round(amount * 100), // Convert to kobo
    currency: 'NGN',
    ref: reference,
    metadata,
    callback: (response) => {
      // Payment successful
      onSuccess(response)
    },
    onClose: () => {
      // User closed popup
      onClose()
    }
  })

  handler.openIframe()
}

/**
 * Generate unique payment reference - FIXED
 */
export const generatePaymentReference = () => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000000)
  // FIXED: Changed from 'SXO' to 'SXO6' (complete brand name)
  return `SXO6-${timestamp}-${random}`
}

/**
 * Create payment transaction record
 */
export const createPaymentTransaction = async (transactionData, supabase) => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert([transactionData])
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error creating transaction record:', error)
    return { data: null, error }
  }
}