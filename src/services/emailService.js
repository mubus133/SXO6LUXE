import { supabase } from '@/config/supabase'

/**
 * Log email notification (for now, we'll use Supabase to log emails)
 * Later, you can integrate with a proper email service via backend
 */
const logEmailNotification = async (emailType, order) => {
  try {
    // For now, just log to console
    // In production, you'd send this to a backend API or use Supabase Edge Functions
    console.log(`Email Notification: ${emailType}`, {
      to: order.customer_email,
      orderNumber: order.order_number,
      type: emailType
    })

    // Store notification in database for tracking
    const { error } = await supabase
      .from('admin_logs')
      .insert([
        {
          action: `email_${emailType}`,
          entity_type: 'order',
          entity_id: order.id,
          details: {
            customer_email: order.customer_email,
            order_number: order.order_number,
            email_type: emailType
          }
        }
      ])

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error logging email:', error)
    return { success: false, error }
  }
}

/**
 * Send Order Confirmation Email
 */
export const sendOrderConfirmationEmail = async (order) => {
  return await logEmailNotification('order_confirmation', order)
}

/**
 * Send Order Shipped Email
 */
export const sendOrderShippedEmail = async (order) => {
  return await logEmailNotification('order_shipped', order)
}

/**
 * Send Order Delivered Email
 */
export const sendOrderDeliveredEmail = async (order) => {
  return await logEmailNotification('order_delivered', order)
}

/**
 * Send Order Cancelled Email
 */
export const sendOrderCancelledEmail = async (order) => {
  return await logEmailNotification('order_cancelled', order)
}