import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import { formatUSD } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import AdminLayout from '@/components/admin/AdminLayout'
import Loading from '@/components/common/Loading'
import toast from 'react-hot-toast'
import './Admin.css'

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    payment_status: ''
  })

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const updates = { status: newStatus }
      
      if (newStatus === 'shipped' && !orders.find(o => o.id === orderId).shipped_at) {
        updates.shipped_at = new Date().toISOString()
      }
      
      if (newStatus === 'delivered' && !orders.find(o => o.id === orderId).delivered_at) {
        updates.delivered_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)

      if (error) throw error

      toast.success('Order status updated')
      await loadOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(filters.search.toLowerCase()) ||
                         order.customer_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         order.customer_email.toLowerCase().includes(filters.search.toLowerCase())
    const matchesStatus = !filters.status || order.status === filters.status
    const matchesPayment = !filters.payment_status || order.payment_status === filters.payment_status

    return matchesSearch && matchesStatus && matchesPayment
  })

  if (loading) {
    return (
      <AdminLayout>
        <Loading text="Loading orders..." />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admin-orders">
        {/* Header */}
        <div className="page-header-admin">
          <div>
            <h1>Orders</h1>
            <p>Manage customer orders</p>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <div className="filter-input">
            <input
              type="text"
              name="search"
              className="admin-form-control"
              placeholder="Search orders..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>
          <select
            name="status"
            className="admin-form-control"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            name="payment_status"
            className="admin-form-control"
            value={filters.payment_status}
            onChange={handleFilterChange}
          >
            <option value="">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="admin-section">
            <div className="empty-state-small">
              <i className="bi bi-cart-x"></i>
              <h3>No orders found</h3>
            </div>
          </div>
        ) : (
          <div className="admin-section">
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.order_number}</strong>
                      </td>
                      <td>
                        <div>
                          <div><strong>{order.customer_name}</strong></div>
                          <div className="text-muted-small">{order.customer_email}</div>
                        </div>
                      </td>
                      <td>{formatDate(order.created_at)}</td>
                      <td><strong>{formatUSD(order.total_usd)}</strong></td>
                      <td>
                        <select
                          className={`status-select ${order.status}`}
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <span className={`status-badge ${order.payment_status}`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="btn-action-small"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="admin-summary">
          <p>Showing {filteredOrders.length} of {orders.length} orders</p>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminOrders