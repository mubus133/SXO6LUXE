import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import './Header.css'

const Header = () => {
  const { user, isAdmin, signOut } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
      setIsSearchOpen(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className={`header ${isScrolled ? 'header-scrolled' : ''}`}>
      <div className="container">
        <div className="header-wrapper">
          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <i className={`bi ${isMobileMenuOpen ? 'bi-x' : 'bi-list'}`}></i>
          </button>

          {/* Logo */}
          <Link to="/" className="header-logo">
            SXO6LUXE
          </Link>

          {/* Main Navigation */}
          <nav className={`header-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <Link to="/" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
              Home
            </Link>
            <Link to="/shop" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
              Shop
            </Link>
            <Link to="/shop/men" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
              Men
            </Link>
            <Link to="/shop/women" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
              Women
            </Link>
            <Link to="/shop/accessories" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
              Accessories
            </Link>
            <Link to="/about" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
              About
            </Link>
            <Link to="/contact" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
              Contact
            </Link>
          </nav>

          {/* Header Actions */}
          <div className="header-actions">
            {/* Search */}
            <button
              className="header-action-btn"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Search"
            >
              <i className="bi bi-search"></i>
            </button>

            {/* Account */}
            <div className="header-account-dropdown">
              <button className="header-action-btn" aria-label="Account">
                <i className="bi bi-person"></i>
              </button>
              <div className="account-dropdown-menu">
                {user ? (
                  <>
                    <Link to="/account" className="dropdown-item">
                      <i className="bi bi-person-circle me-2"></i>
                      My Account
                    </Link>
                    <Link to="/account/orders" className="dropdown-item">
                      <i className="bi bi-box me-2"></i>
                      Orders
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="dropdown-item">
                        <i className="bi bi-shield-lock me-2"></i>
                        Admin Dashboard
                      </Link>
                    )}
                    <hr className="dropdown-divider" />
                    <button onClick={handleSignOut} className="dropdown-item">
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="dropdown-item">
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Sign In
                    </Link>
                    <Link to="/register" className="dropdown-item">
                      <i className="bi bi-person-plus me-2"></i>
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Cart */}
            <Link to="/cart" className="header-action-btn cart-btn" aria-label="Cart">
              <i className="bi bi-bag"></i>
              {itemCount > 0 && (
                <span className="cart-badge">{itemCount}</span>
              )}
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="header-search">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button type="submit" aria-label="Search">
                <i className="bi bi-search"></i>
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Close search"
              >
                <i className="bi bi-x"></i>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </header>
  )
}

export default Header