// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// CORS headers - must be included in ALL responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EmailRequest {
  type: 'order_confirmation' | 'order_shipped' | 'order_delivered' | 'order_cancelled'
  order: any
}

serve(async (req) => {
  // Handle CORS preflight request - CRITICAL!
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      })
    }

    // Get Resend API key
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
 
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    // Parse request body
    const { type, order }: EmailRequest = await req.json()

    if (!type || !order) {
      throw new Error('Missing required fields: type and order')
    }

    // Prepare email content
    let subject = ''
    let htmlContent = ''

    switch (type) {
      case 'order_confirmation':
        subject = `Order Confirmed - ${order.order_number}`
        htmlContent = getOrderConfirmationHTML(order)
        break
      case 'order_shipped':
        subject = `Order Shipped - ${order.order_number}`
        htmlContent = getOrderShippedHTML(order)
        break
      case 'order_delivered':
        subject = `Order Delivered - ${order.order_number}`
        htmlContent = getOrderDeliveredHTML(order)
        break
      case 'order_cancelled':
        subject = `Order Cancelled - ${order.order_number}`
        htmlContent = getOrderCancelledHTML(order)
        break
      default:
        throw new Error('Invalid email type')
    }

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SXO6LUXE <ac@sxo6luxe.com>', 
        to: [order.customer_email],
        subject: subject,
        html: htmlContent,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email')
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send email' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Email Template Functions
function getOrderConfirmationHTML(order: any): string {
  const APP_URL = Deno.env.get('APP_URL') || 'https://sxo6luxe.com'
  const itemsHTML = order.items?.map((item: any) => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #eee;">
        <strong>${item.product_name}</strong><br/>
        ${item.variant_size ? `Size: ${item.variant_size}` : ''}
        ${item.variant_color ? ` • Color: ${item.variant_color}` : ''}
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right;">
        $${(item.subtotal_usd || 0).toFixed(2)}
      </td>
    </tr>
  `).join('') || ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #000; color: #fff; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 32px; letter-spacing: 2px;">SXO6LUXE</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #eee;">
        <h2 style="color: #000; margin-top: 0;">Thank You for Your Order!</h2>
        <p>Hi ${order.customer_name || 'Customer'},</p>
        <p>We've received your order and Your Order Is in Progress</p>
        
        <div style="background: #fff; padding: 20px; margin: 20px 0; border: 1px solid #eee;">
          <p><strong>Order Number:</strong> ${order.order_number}</p>
          <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #fff;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 15px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
              <th style="padding: 15px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
              <th style="padding: 15px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div style="background: #fff; padding: 20px; margin: 20px 0; border: 1px solid #eee;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 5px;">Subtotal:</td>
              <td style="padding: 5px; text-align: right;">$${(order.subtotal_usd || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 5px;">Shipping:</td>
              <td style="padding: 5px; text-align: right;">$${(order.shipping_usd || 0).toFixed(2)}</td>
            </tr>
            ${order.discount_usd > 0 ? `
            <tr>
              <td style="padding: 5px; color: #28a745;">Discount:</td>
              <td style="padding: 5px; text-align: right; color: #28a745;">-$${order.discount_usd.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr style="border-top: 2px solid #000;">
              <td style="padding: 10px 5px; font-size: 18px;"><strong>Total:</strong></td>
              <td style="padding: 10px 5px; text-align: right; font-size: 18px;"><strong>$${(order.total_usd || 0).toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>

        <p style="text-align: center; margin-top: 30px;">
          <a href="${APP_URL}/account/orders/${order.id}" 
             style="background: #000; color: #fff; padding: 15px 30px; text-decoration: none; display: inline-block; border-radius: 5px;">
            View Order Details
          </a>
        </p>
      </div>

      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} SXO6LUXE. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

function getOrderShippedHTML(order: any): string {
  const APP_URL = Deno.env.get('APP_URL') || 'https://sxo6luxe.com'
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #000; color: #fff; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 32px; letter-spacing: 2px;">SXO6LUXE</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #eee;">
        <h2 style="color: #000; margin-top: 0;">Your Order Has Shipped! 📦</h2>
        <p>Hi ${order.customer_name || 'Customer'},</p>
        <p>Great news! Your order is on its way to you.</p>
        
        <div style="background: #fff; padding: 20px; margin: 20px 0; border: 1px solid #eee;">
          <p><strong>Order Number:</strong> ${order.order_number}</p>
          ${order.tracking_number ? `<p><strong>Tracking Number:</strong> ${order.tracking_number}</p>` : ''}
        </div>

        <p style="text-align: center; margin-top: 30px;">
          <a href="${APP_URL}/account/orders/${order.id}" 
             style="background: #000; color: #fff; padding: 15px 30px; text-decoration: none; display: inline-block; border-radius: 5px;">
            Track Your Order
          </a>
        </p>
      </div>

      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} SXO6LUXE. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

function getOrderDeliveredHTML(order: any): string {
  const APP_URL = Deno.env.get('APP_URL') || 'https://sxo6luxe.com'
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #000; color: #fff; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 32px; letter-spacing: 2px;">SXO6LUXE</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #eee;">
        <h2 style="color: #000; margin-top: 0;">Your Order Has Been Delivered! 🎉</h2>
        <p>Hi ${order.customer_name || 'Customer'},</p>
        <p>Your order has been successfully delivered. We hope you love it!</p>
        
        <div style="background: #fff; padding: 20px; margin: 20px 0; border: 1px solid #eee;">
          <p><strong>Order Number:</strong> ${order.order_number}</p>
        </div>

        <p style="text-align: center; margin-top: 30px;">
          <a href="${APP_URL}/shop" 
             style="background: #000; color: #fff; padding: 15px 30px; text-decoration: none; display: inline-block; border-radius: 5px;">
            Continue Shopping
          </a>
        </p>
      </div>

      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} SXO6LUXE. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

function getOrderCancelledHTML(order: any): string {
  const APP_URL = Deno.env.get('APP_URL') || 'https://sxo6luxe.com'
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #000; color: #fff; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 32px; letter-spacing: 2px;">SXO6LUXE</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #eee;">
        <h2 style="color: #000; margin-top: 0;">Order Cancelled</h2>
        <p>Hi ${order.customer_name || 'Customer'},</p>
        <p>Your order has been cancelled.</p>
        
        <div style="background: #fff; padding: 20px; margin: 20px 0; border: 1px solid #eee;">
          <p><strong>Order Number:</strong> ${order.order_number}</p>
        </div>

        <p style="text-align: center; margin-top: 30px;">
          <a href="${APP_URL}/shop" 
             style="background: #000; color: #fff; padding: 15px 30px; text-decoration: none; display: inline-block; border-radius: 5px;">
            Continue Shopping
          </a>
        </p>
      </div>

      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} SXO6LUXE. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}