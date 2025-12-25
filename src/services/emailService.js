import { supabase } from '@/config/supabase'

/**
 * Send email via Supabase Edge Function
 */
const sendEmailViaEdgeFunction = async (emailType, order) => {
  try {
    console.log(`📧 Sending ${emailType} email to ${order.customer_email}...`)
    
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: emailType,
        order: order
      }
    })

    if (error) {
      console.error('❌ Error sending email:', error)
      throw error
    }

    console.log('✅ Email sent successfully:', data)

    // Log to database for tracking
    await supabase
      .from('admin_logs')
      .insert([
        {
          action: `email_${emailType}`,
          entity_type: 'order',
          entity_id: order.id,
          details: {
            customer_email: order.customer_email,
            order_number: order.order_number,
            email_type: emailType,
            sent_at: new Date().toISOString()
          }
        }
      ])

    return { success: true, data }
  } catch (error) {
    console.error('❌ Error in email service:', error)
    
    // Log failed attempt
    await supabase
      .from('admin_logs')
      .insert([
        {
          action: `email_${emailType}_failed`,
          entity_type: 'order',
          entity_id: order.id,
          details: {
            customer_email: order.customer_email,
            order_number: order.order_number,
            email_type: emailType,
            error: error.message,
            failed_at: new Date().toISOString()
          }
        }
      ])

    return { success: false, error }
  }
}

/**
 * Send Order Confirmation Email
 */
export const sendOrderConfirmationEmail = async (order) => {
  return await sendEmailViaEdgeFunction('order_confirmation', order)
}

/**
 * Send Order Shipped Email
 */
export const sendOrderShippedEmail = async (order) => {
  return await sendEmailViaEdgeFunction('order_shipped', order)
}

/**
 * Send Order Delivered Email
 */
export const sendOrderDeliveredEmail = async (order) => {
  return await sendEmailViaEdgeFunction('order_delivered', order)
}

/**
 * Send Order Cancelled Email
 */
export const sendOrderCancelledEmail = async (order) => {
  return await sendEmailViaEdgeFunction('order_cancelled', order)
}