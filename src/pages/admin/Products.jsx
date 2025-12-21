import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import { formatUSD } from '@/utils/currency'
import AdminLayout from '@/components/admin/AdminLayout'
import Loading from '@/components/common/Loading'
import toast from 'react-hot-toast'
import './Admin.css'

const Products = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      // Load products with category info
      const { data: productsData, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          images:product_images(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCategories(categoriesData || [])
      setProducts(productsData || [])
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      toast.success('Product deleted successfully')
      await loadData()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }

  const handleToggleStatus = async (productId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId)

      if (error) throw error

      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'}`)
      await loadData()
    } catch (error) {
      console.error('Error updating product status:', error)
      toast.error('Failed to update product status')
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(filters.search.toLowerCase())
    const matchesCategory = !filters.category || product.category_id === filters.category
    const matchesStatus = !filters.status || 
                         (filters.status === 'active' && product.is_active) ||
                         (filters.status === 'inactive' && !product.is_active)

    return matchesSearch && matchesCategory && matchesStatus
  })

  if (loading) {
    return (
      <AdminLayout>
        <Loading text="Loading products..." />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admin-products">
        {/* Header */}
        <div className="page-header-admin">
          <div>
            <h1>Products</h1>
            <p>Manage your product catalog</p>
          </div>
          <Link to="/admin/products/new" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2"></i>
            Add Product
          </Link>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <div className="filter-input">
            <input
              type="text"
              name="search"
              className="admin-form-control"
              placeholder="Search products..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>
          <select
            name="category"
            className="admin-form-control"
            value={filters.category}
            onChange={handleFilterChange}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            name="status"
            className="admin-form-control"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Products Table */}
        {filteredProducts.length === 0 ? (
          <div className="admin-section">
            <div className="empty-state-small">
              <i className="bi bi-box-seam"></i>
              <h3>No products found</h3>
              <p>Start by adding your first product</p>
              <Link to="/admin/products/new" className="btn btn-primary mt-3">
                Add Product
              </Link>
            </div>
          </div>
        ) : (
          <div className="admin-section">
            <div className="products-grid">
              {filteredProducts.map((product) => {
                const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0]

                return (
                  <div key={product.id} className="product-card-admin">
                    <div className="product-image-admin">
                      {primaryImage ? (
                        <img src={primaryImage.image_url} alt={product.name} />
                      ) : (
                        <div className="no-image">
                          <i className="bi bi-image"></i>
                        </div>
                      )}
                      {!product.is_active && (
                        <span className="inactive-badge">Inactive</span>
                      )}
                      {product.is_featured && (
                        <span className="featured-badge">Featured</span>
                      )}
                    </div>

                    <div className="product-info-admin">
                      <h3>{product.name}</h3>
                      {product.category && (
                        <p className="product-category-admin">{product.category.name}</p>
                      )}
                      <div className="product-meta-admin">
                        <span className="product-price-admin">{formatUSD(product.price_usd)}</span>
                        {product.track_inventory && (
                          <span className={`stock-badge ${product.inventory_quantity <= product.low_stock_threshold ? 'low' : ''}`}>
                            Stock: {product.inventory_quantity}
                          </span>
                        )}
                      </div>
                      {product.sku && (
                        <p className="product-sku-admin">SKU: {product.sku}</p>
                      )}
                    </div>

                    <div className="product-actions-admin">
                      <Link
                        to={`/admin/products/${product.id}`}
                        className="btn btn-outline btn-sm"
                      >
                        <i className="bi bi-pencil me-1"></i>
                        Edit
                      </Link>
                      <button
                        className={`btn btn-sm ${product.is_active ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => handleToggleStatus(product.id, product.is_active)}
                      >
                        <i className={`bi ${product.is_active ? 'bi-eye-slash' : 'bi-eye'} me-1`}></i>
                        {product.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(product.id, product.name)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="admin-summary">
          <p>Showing {filteredProducts.length} of {products.length} products</p>
        </div>
      </div>
    </AdminLayout>
  )
}

export default Products