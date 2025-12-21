import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchOrderById } from '@/services/orderService'
import { useAuth } from '@/context/AuthContext'
import { formatUSD, formatNGN } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import Loading from '@/components/common/Loading'
import './OrderConfirmation.css'

const OrderConfirmation = () => {
  const { orderId } = useParams()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrder()
  }, [orderId])

  const loadOrder = async () => {
    try {
      setLoading(true)
      const { data, error } = await fetchOrderById(orderId, user?.id)

      if (error || !data) {
        console.error('Order not found')
      } else {
        setOrder(data)
      }
    } catch (error) {
      console.error('Error loading order:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loading fullScreen text="Loading order..." />
  }

  if (!order) {
    return (
      <div className="order-confirmation-page">
        <div className="container">
          <div className="order-not-found">
            <i className="bi bi-exclamation-circle"></i>
            <h2>Order Not Found</h2>
            <p>We couldn't find the order you're looking for.</p>
            <Link to="/shop" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="order-confirmation-page">
      <div className="container">
        <div className="confirmation-content">
          {/* Success Header */}
          <div className="confirmation-header">
            <div className="success-icon">
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <h1 className="confirmation-title">Order Confirmed!</h1>
            <p className="confirmation-subtitle">
              Thank you for your order. We've sent a confirmation email to{' '}
              <strong>{order.customer_email}</strong>
            </p>
            <div className="order-number">
              Order Number: <strong>{order.order_number}</strong>
            </div>
          </div>

          {/* Order Details */}
          <div className="order-details-card">
            <h2>Order Details</h2>

            {/* Order Items */}
            <div className="confirmation-items">
              {order.items.map((item) => (
                <div key={item.id} className="confirmation-item">
                  <div className="item-image">
                    <img
                      src={item.product?.images?.[0]?.image_url || '/placeholder-product.jpg'}
                      alt={item.product_name}
                    />
                  </div>
                  <div className="item-details">
                    <p className="item-name">{item.product_name}</p>
                    {(item.variant_size || item.variant_color) && (
                      <p className="item-variants">
                        {item.variant_size && `Size: ${item.variant_size}`}
                        {item.variant_size && item.variant_color && ' • '}
                        {item.variant_color && `Color: ${item.variant_color}`}
                      </p>
                    )}
                    <p className="item-quantity">Qty: {item.quantity}</p>
                  </div>
                  <div className="item-price">
                    {formatUSD(item.subtotal_usd)}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="confirmation-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatUSD(order.subtotal_usd)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>{formatUSD(order.shipping_usd)}</span>
              </div>
              {order.discount_usd > 0 && (
                <div className="summary-row discount">
                  <span>Discount</span>
                  <span>-{formatUSD(order.discount_usd)}</span>
                </div>
              )}
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span>Total (USD)</span>
                <span>{formatUSD(order.total_usd)}</span>
              </div>
              {order.total_ngn && (
                <div className="summary-row ngn-total">
                  <span>Total Paid (NGN)</span>
                  <span>{formatNGN(order.total_ngn)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping & Payment Info */}
          <div className="row g-4 mt-4">
            <div className="col-md-6">
              <div className="info-card">
                <h3>Shipping Address</h3>
                <p>{order.shipping_address.fullName}</p>
                <p>{order.shipping_address.addressLine1}</p>
                {order.shipping_address.addressLine2 && (
                  <p>{order.shipping_address.addressLine2}</p>
                )}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state}{' '}
                  {order.shipping_address.postalCode}
                </p>
                <p>{order.shipping_address.country}</p>
              </div>
            </div>

            <div className="col-md-6">
              <div className="info-card">
                <h3>Payment Information</h3>
                <p>
                  <strong>Status:</strong>{' '}
                  <span className={`status-badge ${order.payment_status}`}>
                    {order.payment_status}
                  </span>
                </p>
                <p><strong>Method:</strong> {order.payment_method}</p>
                {order.payment_reference && (
                  <p><strong>Reference:</strong> {order.payment_reference}</p>
                )}
                <p><strong>Date:</strong> {formatDate(order.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="confirmation-actions">
            <Link to="/account/orders" className="btn btn-outline">
              View All Orders
            </Link>
            <Link to="/shop" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirmation