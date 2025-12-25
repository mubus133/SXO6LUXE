import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'

// Layout Components
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'

// Public Pages
import Home from './pages/public/Home'
import Shop from './pages/public/Shop'
import ProductDetail from './pages/public/ProductDetail'
import Cart from './pages/public/Cart'
import Checkout from './pages/public/Checkout'
import OrderConfirmation from './pages/public/OrderConfirmation'
import About from './pages/public/About'
import Contact from './pages/public/Contact'
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy'


// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// Account Pages
import Dashboard from './pages/account/Dashboard'
import Orders from './pages/account/Orders'
import OrderDetail from './pages/account/OrderDetail'
import Profile from './pages/account/Profile'
import Addresses from './pages/account/Addresses'
import Security from './pages/account/Security'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import Products from './pages/admin/Products'
import ProductForm from './pages/admin/ProductForm'
import Categories from './pages/admin/Categories'
import AdminOrders from './pages/admin/AdminOrders'
import AdminOrderDetail from './pages/admin/AdminOrderDetail'
import Customers from './pages/admin/Customers'
import Coupons from './pages/admin/Coupons'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#333',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#d4af37',
                  secondary: '#fff',
                },
              },
            }}
          />

          <Routes>
            {/* Public Routes with Header/Footer */}
            <Route path="/" element={<><Header /><Home /><Footer /></>} />
            <Route path="/shop" element={<><Header /><Shop /><Footer /></>} />
            <Route path="/shop/:categorySlug" element={<><Header /><Shop /><Footer /></>} />
            <Route path="/product/:slug" element={<><Header /><ProductDetail /><Footer /></>} />
            <Route path="/cart" element={<><Header /><Cart /><Footer /></>} />
            <Route path="/checkout" element={<><Header /><Checkout /><Footer /></>} />
            <Route path="/order/confirmation/:orderId" element={<><Header /><OrderConfirmation /><Footer /></>} />
            <Route path="/about" element={<><Header /><About /><Footer /></>} />
            <Route path="/contact" element={<><Header /><Contact /><Footer /></>} />
            <Route path="/privacy" element={<PrivacyPolicy />} />

            {/* Auth Routes (No Header/Footer) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Account Routes with Header/Footer */}
            <Route path="/account" element={<><Header /><Dashboard /><Footer /></>} />
            <Route path="/account/orders" element={<><Header /><Orders /><Footer /></>} />
            <Route path="/account/orders/:orderId" element={<><Header /><OrderDetail /><Footer /></>} />
            <Route path="/account/profile" element={<><Header /><Profile /><Footer /></>} />
            <Route path="/account/addresses" element={<><Header /><Addresses /><Footer /></>} />
            <Route path="/account/security" element={<><Header /><Security /><Footer /></>} />

            {/* Admin Routes (No Header/Footer - has own layout) */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<Products />} />
            <Route path="/admin/products/new" element={<ProductForm />} />
            <Route path="/admin/products/:productId" element={<ProductForm />} />
            <Route path="/admin/categories" element={<Categories />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/orders/:orderId" element={<AdminOrderDetail />} />
            <Route path="/admin/customers" element={<Customers />} />
            <Route path="/admin/coupons" element={<Coupons />} />

            {/* 404 */}
            <Route path="*" element={<><Header /><div style={{minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><h1>404 - Page Not Found</h1></div><Footer /></>} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App