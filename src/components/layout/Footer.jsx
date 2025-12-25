import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="row g-4">
            {/* Brand Column */}
            <div className="col-lg-4 col-md-6">
              <h3 className="footer-brand">SXO6LUXE</h3>
              <p className="footer-description">
                Redefining luxury fashion with timeless elegance and contemporary style.
                Experience premium quality and exclusive designs.
              </p>
              <div className="footer-social">
                <a href="#" className="social-link" aria-label="Instagram">
                  <i className="bi bi-instagram"></i>
                </a>
                <a href="#" className="social-link" aria-label="Facebook">
                  <i className="bi bi-facebook"></i>
                </a>
                <a href="#" className="social-link" aria-label="Twitter">
                  <i className="bi bi-twitter"></i>
                </a>
                <a href="#" className="social-link" aria-label="Pinterest">
                  <i className="bi bi-pinterest"></i>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="col-lg-2 col-md-6">
              <h4 className="footer-heading">Shop</h4>
              <ul className="footer-links">
                <li><Link to="/shop">All Products</Link></li>
                <li><Link to="/shop/men">Men</Link></li>
                <li><Link to="/shop/women">Women</Link></li>
                <li><Link to="/shop/accessories">Accessories</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div className="col-lg-2 col-md-6">
              <h4 className="footer-heading">Company</h4>
              <ul className="footer-links">
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/contact">Contact</Link></li>
                <li><Link to="/faq">FAQ</Link></li>
                <li><Link to="/careers">Careers</Link></li>
              </ul>
            </div>

            {/* Customer Service */}
            <div className="col-lg-2 col-md-6">
              <h4 className="footer-heading">Support</h4>
              <ul className="footer-links">
                <li><Link to="/account/orders">Track Order</Link></li>
                <li><Link to="/returns">Returns</Link></li>
                <li><Link to="/shipping">Shipping Info</Link></li>
                <li><Link to="/size-guide">Size Guide</Link></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="col-lg-2 col-md-6">
              <h4 className="footer-heading">Newsletter</h4>
              <p className="footer-newsletter-text">
                Subscribe for exclusive offers and updates
              </p>
              <form className="footer-newsletter-form">
                <input
                  type="email"
                  placeholder="Your email"
                  required
                />
                <button type="submit" aria-label="Subscribe">
                  <i className="bi bi-arrow-right"></i>
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="footer-copyright">
              © {currentYear} SXO6LUXE. All rights reserved.
            </p>
            <div className="footer-legal-links">
              <Link to="/privacy">Privacy Policy</Link>
              {/* <Link to="/terms">Terms & Conditions</Link>
              <Link to="/cookies">Cookie Policy</Link> */}
            </div>
            <div className="footer-payment-methods">
              <i className="bi bi-credit-card"></i>
              <span>Secure Payment via Paystack</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer