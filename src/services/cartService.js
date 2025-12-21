import { supabase } from '@/config/supabase'

/**
 * Validate cart items before checkout
 */
export const validateCartItems = async (cartItems) => {
  const validationResults = []

  for (const item of cartItems) {
    try {
      // Check product availability
      if (item.variant_id) {
        const { data: variant } = await supabase
          .from('product_variants')
          .select('inventory_quantity, is_active')
          .eq('id', item.variant_id)
          .single()

        if (!variant || !variant.is_active) {
          validationResults.push({
            item,
            valid: false,
            message: 'This variant is no longer available'
          })
          continue
        }

        if (variant.inventory_quantity < item.quantity) {
          validationResults.push({
            item,
            valid: false,
            message: `Only ${variant.inventory_quantity} in stock`
          })
          continue
        }
      } else {
        const { data: product } = await supabase
          .from('products')
          .select('inventory_quantity, track_inventory, is_active')
          .eq('id', item.product_id)
          .single()

        if (!product || !product.is_active) {
          validationResults.push({
            item,
            valid: false,
            message: 'This product is no longer available'
          })
          continue
        }

        if (product.track_inventory && product.inventory_quantity < item.quantity) {
          validationResults.push({
            item,
            valid: false,
            message: `Only ${product.inventory_quantity} in stock`
          })
          continue
        }
      }

      validationResults.push({
        item,
        valid: true,
        message: 'Available'
      })
    } catch (error) {
      console.error('Error validating item:', error)
      validationResults.push({
        item,
        valid: false,
        message: 'Error validating item'
      })
    }
  }

  return validationResults
}

/**
 * Calculate cart totals with discounts
 */
export const calculateCartTotals = (cartItems, coupon = null, shippingCost = 0) => {
  // Calculate subtotal
  const subtotal = cartItems.reduce((total, item) => {
    const price = item.variant?.price_adjustment_usd
      ? item.product.price_usd + item.variant.price_adjustment_usd
      : item.product.price_usd
    return total + (price * item.quantity)
  }, 0)

  // Calculate discount
  let discount = 0
  if (coupon) {
    if (coupon.discount_type === 'percentage') {
      discount = (subtotal * coupon.discount_value) / 100
      if (coupon.maximum_discount_usd && discount > coupon.maximum_discount_usd) {
        discount = coupon.maximum_discount_usd
      }
    } else if (coupon.discount_type === 'fixed_usd') {
      discount = coupon.discount_value
    }
  }

  // Calculate total
  const total = subtotal - discount + shippingCost

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    shipping: Number(shippingCost.toFixed(2)),
    total: Number(total.toFixed(2))
  }
}