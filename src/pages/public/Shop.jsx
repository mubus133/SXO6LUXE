import React, { useEffect, useState } from 'react'
import { useSearchParams, useParams } from 'react-router-dom'
import { fetchAllProducts, fetchProductsByCategory } from '@/services/productService'
import { fetchAllCategories } from '@/services/categoryService'
import ProductCard from '@/components/product/ProductCard'
import Breadcrumb from '@/components/common/Breadcrumb'
import Loading from '@/components/common/Loading'
import './Shop.css'

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { categorySlug } = useParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filteredProducts, setFilteredProducts] = useState([])
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(categorySlug || 'all')
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadData()
  }, [categorySlug])

  useEffect(() => {
    applyFilters()
  }, [products, selectedCategory, priceRange, sortBy, searchParams])

  const loadData = async () => {
    try {
      setLoading(true)

      const [categoriesResult] = await Promise.all([
        fetchAllCategories()
      ])

      if (categoriesResult.data) {
        setCategories(categoriesResult.data)
      }

      // Fetch products based on category
      let productsResult
      if (categorySlug) {
        productsResult = await fetchProductsByCategory(categorySlug)
      } else {
        productsResult = await fetchAllProducts()
      }

      if (productsResult.data) {
        setProducts(productsResult.data)
      }
    } catch (error) {
      console.error('Error loading shop data:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...products]

    // Search filter
    const searchQuery = searchParams.get('search')
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Price filter
    filtered = filtered.filter(product =>
      product.price_usd >= priceRange[0] && product.price_usd <= priceRange[1]
    )

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price_usd - b.price_usd)
        break
      case 'price-high':
        filtered.sort((a, b) => b.price_usd - a.price_usd)
        break
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        break
    }

    setFilteredProducts(filtered)
  }

  const handleCategoryChange = (slug) => {
    setSelectedCategory(slug)
    if (slug === 'all') {
      window.location.href = '/shop'
    } else {
      window.location.href = `/shop/${slug}`
    }
  }

  const breadcrumbItems = categorySlug
    ? [
        { label: 'Shop', path: '/shop' },
        { label: categories.find(c => c.slug === categorySlug)?.name || categorySlug }
      ]
    : [{ label: 'Shop' }]

  if (loading) {
    return <Loading fullScreen text="Loading products..." />
  }

  return (
    <div className="shop-page">
      <div className="container">
        <Breadcrumb items={breadcrumbItems} />

        <div className="shop-header">
          <div>
            <h1 className="shop-title">
              {categorySlug
                ? categories.find(c => c.slug === categorySlug)?.name || 'Shop'
                : 'All Products'}
            </h1>
            <p className="shop-count">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </p>
          </div>

          <div className="shop-actions">
            <button
              className="filter-toggle-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              <i className="bi bi-funnel"></i>
              Filters
            </button>

            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>

        <div className="shop-content">
          {/* Sidebar Filters */}
          <aside className={`shop-sidebar ${showFilters ? 'show' : ''}`}>
            <div className="sidebar-header">
              <h3>Filters</h3>
              <button
                className="sidebar-close"
                onClick={() => setShowFilters(false)}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            {/* Categories */}
            <div className="filter-group">
              <h4 className="filter-title">Categories</h4>
              <ul className="filter-list">
                <li>
                  <button
                    className={`filter-option ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => handleCategoryChange('all')}
                  >
                    All Products
                  </button>
                </li>
                {categories.map((category) => (
                  <li key={category.id}>
                    <button
                      className={`filter-option ${selectedCategory === category.slug ? 'active' : ''}`}
                      onClick={() => handleCategoryChange(category.slug)}
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price Range */}
            <div className="filter-group">
              <h4 className="filter-title">Price Range</h4>
              <div className="price-range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                  className="price-input"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="price-input"
                />
              </div>
            </div>

            {/* Reset Filters */}
            <button
              className="btn btn-outline w-100"
              onClick={() => {
                setPriceRange([0, 1000])
                setSortBy('newest')
                setSearchParams({})
              }}
            >
              Reset Filters
            </button>
          </aside>

          {/* Products Grid */}
          <div className="shop-products">
            {filteredProducts.length === 0 ? (
              <div className="no-products">
                <i className="bi bi-inbox"></i>
                <h3>No Products Found</h3>
                <p>Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="row g-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="col-lg-4 col-md-6">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Overlay */}
      {showFilters && (
        <div
          className="filter-overlay"
          onClick={() => setShowFilters(false)}
        ></div>
      )}
    </div>
  )
}

export default Shop