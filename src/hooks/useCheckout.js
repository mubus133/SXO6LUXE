import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { createOrder, updateOrderPaymentStatus, updateInventoryAfterOrder } from '@/services/orderService'
import { generatePaymentReference, openPaystackPopup, verifyPayment, createPaymentTransaction } from '@/services/paystackService'
import { fetchExchangeRate, convertUSDtoNGN } from '@/utils/currency'
import { supabase } from '@/config/supabase'
import { sendOrderConfirmationEmail } from '@/services/emailService'
import toast from 'react-hot-toast'

export const useCheckout = () => {
  const { user } = useAuth()
  const { cartItems, clearCart, getCartTotals } = useCart()
  const navigate = useNavigate()
  const [processing, setProcessing] = useState(false)
  const [exchangeRate, setExchangeRate] = useState(null)

  /**
   * Load exchange rate
   */
  const loadExchangeRate = async () => {
    const rate = await fetchExchangeRate()
    setExchangeRate(rate)
    return rate
  }

  /**
   * Process checkout
   */
  const processCheckout = async (checkoutData) => {
    try {
      setProcessing(true)

      const {
        shippingAddress,
        billingAddress,
        customerInfo,
        couponCode,
        couponId,
        totals
      } = checkoutData

      // Create order
      const orderData = {
        user_id: user?.id || null,
        customer_email: customerInfo.email,
        customer_name: customerInfo.fullName,
        customer_phone: customerInfo.phone,
        customer_nationality: customerInfo.nationality,
        cart_items: cartItems,
        shipping_address: shippingAddress,
        billing_address: billingAddress || shippingAddress,
        coupon_code: couponCode,
        coupon_id: couponId,
        subtotal_usd: totals.subtotal,
        discount_usd: totals.discount,
        shipping_usd: totals.shipping,
        tax_usd: totals.tax || 0,
        total_usd: totals.total
      }

      const { data: order, error: orderError } = await createOrder(orderData)

      if (orderError) throw orderError

      console.log('✅ Order created:', order.order_number, 'ID:', order.id)

      // If Nigerian customer, process Paystack payment
      if (customerInfo.nationality === 'Nigeria') {
        const rate = exchangeRate || await loadExchangeRate()
        const amountNGN = convertUSDtoNGN(totals.total, rate)
        const reference = generatePaymentReference()

        console.log('💳 Initiating Paystack payment:', {
          reference,
          amountNGN,
          rate
        })

        // Open Paystack popup
        openPaystackPopup(
          {
            email: customerInfo.email,
            amount: amountNGN,
            reference,
            metadata: {
              order_id: order.id,
              order_number: order.order_number,
              customer_name: customerInfo.fullName
            }
          },
          async (response) => {
            // Payment successful callback
            console.log('✅ Paystack payment successful:', response)
            await handlePaymentSuccess(order, response, rate, amountNGN)
          },
          () => {
            // Payment closed callback
            console.log('❌ Payment cancelled by user')
            toast.error('Payment cancelled')
            setProcessing(false)
          }
        )
      } else {
        // For non-Nigerian customers, mark as pending and redirect
        toast.success('Order created! Please complete payment.')
        await clearCart()
        navigate(`/order/confirmation/${order.id}`)
      }

      return { success: true, order }
    } catch (error) {
      console.error('❌ Checkout error:', error)
      toast.error('Checkout failed. Please try again.')
      setProcessing(false)
      return { success: false, error }
    }
  }

  /**
   * Handle successful payment - FIXED with better error handling
   */
  const handlePaymentSuccess = async (order, paystackResponse, exchangeRate, amountNGN) => {
    try {
      console.log('🔄 Starting payment verification...')
      
      // Verify payment with Paystack
      const verification = await verifyPayment(paystackResponse.reference)

      console.log('📋 Verification result:', verification)

      if (!verification.success) {
        throw new Error('Payment verification failed: ' + (verification.error || 'Unknown error'))
      }

      console.log('✅ Payment verified successfully')

      // Update order payment status
      console.log('🔄 Updating order payment status...')
      const updateResult = await updateOrderPaymentStatus(order.id, paystackResponse)
      
      if (!updateResult.success) {
        console.error('❌ Failed to update order payment status:', updateResult.error)
        throw new Error('Failed to update order payment status')
      }

      console.log('✅ Order payment status updated')

      // Create payment transaction record
      console.log('🔄 Creating payment transaction record...')
      const transactionResult = await createPaymentTransaction(
        {
          order_id: order.id,
          paystack_reference: paystackResponse.reference,
          amount_ngn: amountNGN,
          amount_usd: order.total_usd,
          exchange_rate: exchangeRate,
          status: 'success',
          payment_channel: verification.data.channel || 'card',
          customer_email: order.customer_email,
          paid_at: new Date().toISOString(),
          gateway_response: verification.data
        },
        supabase
      )

      if (transactionResult.error) {
        console.error('⚠️ Failed to create transaction record:', transactionResult.error)
        // Don't throw here, transaction record is for logging only
      } else {
        console.log('✅ Payment transaction recorded')
      }

      // Send order confirmation email
      console.log('📧 Sending order confirmation email...')
      await sendOrderConfirmationEmail(order)

      // Update inventory
      console.log('📦 Updating inventory...')
      await updateInventoryAfterOrder(cartItems)

      // Clear cart
      console.log('🛒 Clearing cart...')
      await clearCart()

      // Show success message
      toast.success('Payment successful! Order confirmed.')

      // Redirect to confirmation page
      console.log('🎉 Payment flow completed, redirecting...')
      navigate(`/order/confirmation/${order.id}`)
    } catch (error) {
      console.error('❌ Payment success handling error:', error)
      toast.error('Payment completed but there was an error processing your order. Please contact support with reference: ' + paystackResponse.reference)
      
      // Still redirect to confirmation page so user can see their order
      setTimeout(() => {
        navigate(`/order/confirmation/${order.id}`)
      }, 3000)
    } finally {
      setProcessing(false)
    }
  }

  return {
    processing,
    exchangeRate,
    loadExchangeRate,
    processCheckout
  }
}