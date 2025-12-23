import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { formatUSD } from '@/utils/currency'
import Breadcrumb from '@/components/common/Breadcrumb'
import Loading from '@/components/common/Loading'
import './Cart.css'

const Cart = () => {
  const { cartItems, loading, updateQuantity, removeFromCart, getCartTotals } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const { subtotal, itemCount } = getCartTotals()

  // HELPER FUNCTION TO GET PRODUCT IMAGE
  const getProductImage = (item) => {
    if (item?.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
      const primaryImage = item.product.images.find(img => img.is_primary)
      if (primaryImage?.image_url) return primaryImage.image_url
      if (item.product.images[0]?.image_url) return item.product.images[0].image_url
    }
    if (item?.product?.image_url) return item.product.image_url
    return '/placeholder-product.jpg'
  }

  const getProductName = (item) => {
    return item?.product?.name || item?.product_name || 'Product'
  }

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return
    await updateQuantity(itemId, newQuantity)
  }

  const handleRemove = async (itemId) => {
    if (window.confirm('Remove this item from cart?')) {
      await removeFromCart(itemId)
    }
  }

  const handleCheckout = () => {
    if (!user) {
      navigate('/login?redirect=/checkout')
    } else {
      navigate('/checkout')
    }
  }

  if (loading) {
    return <Loading fullScreen text="Loading cart..." />
  }

  const breadcrumbItems = [{ label: 'Shopping Cart' }]

  return (
    <div className="cart-page">
      <div className="container">
        <Breadcrumb items={breadcrumbItems} />

        <h1 className="cart-title">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <i className="bi bi-bag-x"></i>
            <h2>Your cart is empty</h2>
            <p>Add some products to get started</p>
            <Link to="/shop" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="cart-content">
            <div className="row g-4">
              <div className="col-lg-8">
                <div className="cart-items">
                  {cartItems.map((item) => {
                    const itemPrice = item.variant?.price_adjustment_usd
                      ? item.product.price_usd + item.variant.price_adjustment_usd
                      : item.product.price_usd
                    
                    const productImage = getProductImage(item)
                    const productName = getProductName(item)

                    return (
                      <div key={item.id} className="cart-item">
                        <Link 
                          to={`/product/${item.product?.slug || '#'}`}
                          className="cart-item-image"
                        >
                          <img
                            src={productImage}
                            alt={productName}
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = '/placeholder-product.jpg'
                            }}
                          />
                        </Link>

                        <div className="cart-item-details">
                          <Link 
                            to={`/product/${item.product?.slug || '#'}`}
                            className="cart-item-name"
                          >
                            {productName}
                          </Link>

                          {(item.variant?.size || item.variant?.color) && (
                            <div className="cart-item-variants">
                              {item.variant.size && (
                                <span>Size: {item.variant.size}</span>
                              )}
                              {item.variant.color && (
                                <span>Color: {item.variant.color}</span>
                              )}
                            </div>
                          )}

                          <div className="cart-item-price-mobile">
                            {formatUSD(itemPrice)}
                          </div>
                        </div>

                        <div className="cart-item-quantity">
                          <button
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <i className="bi bi-dash"></i>
                          </button>
                          <input
                            type="number"
                            className="quantity-input"
                            value={item.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1
                              handleQuantityChange(item.id, value)
                            }}
                            min="1"
                          />
                          <button
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            <i className="bi bi-plus"></i>
                          </button>
                        </div>

                        <div className="cart-item-price">
                          {formatUSD(itemPrice)}
                        </div>

                        <div className="cart-item-subtotal">
                          {formatUSD(itemPrice * item.quantity)}
                        </div>

                        <button
                          className="cart-item-remove"
                          onClick={() => handleRemove(item.id)}
                          aria-label="Remove item"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    )
                  })}
                </div>

                <Link to="/shop" className="continue-shopping">
                  <i className="bi bi-arrow-left me-2"></i>
                  Continue Shopping
                </Link>
              </div>

              <div className="col-lg-4">
                <div className="cart-summary">
                  <h2 className="cart-summary-title">Order Summary</h2>

                  <div className="cart-summary-row">
                    <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                    <span>{formatUSD(subtotal)}</span>
                  </div>

                  <div className="cart-summary-row">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>

                  <div className="cart-summary-divider"></div>

                  <div className="cart-summary-total">
                    <span>Total</span>
                    <span>{formatUSD(subtotal)}</span>
                  </div>

                  <button
                    className="btn btn-primary w-100 btn-lg"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </button>

                  {!user && (
                    <p className="checkout-note">
                      <i className="bi bi-info-circle me-2"></i>
                      You'll be asked to sign in or create an account
                    </p>
                  )}

                  <div className="cart-features">
                    <div className="cart-feature">
                      <i className="bi bi-shield-check"></i>
                      <span>Secure Checkout</span>
                    </div>
                    <div className="cart-feature">
                      <i className="bi bi-arrow-repeat"></i>
                      <span>Easy Returns</span>
                    </div>
                    <div className="cart-feature">
                      <i className="bi bi-truck"></i>
                      <span>Free Shipping over $200</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart