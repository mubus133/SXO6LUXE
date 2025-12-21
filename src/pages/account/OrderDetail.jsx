import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { fetchOrderById } from '@/services/orderService'
import { formatUSD, formatNGN } from '@/utils/currency'
import { formatDate, formatDateTime } from '@/utils/date'
import AccountLayout from '@/components/layout/AccountLayout'
import Loading from '@/components/common/Loading'
import './Account.css'

const OrderDetail = () => {
  const { orderId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrder()
  }, [orderId])

  const loadOrder = async () => {
    try {
      setLoading(true)
      const { data, error } = await fetchOrderById(orderId, profile.id)

      if (error || !data) {
        navigate('/account/orders')
      } else {
        setOrder(data)
      }
    } catch (error) {
      console.error('Error loading order:', error)
      navigate('/account/orders')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AccountLayout>
        <Loading text="Loading order details..." />
      </AccountLayout>
    )
  }

  if (!order) return null

  const getStatusProgress = () => {
    const statuses = ['pending', 'processing', 'shipped', 'delivered']
    const currentIndex = statuses.indexOf(order.status)
    return ((currentIndex + 1) / statuses.length) * 100
  }

  return (
    <AccountLayout>
      <div className="order-detail">
        {/* Back Button */}
        <Link to="/account/orders" className="back-link">
          <i className="bi bi-arrow-left me-2"></i>
          Back to Orders
        </Link>

        {/* Order Header */}
        <div className="order-detail-header">
          <div>
            <h1>Order {order.order_number}</h1>
            <p>Placed on {formatDateTime(order.created_at)}</p>
          </div>
          <div className="order-badges">
            <span className={`status-badge ${order.status}`}>
              {order.status}
            </span>
            <span className={`status-badge ${order.payment_status}`}>
              {order.payment_status}
            </span>
          </div>
        </div>

        {/* Order Progress */}
        {order.status !== 'cancelled' && order.status !== 'refunded' && (
          <div className="order-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${getStatusProgress()}%` }}
              ></div>
            </div>
            <div className="progress-steps">
              <div className={`progress-step ${['pending', 'processing', 'shipped', 'delivered'].includes(order.status) ? 'completed' : ''}`}>
                <div className="step-icon">
                  <i className="bi bi-check"></i>
                </div>
                <span>Order Placed</span>
              </div>
              <div className={`progress-step ${['processing', 'shipped', 'delivered'].includes(order.status) ? 'completed' : ''}`}>
                <div className="step-icon">
                  <i className="bi bi-box"></i>
                </div>
                <span>Processing</span>
              </div>
              <div className={`progress-step ${['shipped', 'delivered'].includes(order.status) ? 'completed' : ''}`}>
                <div className="step-icon">
                  <i className="bi bi-truck"></i>
                </div>
                <span>Shipped</span>
              </div>
              <div className={`progress-step ${order.status === 'delivered' ? 'completed' : ''}`}>
                <div className="step-icon">
                  <i className="bi bi-house-check"></i>
                </div>
                <span>Delivered</span>
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="order-detail-section">
          <h2>Order Items</h2>
          <div className="order-items-list">
            {order.items.map((item) => (
              <div key={item.id} className="order-item-detail">
                <div className="item-image">
                  <img
                    src={item.product?.images?.[0]?.image_url || '/placeholder-product.jpg'}
                    alt={item.product_name}
                  />
                </div>
                <div className="item-info">
                  <h4>{item.product_name}</h4>
                  {(item.variant_size || item.variant_color) && (
                    <p className="item-variants">
                      {item.variant_size && `Size: ${item.variant_size}`}
                      {item.variant_size && item.variant_color && ' • '}
                      {item.variant_color && `Color: ${item.variant_color}`}
                    </p>
                  )}
                  <p className="item-sku">SKU: {item.product_sku}</p>
                  <p className="item-quantity">Quantity: {item.quantity}</p>
                </div>
                <div className="item-price">
                  <p className="price-label">Price</p>
                  <p className="price-value">{formatUSD(item.price_usd)}</p>
                  <p className="price-label">Subtotal</p>
                  <p className="price-value"><strong>{formatUSD(item.subtotal_usd)}</strong></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary & Info */}
        <div className="row g-4">
          <div className="col-lg-6">
            {/* Shipping Address */}
            <div className="order-detail-section">
              <h2>Shipping Address</h2>
              <div className="address-box">
                <p><strong>{order.shipping_address.fullName}</strong></p>
                <p>{order.shipping_address.addressLine1}</p>
                {order.shipping_address.addressLine2 && (
                  <p>{order.shipping_address.addressLine2}</p>
                )}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state}{' '}
                  {order.shipping_address.postalCode}
                </p>
                <p>{order.shipping_address.country}</p>
                <p>{order.shipping_address.phone}</p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="order-detail-section">
              <h2>Payment Information</h2>
              <div className="info-box">
                <div className="info-row">
                  <span>Payment Method</span>
                  <strong>{order.payment_method}</strong>
                </div>
                <div className="info-row">
                  <span>Payment Status</span>
                  <span className={`status-badge ${order.payment_status}`}>
                    {order.payment_status}
                  </span>
                </div>
                {order.payment_reference && (
                  <div className="info-row">
                    <span>Reference</span>
                    <strong>{order.payment_reference}</strong>
                  </div>
                )}
                {order.paid_at && (
                  <div className="info-row">
                    <span>Paid On</span>
                    <strong>{formatDateTime(order.paid_at)}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            {/* Order Summary */}
            <div className="order-detail-section">
              <h2>Order Summary</h2>
              <div className="summary-box">
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
                {order.tax_usd > 0 && (
                  <div className="summary-row">
                    <span>Tax</span>
                    <span>{formatUSD(order.tax_usd)}</span>
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

            {/* Tracking Info */}
            {order.tracking_number && (
              <div className="order-detail-section">
                <h2>Tracking Information</h2>
                <div className="info-box">
                  <div className="info-row">
                    <span>Tracking Number</span>
                    <strong>{order.tracking_number}</strong>
                  </div>
                  {order.shipped_at && (
                    <div className="info-row">
                      <span>Shipped On</span>
                      <strong>{formatDateTime(order.shipped_at)}</strong>
                    </div>
                  )}
                  {order.delivered_at && (
                    <div className="info-row">
                      <span>Delivered On</span>
                      <strong>{formatDateTime(order.delivered_at)}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help */}
        <div className="order-help">
          <p>Need help with your order?</p>
          <Link to="/contact" className="btn btn-outline">
            Contact Support
          </Link>
        </div>
      </div>
    </AccountLayout>
  )
}

export default OrderDetail