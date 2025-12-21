import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import { formatUSD } from '@/utils/currency'
import AdminLayout from '@/components/admin/AdminLayout'
import Loading from '@/components/common/Loading'
import './Admin.css'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    lowStockProducts: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      // Fetch products
      const { data: products } = await supabase
        .from('products')
        .select('*')

      // Fetch customers
      const { data: customers } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_admin', false)

      // Calculate stats
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_usd, 0) || 0
      const pendingCount = orders?.filter(o => o.status === 'pending' || o.status === 'processing').length || 0
      const lowStockCount = products?.filter(p => p.track_inventory && p.inventory_quantity <= p.low_stock_threshold).length || 0

      setStats({
        totalOrders: orders?.length || 0,
        totalRevenue,
        totalProducts: products?.length || 0,
        totalCustomers: customers?.length || 0,
        pendingOrders: pendingCount,
        lowStockProducts: lowStockCount
      })

      // Get recent orders (last 10)
      setRecentOrders(orders?.slice(0, 10) || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <Loading text="Loading dashboard..." />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admin-dashboard">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon revenue">
              <i className="bi bi-currency-dollar"></i>
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Revenue</p>
              <h3 className="stat-value">{formatUSD(stats.totalRevenue)}</h3>
              <p className="stat-change positive">
                <i className="bi bi-arrow-up"></i> All time
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orders">
              <i className="bi bi-cart-check"></i>
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Orders</p>
              <h3 className="stat-value">{stats.totalOrders}</h3>
              <p className="stat-change">
                {stats.pendingOrders} pending
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon products">
              <i className="bi bi-box-seam"></i>
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Products</p>
              <h3 className="stat-value">{stats.totalProducts}</h3>
              <p className="stat-change warning">
                {stats.lowStockProducts} low stock
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon customers">
              <i className="bi bi-people"></i>
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Customers</p>
              <h3 className="stat-value">{stats.totalCustomers}</h3>
              <p className="stat-change">Registered users</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="admin-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            <Link to="/admin/products/new" className="quick-action-card">
              <i className="bi bi-plus-circle"></i>
              <span>Add Product</span>
            </Link>
            <Link to="/admin/orders" className="quick-action-card">
              <i className="bi bi-list-check"></i>
              <span>Manage Orders</span>
            </Link>
            <Link to="/admin/categories" className="quick-action-card">
              <i className="bi bi-tags"></i>
              <span>Manage Categories</span>
            </Link>
            <Link to="/admin/coupons" className="quick-action-card">
              <i className="bi bi-ticket"></i>
              <span>Create Coupon</span>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="admin-section">
          <div className="section-header">
            <h2 className="section-title">Recent Orders</h2>
            <Link to="/admin/orders" className="btn btn-outline btn-sm">
              View All
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="empty-state-small">
              <i className="bi bi-inbox"></i>
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order Number</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.order_number}</strong>
                      </td>
                      <td>{order.customer_name}</td>
                      <td>{formatUSD(order.total_usd)}</td>
                      <td>
                        <span className={`status-badge ${order.status}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${order.payment_status}`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td>
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <Link 
                          to={`/admin/orders/${order.id}`}
                          className="btn-action-small"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alerts */}
        {(stats.pendingOrders > 0 || stats.lowStockProducts > 0) && (
          <div className="admin-section">
            <h2 className="section-title">Alerts</h2>
            <div className="alerts-container">
              {stats.pendingOrders > 0 && (
                <div className="alert-card warning">
                  <i className="bi bi-exclamation-triangle"></i>
                  <div>
                    <h4>{stats.pendingOrders} Pending Orders</h4>
                    <p>Orders waiting to be processed</p>
                    <Link to="/admin/orders">View Orders</Link>
                  </div>
                </div>
              )}
              {stats.lowStockProducts > 0 && (
                <div className="alert-card danger">
                  <i className="bi bi-box-seam"></i>
                  <div>
                    <h4>{stats.lowStockProducts} Low Stock Products</h4>
                    <p>Products running low on inventory</p>
                    <Link to="/admin/products">View Products</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard