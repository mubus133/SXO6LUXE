import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { fetchUserOrders } from '@/services/orderService'
import { formatUSD } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import AccountLayout from '@/components/layout/AccountLayout'
import Loading from '@/components/common/Loading'
import './Account.css'

const Orders = () => {
  const { profile } = useAuth()
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    applyFilter()
  }, [filter, orders])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const { data } = await fetchUserOrders(profile.id)

      if (data) {
        setOrders(data)
        setFilteredOrders(data)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilter = () => {
    if (filter === 'all') {
      setFilteredOrders(orders)
    } else {
      setFilteredOrders(orders.filter(order => order.status === filter))
    }
  }

  if (loading) {
    return (
      <AccountLayout>
        <Loading text="Loading orders..." />
      </AccountLayout>
    )
  }

  return (
    <AccountLayout>
      <div className="account-orders">
        {/* Header */}
        <div className="page-header">
          <h1>Order History</h1>
          <p>View and track all your orders</p>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Orders ({orders.length})
          </button>
          <button
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({orders.filter(o => o.status === 'pending').length})
          </button>
          <button
            className={`filter-tab ${filter === 'processing' ? 'active' : ''}`}
            onClick={() => setFilter('processing')}
          >
            Processing ({orders.filter(o => o.status === 'processing').length})
          </button>
          <button
            className={`filter-tab ${filter === 'shipped' ? 'active' : ''}`}
            onClick={() => setFilter('shipped')}
          >
            Shipped ({orders.filter(o => o.status === 'shipped').length})
          </button>
          <button
            className={`filter-tab ${filter === 'delivered' ? 'active' : ''}`}
            onClick={() => setFilter('delivered')}
          >
            Delivered ({orders.filter(o => o.status === 'delivered').length})
          </button>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-inbox"></i>
            <h3>No orders found</h3>
            <p>
              {filter === 'all' 
                ? "You haven't placed any orders yet"
                : `No ${filter} orders`
              }
            </p>
            <Link to="/shop" className="btn btn-primary mt-3">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div className="order-info">
                    <h3>{order.order_number}</h3>
                    <p>Placed on {formatDate(order.created_at)}</p>
                  </div>
                  <div className="order-status">
                    <span className={`status-badge ${order.status}`}>
                      {order.status}
                    </span>
                    <span className={`status-badge ${order.payment_status}`}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-items">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="order-item-preview">
                        <img
                          src={item.product?.images?.[0]?.image_url || '/placeholder-product.jpg'}
                          alt={item.product_name}
                        />
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="order-item-preview more">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="order-summary">
                    <div className="order-total">
                      <span>Total</span>
                      <strong>{formatUSD(order.total_usd)}</strong>
                    </div>
                    <Link 
                      to={`/account/orders/${order.id}`}
                      className="btn btn-outline btn-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  )
}

export default Orders