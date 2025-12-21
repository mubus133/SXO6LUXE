import { supabase } from '@/config/supabase'
import { fetchExchangeRate, convertUSDtoNGN } from '@/utils/currency'

/**
 * Create a new order
 */
export const createOrder = async (orderData) => {
  try {
    const {
      user_id,
      customer_email,
      customer_name,
      customer_phone,
      customer_nationality,
      cart_items,
      shipping_address,
      billing_address,
      coupon_code,
      coupon_id,
      subtotal_usd,
      discount_usd,
      shipping_usd,
      tax_usd,
      total_usd
    } = orderData

    // Get exchange rate if Nigerian customer
    let exchange_rate = null
    let total_ngn = null
    let currency_paid = 'USD'

    if (customer_nationality === 'Nigeria') {
      exchange_rate = await fetchExchangeRate()
      total_ngn = convertUSDtoNGN(total_usd, exchange_rate)
      currency_paid = 'NGN'
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id,
          customer_email,
          customer_name,
          customer_phone,
          customer_nationality,
          subtotal_usd,
          discount_usd,
          shipping_usd,
          tax_usd,
          total_usd,
          exchange_rate,
          total_ngn,
          currency_paid,
          shipping_address,
          billing_address,
          coupon_code,
          coupon_id,
          status: 'pending',
          payment_status: 'pending'
        }
      ])
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    const orderItems = cart_items.map(item => {
      const price = item.variant?.price_adjustment_usd
        ? item.product.price_usd + item.variant.price_adjustment_usd
        : item.product.price_usd

      return {
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product.name,
        product_sku: item.product.sku,
        variant_size: item.variant?.size,
        variant_color: item.variant?.color,
        price_usd: price,
        quantity: item.quantity,
        subtotal_usd: price * item.quantity
      }
    })

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    return { data: order, error: null }
  } catch (error) {
    console.error('Error creating order:', error)
    return { data: null, error }
  }
}

/**
 * Update order payment status
 */
export const updateOrderPaymentStatus = async (orderId, paymentData) => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        payment_reference: paymentData.reference,
        paystack_reference: paymentData.reference,
        paid_at: new Date().toISOString(),
        status: 'processing'
      })
      .eq('id', orderId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Error updating payment status:', error)
    return { success: false, error }
  }
}

/**
 * Fetch user orders
 */
export const fetchUserOrders = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching orders:', error)
    return { data: null, error }
  }
}

/**
 * Fetch single order
 */
export const fetchOrderById = async (orderId, userId = null) => {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(*)
        )
      `)
      .eq('id', orderId)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query.single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching order:', error)
    return { data: null, error }
  }
}

/**
 * Fetch order by order number
 */
export const fetchOrderByNumber = async (orderNumber, email) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(*)
        )
      `)
      .eq('order_number', orderNumber)
      .eq('customer_email', email)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching order:', error)
    return { data: null, error }
  }
}

/**
 * Update inventory after successful order
 */
export const updateInventoryAfterOrder = async (orderItems) => {
  try {
    for (const item of orderItems) {
      if (item.variant_id) {
        // Update variant inventory
        await supabase.rpc('decrement_variant_inventory', {
          variant_id: item.variant_id,
          quantity: item.quantity
        })
      } else {
        // Update product inventory
        const { data: product } = await supabase
          .from('products')
          .select('inventory_quantity, track_inventory')
          .eq('id', item.product_id)
          .single()

        if (product && product.track_inventory) {
          await supabase
            .from('products')
            .update({
              inventory_quantity: product.inventory_quantity - item.quantity
            })
            .eq('id', item.product_id)
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating inventory:', error)
    return { success: false, error }
  }
}