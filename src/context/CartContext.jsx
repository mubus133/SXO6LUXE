import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/config/supabase'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'

const CartContext = createContext({})

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [sessionId, setSessionId] = useState(null)

  // Initialize session ID for guest users
  useEffect(() => {
    if (!user) {
      let guestSessionId = localStorage.getItem('guest_session_id')
      if (!guestSessionId) {
        guestSessionId = uuidv4()
        localStorage.setItem('guest_session_id', guestSessionId)
      }
      setSessionId(guestSessionId)
    }
  }, [user])

  // Load cart on mount and auth change
  useEffect(() => {
    if (user || sessionId) {
      loadCart()
    } else {
      setLoading(false)
    }
  }, [user, sessionId])

  
 const loadCart = async () => {
  try {
    setLoading(true)

    let query = supabase
      .from('cart_items')
      .select(`
        *,
        product:products(
          *,
          images:product_images(
            id,
            image_url,
            alt_text,
            is_primary,
            display_order
          )
        ),
        variant:product_variants(*)
      `)

    if (user) {
      query = query.eq('user_id', user.id)
    } else if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Cart load error:', error)
      throw error
    }

    // Filter out items with inactive products and sort images
    const activeItems = (data || []).filter(item => {
      if (!item.product || !item.product.is_active) return false
      
      // Sort images by display_order and ensure primary image is first
      if (item.product.images && item.product.images.length > 0) {
        item.product.images.sort((a, b) => {
          if (a.is_primary) return -1
          if (b.is_primary) return 1
          return a.display_order - b.display_order
        })
      }
      
      return true
    })

    setCartItems(activeItems)
  } catch (error) {
    console.error('Error loading cart:', error)
    // Don't show error toast, just log it
  } finally {
    setLoading(false)
  }
}

  /**
   * Add item to cart
   */
  const addToCart = async (productId, variantId = null, quantity = 1) => {
    try {
      // Check if item already exists in cart
      const existingItem = cartItems.find(
        item => item.product_id === productId && item.variant_id === variantId
      )

      if (existingItem) {
        // Update quantity
        await updateQuantity(existingItem.id, existingItem.quantity + quantity)
        return { success: true }
      }

      // Add new item
      const cartItem = {
        product_id: productId,
        variant_id: variantId,
        quantity,
        user_id: user?.id || null,
        session_id: !user ? sessionId : null
      }

      const { data, error } = await supabase
        .from('cart_items')
        .insert([cartItem])
        .select(`
          *,
          product:products(*),
          variant:product_variants(*)
        `)
        .single()

      if (error) throw error

      setCartItems(prev => [...prev, data])
      toast.success('Added to cart')
      return { success: true }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add to cart')
      return { success: false, error }
    }
  }

  /**
   * Update item quantity
   */
  const updateQuantity = async (cartItemId, newQuantity) => {
    try {
      if (newQuantity < 1) {
        return await removeFromCart(cartItemId)
      }

      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', cartItemId)
        .select(`
          *,
          product:products(*),
          variant:product_variants(*)
        `)
        .single()

      if (error) throw error

      setCartItems(prev =>
        prev.map(item => (item.id === cartItemId ? data : item))
      )

      return { success: true }
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast.error('Failed to update quantity')
      return { success: false, error }
    }
  }

  /**
   * Remove item from cart
   */
  const removeFromCart = async (cartItemId) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)

      if (error) throw error

      setCartItems(prev => prev.filter(item => item.id !== cartItemId))
      toast.success('Removed from cart')
      return { success: true }
    } catch (error) {
      console.error('Error removing from cart:', error)
      toast.error('Failed to remove from cart')
      return { success: false, error }
    }
  }

  /**
   * Clear entire cart
   */
  const clearCart = async () => {
    try {
      let query = supabase.from('cart_items').delete()

      if (user) {
        query = query.eq('user_id', user.id)
      } else if (sessionId) {
        query = query.eq('session_id', sessionId)
      }

      const { error } = await query

      if (error) throw error

      setCartItems([])
      return { success: true }
    } catch (error) {
      console.error('Error clearing cart:', error)
      return { success: false, error }
    }
  }

  /**
   * Merge guest cart with user cart on login
   */
  const mergeGuestCart = async (userId) => {
    try {
      const guestSessionId = localStorage.getItem('guest_session_id')
      if (!guestSessionId) return

      // Get guest cart items
      const { data: guestItems, error: fetchError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('session_id', guestSessionId)

      if (fetchError) throw fetchError

      if (guestItems && guestItems.length > 0) {
        // Update guest items to user ID
        for (const item of guestItems) {
          await supabase
            .from('cart_items')
            .update({
              user_id: userId,
              session_id: null
            })
            .eq('id', item.id)
        }

        // Clear guest session
        localStorage.removeItem('guest_session_id')
        
        // Reload cart
        await loadCart()
      }
    } catch (error) {
      console.error('Error merging guest cart:', error)
    }
  }

  /**
   * Calculate cart totals
   */
  const getCartTotals = () => {
    const subtotal = cartItems.reduce((total, item) => {
      const price = item.variant?.price_adjustment_usd
        ? item.product.price_usd + item.variant.price_adjustment_usd
        : item.product.price_usd
      return total + (price * item.quantity)
    }, 0)

    const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0)

    return {
      subtotal: Number(subtotal.toFixed(2)),
      itemCount,
      items: cartItems
    }
  }

  const value = {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    mergeGuestCart,
    getCartTotals,
    itemCount: cartItems.reduce((count, item) => count + item.quantity, 0)
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}