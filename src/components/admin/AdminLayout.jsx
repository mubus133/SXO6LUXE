import React, { useState } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Loading from '@/components/common/Loading'
import './AdminLayout.css'

const AdminLayout = ({ children }) => {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) {
    return <Loading fullScreen text="Loading..." />
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />
  }

  const navItems = [
    {
      path: '/admin',
      label: 'Dashboard',
      icon: 'bi-speedometer2'
    },
    {
      path: '/admin/products',
      label: 'Products',
      icon: 'bi-box-seam'
    },
    {
      path: '/admin/categories',
      label: 'Categories',
      icon: 'bi-tags'
    },
    {
      path: '/admin/orders',
      label: 'Orders',
      icon: 'bi-cart-check'
    },
    {
      path: '/admin/customers',
      label: 'Customers',
      icon: 'bi-people'
    },
    {
      path: '/admin/coupons',
      label: 'Coupons',
      icon: 'bi-ticket-perforated'
    }
  ]

  const currentPage = navItems.find(item => item.path === location.pathname)

  return (
    <div className="admin-layout">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <Link to="/" className="admin-logo">
            SXO6LUXE
          </Link>
          <span className="admin-badge">Admin</span>
          <button 
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-item ${
                location.pathname === item.path ? 'active' : ''
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="btn btn-outline w-100">
            <i className="bi bi-arrow-left me-2"></i>
            Back to Store
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-content">
            <div className="admin-header-left">
              <button 
                className="mobile-menu-toggle"
                onClick={() => setSidebarOpen(true)}
              >
                <i className="bi bi-list"></i>
              </button>
              <h2 className="admin-page-title">
                {currentPage?.label || 'Admin'}
              </h2>
            </div>
            <div className="admin-header-actions">
              <Link to="/account" className="admin-user-menu">
                <i className="bi bi-person-circle"></i>
                <span className="user-menu-text">My Account</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout