import React from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Loading from '@/components/common/Loading'
import './AccountLayout.css'

const AccountLayout = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loading fullScreen text="Loading..." />
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${location.pathname}`} replace />
  }

  const navItems = [
    {
      path: '/account',
      label: 'Dashboard',
      icon: 'bi-grid'
    },
    {
      path: '/account/orders',
      label: 'Orders',
      icon: 'bi-box'
    },
    {
      path: '/account/profile',
      label: 'Profile',
      icon: 'bi-person'
    },
    {
      path: '/account/addresses',
      label: 'Addresses',
      icon: 'bi-geo-alt'
    },
    {
      path: '/account/security',
      label: 'Security',
      icon: 'bi-shield-lock'
    }
  ]

  return (
    <div className="account-layout">
      <div className="container">
        <div className="account-wrapper">
          {/* Sidebar */}
          <aside className="account-sidebar">
            <div className="account-sidebar-header">
              <h3>My Account</h3>
            </div>
            <nav className="account-nav">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`account-nav-item ${
                    location.pathname === item.path ? 'active' : ''
                  }`}
                >
                  <i className={`bi ${item.icon}`}></i>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="account-main">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout