import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useCheckout } from '@/hooks/useCheckout'
import { formatUSD, formatNGN, convertUSDtoNGN } from '@/utils/currency'
import { supabase } from '@/config/supabase'
import Breadcrumb from '@/components/common/Breadcrumb'
import Loading from '@/components/common/Loading'
import toast from 'react-hot-toast'
import './Checkout.css'

const Checkout = () => {
  const { user, profile } = useAuth()
  const { cartItems, getCartTotals } = useCart()
  const { processing, exchangeRate, loadExchangeRate, processCheckout } = useCheckout()
  const navigate = useNavigate()

  // Form states
  const [customerInfo, setCustomerInfo] = useState({
    email: profile?.email || '',
    fullName: profile?.full_name || '',
    phone: profile?.phone || '',
    nationality: profile?.nationality || ''
  })

  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  })

  const [billingAddress, setBillingAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  })

  const [useSameAddress, setUseSameAddress] = useState(true)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  
  // Coupon states
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)

  // Calculate totals - FIXED ORDER
  const { subtotal, itemCount } = getCartTotals()
  const shippingCost = subtotal >= 200 ? 0 : 15
  
  // Calculate discount
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0

    if (appliedCoupon.discount_type === 'percentage') {
      let discount = (subtotal * appliedCoupon.discount_value) / 100
      if (appliedCoupon.maximum_discount_usd && discount > appliedCoupon.maximum_discount_usd) {
        discount = appliedCoupon.maximum_discount_usd
      }
      return discount
    } else {
      return appliedCoupon.discount_value
    }
  }

  const discount = calculateDiscount()
  const finalTotal = subtotal + shippingCost - discount

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/checkout')
      return
    }

    if (cartItems.length === 0) {
      navigate('/cart')
      return
    }
  }, [user, cartItems, navigate])

  useEffect(() => {
    if (customerInfo.nationality === 'Nigeria') {
      loadExchangeRate()
    }
  }, [customerInfo.nationality])

  const handleCustomerInfoChange = (e) => {
    setCustomerInfo({
      ...customerInfo,
      [e.target.name]: e.target.value
    })
  }

  const handleShippingAddressChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value
    })
  }

  const handleBillingAddressChange = (e) => {
    setBillingAddress({
      ...billingAddress,
      [e.target.name]: e.target.value
    })
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code')
      return
    }

    setCouponLoading(true)

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (error || !data) {
        toast.error('Invalid coupon code')
        setCouponLoading(false)
        return
      }

      // Check if coupon is expired
      if (data.valid_until && new Date(data.valid_until) < new Date()) {
        toast.error('This coupon has expired')
        setCouponLoading(false)
        return
      }

      // Check usage limit
      if (data.usage_limit && data.usage_count >= data.usage_limit) {
        toast.error('This coupon has reached its usage limit')
        setCouponLoading(false)
        return
      }

      // Check minimum purchase
      if (data.minimum_purchase_usd && subtotal < data.minimum_purchase_usd) {
        toast.error(`Minimum purchase of ${formatUSD(data.minimum_purchase_usd)} required`)
        setCouponLoading(false)
        return
      }

      setAppliedCoupon(data)
      toast.success('Coupon applied successfully!')
    } catch (error) {
      console.error('Error applying coupon:', error)
      toast.error('Failed to apply coupon')
    } finally {
      setCouponLoading(false)
    }
  }

  const validateStep1 = () => {
    if (!customerInfo.email || !customerInfo.fullName || !customerInfo.phone || !customerInfo.nationality) {
      toast.error('Please fill in all customer information')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    const required = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'postalCode', 'country']
    for (const field of required) {
      if (!shippingAddress[field]) {
        toast.error('Please fill in all shipping address fields')
        return false
      }
    }

    if (!useSameAddress) {
      for (const field of required) {
        if (!billingAddress[field]) {
          toast.error('Please fill in all billing address fields')
          return false
        }
      }
    }
    return true
  }

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3)
    }
  }

  const handlePlaceOrder = async () => {
    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions')
      return
    }

    const checkoutData = {
      shippingAddress,
      billingAddress: useSameAddress ? shippingAddress : billingAddress,
      customerInfo,
      couponCode: appliedCoupon?.code || null,
      couponId: appliedCoupon?.id || null,
      totals: {
        subtotal,
        discount,
        shipping: shippingCost,
        tax: 0,
        total: finalTotal
      }
    }

    await processCheckout(checkoutData)
  }

  if (cartItems.length === 0 || !user) {
    return <Loading fullScreen text="Redirecting..." />
  }

  const breadcrumbItems = [
    { label: 'Cart', path: '/cart' },
    { label: 'Checkout' }
  ]

  return (
    <div className="checkout-page">
      <div className="container">
        <Breadcrumb items={breadcrumbItems} />

        <h1 className="checkout-title">Checkout</h1>

        {/* Progress Steps */}
        <div className="checkout-progress">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="progress-step-number">1</div>
            <div className="progress-step-label">Customer Info</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="progress-step-number">2</div>
            <div className="progress-step-label">Shipping</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="progress-step-number">3</div>
            <div className="progress-step-label">Review & Pay</div>
          </div>
        </div>

        <div className="checkout-content">
          <div className="row g-4">
            {/* Checkout Form */}
            <div className="col-lg-8">
              <div className="checkout-form">
                {/* Step 1: Customer Information */}
                {currentStep === 1 && (
                  <div className="checkout-step">
                    <h2 className="step-title">Customer Information</h2>

                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label">Email Address *</label>
                        <input
                          type="email"
                          name="email"
                          className="form-control"
                          value={customerInfo.email}
                          onChange={handleCustomerInfoChange}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Full Name *</label>
                        <input
                          type="text"
                          name="fullName"
                          className="form-control"
                          value={customerInfo.fullName}
                          onChange={handleCustomerInfoChange}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Phone Number *</label>
                        <input
                          type="tel"
                          name="phone"
                          className="form-control"
                          value={customerInfo.phone}
                          onChange={handleCustomerInfoChange}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label">Nationality *</label>
                        <select
                          name="nationality"
                          className="form-control"
                          value={customerInfo.nationality}
                          onChange={handleCustomerInfoChange}
                          required
                        >
                          <option value="">Select Nationality</option>
                          <option value="Nigeria">Nigeria</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Canada">Canada</option>
                          <option value="Ghana">Ghana</option>
                          <option value="South Africa">South Africa</option>
                          <option value="Kenya">Kenya</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {customerInfo.nationality === 'Nigeria' && exchangeRate && (
                        <div className="col-12">
                          <div className="currency-notice">
                            <i className="bi bi-info-circle me-2"></i>
                            <div>
                              <strong>Currency Conversion Notice</strong>
                              <p>
                                Your payment will be processed in Nigerian Naira (NGN).
                                Current exchange rate: $1 USD = ₦{exchangeRate.toFixed(2)} NGN
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      className="btn btn-primary mt-4"
                      onClick={handleNextStep}
                    >
                      Continue to Shipping
                      <i className="bi bi-arrow-right ms-2"></i>
                    </button>
                  </div>
                )}

                {/* Step 2: Shipping Information */}
                {currentStep === 2 && (
                  <div className="checkout-step">
                    <h2 className="step-title">Shipping Address</h2>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Full Name *</label>
                        <input
                          type="text"
                          name="fullName"
                          className="form-control"
                          value={shippingAddress.fullName}
                          onChange={handleShippingAddressChange}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Phone Number *</label>
                        <input
                          type="tel"
                          name="phone"
                          className="form-control"
                          value={shippingAddress.phone}
                          onChange={handleShippingAddressChange}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label">Address Line 1 *</label>
                        <input
                          type="text"
                          name="addressLine1"
                          className="form-control"
                          placeholder="Street address, P.O. box"
                          value={shippingAddress.addressLine1}
                          onChange={handleShippingAddressChange}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label">Address Line 2</label>
                        <input
                          type="text"
                          name="addressLine2"
                          className="form-control"
                          placeholder="Apartment, suite, unit, building, floor, etc."
                          value={shippingAddress.addressLine2}
                          onChange={handleShippingAddressChange}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">City *</label>
                        <input
                          type="text"
                          name="city"
                          className="form-control"
                          value={shippingAddress.city}
                          onChange={handleShippingAddressChange}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">State/Province *</label>
                        <input
                          type="text"
                          name="state"
                          className="form-control"
                          value={shippingAddress.state}
                          onChange={handleShippingAddressChange}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Postal Code *</label>
                        <input
                          type="text"
                          name="postalCode"
                          className="form-control"
                          value={shippingAddress.postalCode}
                          onChange={handleShippingAddressChange}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Country *</label>
                        <input
                          type="text"
                          name="country"
                          className="form-control"
                          value={shippingAddress.country}
                          onChange={handleShippingAddressChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Billing Address Same as Shipping */}
                    <div className="form-check mt-4">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="sameAddress"
                        checked={useSameAddress}
                        onChange={(e) => setUseSameAddress(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="sameAddress">
                        Billing address same as shipping address
                      </label>
                    </div>

                    {/* Billing Address Form */}
                    {!useSameAddress && (
                      <>
                        <h3 className="step-subtitle mt-4">Billing Address</h3>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label">Full Name *</label>
                            <input
                              type="text"
                              name="fullName"
                              className="form-control"
                              value={billingAddress.fullName}
                              onChange={handleBillingAddressChange}
                              required
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label">Phone Number *</label>
                            <input
                              type="tel"
                              name="phone"
                              className="form-control"
                              value={billingAddress.phone}
                              onChange={handleBillingAddressChange}
                              required
                            />
                          </div>

                          <div className="col-12">
                            <label className="form-label">Address Line 1 *</label>
                            <input
                              type="text"
                              name="addressLine1"
                              className="form-control"
                              value={billingAddress.addressLine1}
                              onChange={handleBillingAddressChange}
                              required
                            />
                          </div>

                          <div className="col-12">
                            <label className="form-label">Address Line 2</label>
                            <input
                              type="text"
                              name="addressLine2"
                              className="form-control"
                              value={billingAddress.addressLine2}
                              onChange={handleBillingAddressChange}
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label">City *</label>
                            <input
                              type="text"
                              name="city"
                              className="form-control"
                              value={billingAddress.city}
                              onChange={handleBillingAddressChange}
                              required
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label">State/Province *</label>
                            <input
                              type="text"
                              name="state"
                              className="form-control"
                              value={billingAddress.state}
                              onChange={handleBillingAddressChange}
                              required
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label">Postal Code *</label>
                            <input
                              type="text"
                              name="postalCode"
                              className="form-control"
                              value={billingAddress.postalCode}
                              onChange={handleBillingAddressChange}
                              required
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label">Country *</label>
                            <input
                              type="text"
                              name="country"
                              className="form-control"
                              value={billingAddress.country}
                              onChange={handleBillingAddressChange}
                              required
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="step-actions mt-4">
                      <button
                        className="btn btn-outline"
                        onClick={() => setCurrentStep(1)}
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Back
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleNextStep}
                      >
                        Continue to Review
                        <i className="bi bi-arrow-right ms-2"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Payment */}
                {currentStep === 3 && (
                  <div className="checkout-step">
                    <h2 className="step-title">Review Your Order</h2>

                    {/* Customer Info Summary */}
                    <div className="review-section">
                      <div className="review-section-header">
                        <h3>Customer Information</h3>
                        <button
                          className="btn-edit"
                          onClick={() => setCurrentStep(1)}
                        >
                          Edit
                        </button>
                      </div>
                      <div className="review-section-content">
                        <p><strong>Email:</strong> {customerInfo.email}</p>
                        <p><strong>Name:</strong> {customerInfo.fullName}</p>
                        <p><strong>Phone:</strong> {customerInfo.phone}</p>
                        <p><strong>Nationality:</strong> {customerInfo.nationality}</p>
                      </div>
                    </div>

                    {/* Shipping Address Summary */}
                    <div className="review-section">
                      <div className="review-section-header">
                        <h3>Shipping Address</h3>
                        <button
                          className="btn-edit"
                          onClick={() => setCurrentStep(2)}
                        >
                          Edit
                        </button>
                      </div>
                      <div className="review-section-content">
                        <p>{shippingAddress.fullName}</p>
                        <p>{shippingAddress.addressLine1}</p>
                        {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                        <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                        <p>{shippingAddress.country}</p>
                        <p>{shippingAddress.phone}</p>
                      </div>
                    </div>

                    {/* Coupon Section */}
                    <div className="review-section">
                      <div className="review-section-header">
                        <h3>Discount Code</h3>
                      </div>
                      <div className="review-section-content">
                        {!appliedCoupon ? (
                          <div className="coupon-input-group">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Enter coupon code"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                              disabled={couponLoading}
                            />
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={handleApplyCoupon}
                              disabled={couponLoading || !couponCode}
                            >
                              {couponLoading ? 'Applying...' : 'Apply'}
                            </button>
                          </div>
                        ) : (
                          <div className="applied-coupon">
                            <div className="coupon-info">
                              <i className="bi bi-ticket-perforated text-success"></i>
                              <span><strong>{appliedCoupon.code}</strong> - {formatUSD(discount)} off</span>
                            </div>
                            <button
                              type="button"
                              className="btn-remove-coupon"
                              onClick={() => {
                                setAppliedCoupon(null)
                                setCouponCode('')
                              }}
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="form-check mt-4">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="agreeTerms"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="agreeTerms">
                        I agree to the <a href="/terms" target="_blank">Terms & Conditions</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
                      </label>
                    </div>

                    <div className="step-actions mt-4">
                      <button
                        className="btn btn-outline"
                        onClick={() => setCurrentStep(2)}
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Back
                      </button>
                      <button
                        className="btn btn-primary btn-lg"
                        onClick={handlePlaceOrder}
                        disabled={!agreedToTerms || processing}
                      >
                        {processing ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-lock-fill me-2"></i>
                            Place Order
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="col-lg-4">
              <div className="order-summary">
                <h2 className="order-summary-title">Order Summary</h2>

                {/* Cart Items */}
                <div className="order-items">
                  {cartItems.map((item) => {
                    const itemPrice = item.variant?.price_adjustment_usd
                      ? item.product.price_usd + item.variant.price_adjustment_usd
                      : item.product.price_usd
                    
                    const primaryImage = item.product?.images?.find(img => img.is_primary) || item.product?.images?.[0]

                    return (
                      <div key={item.id} className="order-item">
                        <div className="order-item-image">
                          <img
                            src={primaryImage?.image_url || '/placeholder-product.jpg'}
                            alt={item.product.name}
                          />
                          <span className="order-item-quantity">{item.quantity}</span>
                        </div>
                        <div className="order-item-details">
                          <p className="order-item-name">{item.product.name}</p>
                          {(item.variant?.size || item.variant?.color) && (
                            <p className="order-item-variants">
                              {item.variant.size && `Size: ${item.variant.size}`}
                              {item.variant.size && item.variant.color && ' • '}
                              {item.variant.color && `Color: ${item.variant.color}`}
                            </p>
                          )}
                        </div>
                        <div className="order-item-price">
                          {formatUSD(itemPrice * item.quantity)}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Totals */}
                <div className="order-totals">
                  <div className="order-total-row">
                    <span>Subtotal</span>
                    <span>{formatUSD(subtotal)}</span>
                  </div>

                  <div className="order-total-row">
                    <span>Shipping</span>
                    <span>
                      {shippingCost === 0 ? (
                        <span className="text-success">FREE</span>
                      ) : (
                        formatUSD(shippingCost)
                      )}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="order-total-row discount-row">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-{formatUSD(discount)}</span>
                    </div>
                  )}

                  <div className="order-total-divider"></div>

                  <div className="order-total-row total">
                    <span>Total (USD)</span>
                    <span>{formatUSD(finalTotal)}</span>
                  </div>

                  {customerInfo.nationality === 'Nigeria' && exchangeRate && (
                    <div className="order-total-row ngn-total">
                      <span>Total (NGN)</span>
                      <span>{formatNGN(convertUSDtoNGN(finalTotal, exchangeRate))}</span>
                    </div>
                  )}
                </div>

                {/* Security Badge */}
                <div className="security-badge">
                  <i className="bi bi-shield-check"></i>
                  <span>Secure SSL Encrypted Payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout