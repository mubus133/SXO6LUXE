import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchFeaturedProducts } from '@/services/productService'
import { fetchAllCategories } from '@/services/categoryService'
import ProductCard from '@/components/product/ProductCard'
import Loading from '@/components/common/Loading'
import './Home.css'

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHomeData()
  }, [])

  const loadHomeData = async () => {
    try {
      setLoading(true)
      
      const [productsResult, categoriesResult] = await Promise.all([
        fetchFeaturedProducts(8),
        fetchAllCategories()
      ])

      if (productsResult.data) {
        setFeaturedProducts(productsResult.data)
      }

      if (categoriesResult.data) {
        setCategories(categoriesResult.data)
      }
    } catch (error) {
      console.error('Error loading home data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loading fullScreen text="Loading SXO6LUXE..." />
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Redefine Your Style
          </h1>
          <p className="hero-subtitle">
            Discover luxury fashion that speaks to your elegance
          </p>
          <Link to="/shop" className="btn btn-primary hero-cta">
            Shop Collection
          </Link>
        </div>
        <div className="hero-scroll-indicator">
          <span>Scroll</span>
          <i className="bi bi-arrow-down"></i>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">
              Curated collections for every occasion
            </p>
          </div>

          <div className="row g-4">
            {categories.map((category) => (
              <div key={category.id} className="col-lg-4 col-md-6">
                <Link 
                  to={`/shop/${category.slug}`} 
                  className="category-card"
                >
                  <div className="category-image">
                    <img 
                      src={category.image_url || '/placeholder-category.jpg'} 
                      alt={category.name}
                    />
                    <div className="category-overlay">
                      <h3 className="category-name">{category.name}</h3>
                      <span className="category-link-text">
                        Explore Collection
                        <i className="bi bi-arrow-right ms-2"></i>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Featured Collection</h2>
            <p className="section-subtitle">
              Handpicked pieces that define luxury
            </p>
          </div>

          <div className="row g-4">
            {featuredProducts.map((product) => (
              <div key={product.id} className="col-lg-3 col-md-4 col-sm-6">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          <div className="text-center mt-5">
            <Link to="/shop" className="btn btn-outline">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Brand Story */}
      <section className="brand-story-section">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <div className="brand-story-image">
                <img 
                  src="/hero-image.png"
                  alt="SXO6LUXE Brand Story"
                />
              </div>
            </div>
            <div className="col-lg-6">
              <div className="brand-story-content">
                <h2 className="brand-story-title">
                  Crafted with Precision, Worn with Pride
                </h2>
                <p className="brand-story-text">
                  At SXO6LUXE, we believe fashion is more than clothing—it's an expression 
                  of individuality and sophistication. Each piece in our collection is 
                  carefully curated to embody timeless elegance and contemporary flair.
                </p>
                <p className="brand-story-text">
                  From premium fabrics to meticulous craftsmanship, we ensure every detail 
                  reflects our commitment to luxury and quality. Experience fashion that 
                  transcends trends and celebrates your unique style.
                </p>
                <Link to="/about" className="btn btn-gold mt-3">
                  Our Story
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-3 col-md-6">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="bi bi-truck"></i>
                </div>
                <h4 className="feature-title">Free Shipping</h4>
                <p className="feature-text">
                  On orders over $200
                </p>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="bi bi-arrow-repeat"></i>
                </div>
                <h4 className="feature-title">Easy Returns</h4>
                <p className="feature-text">
                  30-day return policy
                </p>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="bi bi-shield-check"></i>
                </div>
                <h4 className="feature-title">Secure Payment</h4>
                <p className="feature-text">
                  Protected transactions
                </p>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="bi bi-headset"></i>
                </div>
                <h4 className="feature-title">24/7 Support</h4>
                <p className="feature-text">
                  We're here to help
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <h2 className="newsletter-title">Stay in the Loop</h2>
            <p className="newsletter-text">
              Subscribe for exclusive offers, style tips, and early access to new collections
            </p>
            <form className="newsletter-form">
              <input
                type="email"
                placeholder="Enter your email"
                required
              />
              <button type="submit" className="btn btn-primary">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home