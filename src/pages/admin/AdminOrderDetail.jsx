import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchOrderById } from '@/services/orderService'
import { formatUSD, formatNGN } from '@/utils/currency'
import { formatDateTime } from '@/utils/date'
import { supabase } from '@/config/supabase'
import AdminLayout from '@/components/admin/AdminLayout'
import Loading from '@/components/common/Loading'
import toast from 'react-hot-toast'
import './Admin.css'
import { 
  sendOrderShippedEmail, 
  sendOrderDeliveredEmail, 
  sendOrderCancelledEmail 
} from '@/services/emailService'
import { useReactToPrint } from 'react-to-print'
import PrintableOrderSlip from '@/components/admin/PrintableOrderSlip'

const AdminOrderDetail = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadOrder()
  }, [orderId])

  const loadOrder = async () => {
    try {
      setLoading(true)
      const { data, error } = await fetchOrderById(orderId)

      if (error || !data) {
        toast.error('Order not found')
        navigate('/admin/orders')
        return
      }

      setOrder(data)
    } catch (error) {
      console.error('Error loading order:', error)
      toast.error('Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  const printRef = useRef()

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Order-${order?.order_number}`,
    pageStyle: `
      @page {
        size: 4in 6in;
        margin: 0;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
      }
    `
  })

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true)

    try {
      const updates = { status: newStatus }
      
      if (newStatus === 'shipped' && !order.shipped_at) {
        updates.shipped_at = new Date().toISOString()
      }
      
      if (newStatus === 'delivered' && !order.delivered_at) {
        updates.delivered_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)

      if (error) throw error

      // Send appropriate email
      const updatedOrder = { ...order, ...updates }
      
      if (newStatus === 'shipped') {
        await sendOrderShippedEmail(updatedOrder)
        toast.success('Order marked as shipped and customer notified')
      } else if (newStatus === 'delivered') {
        await sendOrderDeliveredEmail(updatedOrder)
        toast.success('Order marked as delivered and customer notified')
      } else if (newStatus === 'cancelled') {
        await sendOrderCancelledEmail(updatedOrder)
        toast.success('Order cancelled and customer notified')
      } else {
        toast.success('Order status updated')
      }

      await loadOrder()
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order')
    } finally {
      setUpdating(false)
    }
  }

  const handleTrackingUpdate = async () => {
    const trackingNumber = prompt('Enter tracking number:')
    if (!trackingNumber) return

    setUpdating(true)

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          tracking_number: trackingNumber,
          status: 'shipped',
          shipped_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      toast.success('Tracking number added')
      await loadOrder()
    } catch (error) {
      console.error('Error updating tracking:', error)
      toast.error('Failed to update tracking')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <Loading text="Loading order..." />
      </AdminLayout>
    )
  }

  if (!order) return null

  return (
    <AdminLayout>
      <div className="admin-order-detail">
        {/* Header */}
        <div className="page-header-admin">
          <div>
            <h1>Order {order.order_number}</h1>
            <p>Placed on {formatDateTime(order.created_at)}</p>
          </div>
          <div className="btn-group">
            <select
              className={`status-select ${order.status}`}
              value={order.status}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              disabled={updating}
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              className="btn btn-outline"
              onClick={handlePrint}
            >
              <i className="bi bi-printer me-2"></i>
              Print Slip
            </button>
            <button
              className="btn btn-outline"
              onClick={handleTrackingUpdate}
              disabled={updating}
            >
              <i className="bi bi-truck me-2"></i>
              Add Tracking
            </button>
          </div>
        </div>

        <div className="row g-4">
          {/* Order Items */}
          <div className="col-lg-8">
            <div className="admin-card">
              <h2 className="card-title">Order Items</h2>
              <div className="order-items-admin">
                {order.items.map((item) => (
                  <div key={item.id} className="order-item-admin">
                    <div className="item-image-admin">
                      <img
                        src={item.product?.images?.[0]?.image_url || '/placeholder-product.jpg'}
                        alt={item.product_name}
                      />
                    </div>
                    <div className="item-details-admin">
                      <h4>{item.product_name}</h4>
                      {(item.variant_size || item.variant_color) && (
                        <p className="item-variants">
                          {item.variant_size && `Size: ${item.variant_size}`}
                          {item.variant_size && item.variant_color && ' • '}
                          {item.variant_color && `Color: ${item.variant_color}`}
                        </p>
                      )}
                      <p className="item-sku">SKU: {item.product_sku}</p>
                    </div>
                    <div className="item-quantity-admin">
                      <span>Qty: {item.quantity}</span>
                    </div>
                    <div className="item-price-admin">
                      <p>{formatUSD(item.price_usd)}</p>
                      <p><strong>{formatUSD(item.subtotal_usd)}</strong></p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="order-summary-admin">
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
                  <div className="summary-row ngn">
                    <span>Total Paid (NGN)</span>
                    <span>{formatNGN(order.total_ngn)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            {/* Customer Info */}
            <div className="admin-card mb-4">
              <h3 className="card-title">Customer Information</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Name</span>
                  <span className="info-value">{order.customer_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{order.customer_email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{order.customer_phone || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Nationality</span>
                  <span className="info-value">{order.customer_nationality}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="admin-card mb-4">
              <h3 className="card-title">Shipping Address</h3>
              <div className="address-display">
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
            <div className="admin-card mb-4">
              <h3 className="card-title">Payment Information</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Method</span>
                  <span className="info-value">{order.payment_method}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status</span>
                  <span className={`status-badge ${order.payment_status}`}>
                    {order.payment_status}
                  </span>
                </div>
                {order.payment_reference && (
                  <div className="info-item">
                    <span className="info-label">Reference</span>
                    <span className="info-value">{order.payment_reference}</span>
                  </div>
                )}
                {order.paid_at && (
                  <div className="info-item">
                    <span className="info-label">Paid On</span>
                    <span className="info-value">{formatDateTime(order.paid_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tracking Info */}
            {order.tracking_number && (
              <div className="admin-card">
                <h3 className="card-title">Tracking Information</h3>
                <div className="info-list">
                  <div className="info-item">
                    <span className="info-label">Tracking Number</span>
                    <span className="info-value">{order.tracking_number}</span>
                  </div>
                  {order.shipped_at && (
                    <div className="info-item">
                      <span className="info-label">Shipped On</span>
                      <span className="info-value">{formatDateTime(order.shipped_at)}</span>
                    </div>
                  )}
                  {order.delivered_at && (
                    <div className="info-item">
                      <span className="info-label">Delivered On</span>
                      <span className="info-value">{formatDateTime(order.delivered_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden Printable Component */}
        <div style={{ display: 'none' }}>
          <PrintableOrderSlip ref={printRef} order={order} />
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminOrderDetail