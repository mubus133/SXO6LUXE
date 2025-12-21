import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { fetchUserOrders } from '@/services/orderService'
import { formatUSD } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import AccountLayout from '@/components/layout/AccountLayout'
import Loading from '@/components/common/Loading'
import './Account.css'

const Dashboard = () => {
  const { profile, user } = useAuth()
  const [recentOrders, setRecentOrders] = useState([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) {
      loadDashboardData()
    } else {
      setLoading(false)
    }
  }, [profile])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      if (!profile?.id) {
        console.error('No profile ID available')
        return
      }

      const { data: orders } = await fetchUserOrders(profile.id)

      if (orders) {
        // Calculate stats
        const totalSpent = orders.reduce((sum, order) => sum + order.total_usd, 0)
        const pendingCount = orders.filter(order => 
          order.status === 'pending' || order.status === 'processing'
        ).length

        setStats({
          totalOrders: orders.length,
          totalSpent,
          pendingOrders: pendingCount
        })

        // Get recent orders (last 5)
        setRecentOrders(orders.slice(0, 5))
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AccountLayout>
        <Loading text="Loading dashboard..." />
      </AccountLayout>
    )
  }

  return (
    <AccountLayout>
      <div className="account-dashboard">
        {/* Welcome Section */}
        <div className="dashboard-welcome">
          <h1>Welcome back, {profile?.full_name || user?.email || 'User'}!</h1>
          <p>Manage your account and track your orders</p>
        </div>

        {/* Stats Cards */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="bi bi-box"></i>
            </div>
            <div className="stat-content">
              <h3>{stats.totalOrders}</h3>
              <p>Total Orders</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <i className="bi bi-currency-dollar"></i>
            </div>
            <div className="stat-content">
              <h3>{formatUSD(stats.totalSpent)}</h3>
              <p>Total Spent</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <i className="bi bi-clock"></i>
            </div>
            <div className="stat-content">
              <h3>{stats.pendingOrders}</h3>
              <p>Pending Orders</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions">
            <Link to="/shop" className="action-card">
              <i className="bi bi-bag"></i>
              <span>Continue Shopping</span>
            </Link>
            <Link to="/account/orders" className="action-card">
              <i className="bi bi-box"></i>
              <span>View Orders</span>
            </Link>
            <Link to="/account/profile" className="action-card">
              <i className="bi bi-person"></i>
              <span>Edit Profile</span>
            </Link>
            <Link to="/account/addresses" className="action-card">
              <i className="bi bi-geo-alt"></i>
              <span>Manage Addresses</span>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Recent Orders</h2>
            <Link to="/account/orders" className="section-link">
              View All <i className="bi bi-arrow-right ms-2"></i>
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-inbox"></i>
              <h3>No orders yet</h3>
              <p>Start shopping to see your orders here</p>
              <Link to="/shop" className="btn btn-primary mt-3">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="orders-table">
              <table>
                <thead>
                  <tr>
                    <th>Order Number</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.order_number}</strong>
                      </td>
                      <td>{formatDate(order.created_at)}</td>
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
                        <Link 
                          to={`/account/orders/${order.id}`}
                          className="btn-view"
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

        {/* Account Info */}
        <div className="dashboard-section">
          <h2 className="section-title">Account Information</h2>
          <div className="info-cards">
            <div className="info-card">
              <h4>Contact Information</h4>
              <p><strong>Email:</strong> {profile?.email || user?.email}</p>
              {profile?.phone && (
                <p><strong>Phone:</strong> {profile.phone}</p>
              )}
              <Link to="/account/profile" className="btn btn-outline btn-sm mt-2">
                Edit
              </Link>
            </div>

            <div className="info-card">
              <h4>Newsletter</h4>
              <p>Stay updated with our latest offers and collections</p>
              <button className="btn btn-outline btn-sm mt-2">
                Manage Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </AccountLayout>
  )
}

export default Dashboard