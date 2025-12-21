import React, { forwardRef } from 'react'
import { formatDate } from '@/utils/date'
import './PrintableOrderSlip.css'

const PrintableOrderSlip = forwardRef(({ order }, ref) => {
  if (!order) return null

  return (
    <div ref={ref} className="printable-order-slip">
      {/* Header */}
      <div className="slip-header">
        <div className="slip-logo">SXO6LUXE</div>
        <div className="slip-barcode">
          <div className="barcode-lines">
            <div></div><div></div><div></div><div></div><div></div>
            <div></div><div></div><div></div><div></div><div></div>
          </div>
          <div className="barcode-text">{order.order_number}</div>
        </div>
      </div>

      {/* Order Info */}
      <div className="slip-section">
        <h2>ORDER INFORMATION</h2>
        <table className="info-table">
          <tbody>
            <tr>
              <td><strong>Order Number:</strong></td>
              <td>{order.order_number}</td>
            </tr>
            <tr>
              <td><strong>Order Date:</strong></td>
              <td>{formatDate(order.created_at)}</td>
            </tr>
            <tr>
              <td><strong>Payment Status:</strong></td>
              <td className="status-paid">{order.payment_status.toUpperCase()}</td>
            </tr>
            {order.tracking_number && (
              <tr>
                <td><strong>Tracking Number:</strong></td>
                <td>{order.tracking_number}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Shipping Address */}
      <div className="slip-section">
        <h2>SHIP TO:</h2>
        <div className="address-box">
          <strong>{order.customer_name}</strong><br/>
          {order.shipping_address.addressLine1}<br/>
          {order.shipping_address.addressLine2 && <>{order.shipping_address.addressLine2}<br/></>}
          {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postalCode}<br/>
          {order.shipping_address.country}<br/>
          <strong>Phone:</strong> {order.customer_phone || order.shipping_address.phone}
        </div>
      </div>

      {/* Order Items */}
      <div className="slip-section">
        <h2>ORDER ITEMS</h2>
        <table className="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>SKU</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index}>
                <td>
                  <strong>{item.product_name}</strong>
                  {(item.variant_size || item.variant_color) && (
                    <div className="item-variant">
                      {item.variant_size && `Size: ${item.variant_size}`}
                      {item.variant_size && item.variant_color && ' • '}
                      {item.variant_color && `Color: ${item.variant_color}`}
                    </div>
                  )}
                </td>
                <td>{item.product_sku || '-'}</td>
                <td><strong>{item.quantity}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="slip-footer">
        <div className="footer-note">
          <strong>HANDLE WITH CARE</strong><br/>
          This package contains luxury items
        </div>
        <div className="footer-signature">
          <div className="signature-line"></div>
          <div>Authorized Signature</div>
        </div>
      </div>
    </div>
  )
})

PrintableOrderSlip.displayName = 'PrintableOrderSlip'

export default PrintableOrderSlip