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

      // If Nigerian customer, process Paystack payment
      if (customerInfo.nationality === 'Nigeria') {
        const rate = exchangeRate || await loadExchangeRate()
        const amountNGN = convertUSDtoNGN(totals.total, rate)
        const reference = generatePaymentReference()

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
            await handlePaymentSuccess(order, response, rate, amountNGN)
          },
          () => {
            // Payment closed callback
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
      console.error('Checkout error:', error)
      toast.error('Checkout failed. Please try again.')
      setProcessing(false)
      return { success: false, error }
    }
  }

  /**
   * Handle successful payment
   */
  const handlePaymentSuccess = async (order, paystackResponse, exchangeRate, amountNGN) => {
    try {
      // Verify payment with Paystack
      const verification = await verifyPayment(paystackResponse.reference)

      if (!verification.success) {
        throw new Error('Payment verification failed')
      }

      // Update order payment status
      await updateOrderPaymentStatus(order.id, paystackResponse)

      // Create payment transaction record
      await createPaymentTransaction(
        {
          order_id: order.id,
          paystack_reference: paystackResponse.reference,
          amount_ngn: amountNGN,
          amount_usd: order.total_usd,
          exchange_rate: exchangeRate,
          status: 'success',
          payment_channel: verification.data.channel,
          customer_email: order.customer_email,
          paid_at: new Date().toISOString(),
          gateway_response: verification.data
        },
        supabase
      )

       // Send order confirmation email
    await sendOrderConfirmationEmail(order)

      // Update inventory
      await updateInventoryAfterOrder(cartItems)

      // Clear cart
      await clearCart()

      // Show success message
      toast.success('Payment successful!')

      // Redirect to confirmation page
      navigate(`/order/confirmation/${order.id}`)
    } catch (error) {
      console.error('Payment success handling error:', error)
      toast.error('Error processing payment confirmation')
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