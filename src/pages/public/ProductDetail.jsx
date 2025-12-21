import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchProductBySlug, fetchRelatedProducts } from '@/services/productService'
import { useCart } from '@/context/CartContext'
import { formatUSD } from '@/utils/currency'
import ProductCard from '@/components/product/ProductCard'
import Breadcrumb from '@/components/common/Breadcrumb'
import Loading from '@/components/common/Loading'
import toast from 'react-hot-toast'
import './ProductDetail.css'

const ProductDetail = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    loadProduct()
  }, [slug])

  const loadProduct = async () => {
    try {
      setLoading(true)

      const { data, error } = await fetchProductBySlug(slug)

      if (error || !data) {
        toast.error('Product not found')
        navigate('/shop')
        return
      }

      setProduct(data)

      // Load related products
      if (data.category_id) {
        const relatedResult = await fetchRelatedProducts(
          data.id,
          data.category_id,
          4
        )
        if (relatedResult.data) {
          setRelatedProducts(relatedResult.data)
        }
      }
    } catch (error) {
      console.error('Error loading product:', error)
      toast.error('Error loading product')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (isOutOfStock) {
      toast.error('Product is out of stock')
      return
    }

    setAddingToCart(true)
    const result = await addToCart(product.id, selectedVariant?.id, quantity)
    setAddingToCart(false)

    if (result.success) {
      // Success message handled by cart context
    }
  }

  const handleBuyNow = async () => {
    if (isOutOfStock) {
      toast.error('Product is out of stock')
      return
    }

    setAddingToCart(true)
    const result = await addToCart(product.id, selectedVariant?.id, quantity)
    setAddingToCart(false)

    if (result.success) {
      navigate('/cart')
    }
  }

  if (loading) {
    return <Loading fullScreen text="Loading product..." />
  }

  if (!product) {
    return null
  }

  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0]
  const hasDiscount = product.compare_at_price_usd && 
    product.compare_at_price_usd > product.price_usd
  const discountPercentage = hasDiscount
    ? Math.round(((product.compare_at_price_usd - product.price_usd) / product.compare_at_price_usd) * 100)
    : 0

  const currentPrice = selectedVariant?.price_adjustment_usd
    ? product.price_usd + selectedVariant.price_adjustment_usd
    : product.price_usd

  const isLowStock = product.track_inventory && 
    product.inventory_quantity > 0 && 
    product.inventory_quantity <= product.low_stock_threshold

  const isOutOfStock = product.track_inventory && product.inventory_quantity <= 0

  // Get unique sizes and colors
  const availableSizes = [...new Set(product.variants?.map(v => v.size).filter(Boolean))]
  const availableColors = [...new Set(product.variants?.map(v => v.color).filter(Boolean))]

  const breadcrumbItems = [
    { label: 'Shop', path: '/shop' },
    { label: product.category?.name || 'Products', path: `/shop/${product.category?.slug}` },
    { label: product.name }
  ]

  return (
    <div className="product-detail-page">
      <div className="container">
        <Breadcrumb items={breadcrumbItems} />

        <div className="product-detail-content">
          <div className="row g-5">
            {/* Product Images */}
            <div className="col-lg-6">
              <div className="product-images">
                {/* Main Image */}
                <div className="main-image">
                  <img
                    src={product.images?.[selectedImage]?.image_url || '/placeholder-product.jpg'}
                    alt={product.images?.[selectedImage]?.alt_text || product.name}
                  />
                  {hasDiscount && (
                    <span className="discount-badge">-{discountPercentage}%</span>
                  )}
                  {isOutOfStock && (
                    <span className="stock-badge out-of-stock">Out of Stock</span>
                  )}
                  {isLowStock && !isOutOfStock && (
                    <span className="stock-badge low-stock">Only {product.inventory_quantity} left</span>
                  )}
                </div>

                {/* Thumbnail Images */}
                {product.images && product.images.length > 1 && (
                  <div className="thumbnail-images">
                    {product.images.map((image, index) => (
                      <button
                        key={image.id}
                        className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                        onClick={() => setSelectedImage(index)}
                      >
                        <img src={image.image_url} alt={image.alt_text || product.name} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="col-lg-6">
              <div className="product-info">
                {/* Category */}
                {product.category && (
                  <p className="product-category">{product.category.name}</p>
                )}

                {/* Name */}
                <h1 className="product-name">{product.name}</h1>

                {/* Price */}
                <div className="product-price">
                  <span className="price-current">{formatUSD(currentPrice)}</span>
                  {hasDiscount && (
                    <span className="price-original">{formatUSD(product.compare_at_price_usd)}</span>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <div className="product-description">
                    <p>{product.description}</p>
                  </div>
                )}

                {/* Variants */}
                {availableSizes.length > 0 && (
                  <div className="product-variant-group">
                    <label className="variant-label">Size</label>
                    <div className="variant-options">
                      {availableSizes.map((size) => (
                        <button
                          key={size}
                          className={`variant-option ${selectedVariant?.size === size ? 'active' : ''}`}
                          onClick={() => {
                            const variant = product.variants.find(v => v.size === size)
                            setSelectedVariant(variant)
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {availableColors.length > 0 && (
                  <div className="product-variant-group">
                    <label className="variant-label">Color</label>
                    <div className="variant-options color-options">
                      {availableColors.map((color) => (
                        <button
                          key={color}
                          className={`variant-option color-option ${selectedVariant?.color === color ? 'active' : ''}`}
                          onClick={() => {
                            const variant = product.variants.find(v => v.color === color)
                            setSelectedVariant(variant)
                          }}
                          style={{ backgroundColor: color.toLowerCase() }}
                          title={color}
                        >
                          <span className="sr-only">{color}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="product-quantity-group">
                  <label className="quantity-label">Quantity</label>
                  <div className="quantity-controls">
                    <button
                      className="quantity-btn"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <i className="bi bi-dash"></i>
                    </button>
                    <input
                      type="number"
                      className="quantity-input"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                    />
                    <button
                      className="quantity-btn"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="product-actions">
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleAddToCart}
                    disabled={addingToCart || isOutOfStock}
                  >
                    {addingToCart ? (
                      <span>Adding...</span>
                    ) : isOutOfStock ? (
                      <span>Out of Stock</span>
                    ) : (
                      <>
                        <i className="bi bi-bag-plus me-2"></i>
                        Add to Cart
                      </>
                    )}
                  </button>

                  <button
                    className="btn btn-gold btn-lg"
                    onClick={handleBuyNow}
                    disabled={addingToCart || isOutOfStock}
                  >
                    Buy Now
                  </button>
                </div>

                {/* Product Meta */}
                <div className="product-meta">
                  {product.sku && (
                    <div className="meta-item">
                      <span className="meta-label">SKU:</span>
                      <span className="meta-value">{product.sku}</span>
                    </div>
                  )}
                  {product.category && (
                    <div className="meta-item">
                      <span className="meta-label">Category:</span>
                      <span className="meta-value">{product.category.name}</span>
                    </div>
                  )}
                  {product.track_inventory && (
                    <div className="meta-item">
                      <span className="meta-label">Availability:</span>
                      <span className={`meta-value ${isOutOfStock ? 'text-danger' : 'text-success'}`}>
                        {isOutOfStock ? 'Out of Stock' : `${product.inventory_quantity} in stock`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="product-features">
                  <div className="feature-item">
                    <i className="bi bi-shield-check"></i>
                    <span>Secure Payment</span>
                  </div>
                  <div className="feature-item">
                    <i className="bi bi-truck"></i>
                    <span>Free Shipping over $200</span>
                  </div>
                  <div className="feature-item">
                    <i className="bi bi-arrow-repeat"></i>
                    <span>30-Day Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="related-products-section">
            <h2 className="section-title">You May Also Like</h2>
            <div className="row g-4">
              {relatedProducts.map((relatedProduct) => (
                <div key={relatedProduct.id} className="col-lg-3 col-md-6">
                  <ProductCard product={relatedProduct} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default ProductDetail