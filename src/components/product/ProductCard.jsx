import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { formatUSD } from '@/utils/currency'
import toast from 'react-hot-toast'
import './ProductCard.css'

const ProductCard = ({ product }) => {
  const { addToCart } = useCart()
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0]
  const secondaryImage = product.images?.[1]

  const hasDiscount = product.compare_at_price_usd && 
    product.compare_at_price_usd > product.price_usd

  const discountPercentage = hasDiscount
    ? Math.round(((product.compare_at_price_usd - product.price_usd) / product.compare_at_price_usd) * 100)
    : 0

  const isLowStock = product.track_inventory && 
    product.inventory_quantity > 0 && 
    product.inventory_quantity <= product.low_stock_threshold

  const isOutOfStock = product.track_inventory && product.inventory_quantity <= 0

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (isOutOfStock) {
      toast.error('Product is out of stock')
      return
    }

    setIsAddingToCart(true)
    const result = await addToCart(product.id, null, 1)
    setIsAddingToCart(false)

    if (!result.success) {
      toast.error('Failed to add to cart')
    }
  }

  return (
    <div className="product-card">
      <Link to={`/product/${product.slug}`} className="product-card-link">
        {/* Image */}
        <div className="product-card-image">
          {!imageLoaded && (
            <div className="product-card-image-skeleton"></div>
          )}
          <img
            src={primaryImage?.image_url || '/placeholder-product.jpg'}
            alt={primaryImage?.alt_text || product.name}
            className={`product-image-primary ${imageLoaded ? 'loaded' : ''}`}
            onLoad={() => setImageLoaded(true)}
          />
          {secondaryImage && (
            <img
              src={secondaryImage.image_url}
              alt={secondaryImage.alt_text || product.name}
              className="product-image-secondary"
            />
          )}

          {/* Badges */}
          <div className="product-badges">
            {product.is_featured && (
              <span className="product-badge featured">Featured</span>
            )}
            {hasDiscount && (
              <span className="product-badge discount">-{discountPercentage}%</span>
            )}
            {isOutOfStock && (
              <span className="product-badge out-of-stock">Out of Stock</span>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="product-badge low-stock">Low Stock</span>
            )}
          </div>

          {/* Quick Add to Cart */}
          {!isOutOfStock && (
            <button
              className="product-quick-add"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? (
                <span>Adding...</span>
              ) : (
                <>
                  <i className="bi bi-bag-plus"></i>
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="product-card-content">
          {/* Category */}
          {product.category && (
            <p className="product-category">{product.category.name}</p>
          )}

          {/* Name */}
          <h3 className="product-name">{product.name}</h3>

          {/* Price */}
          <div className="product-price">
            <span className="price-current">{formatUSD(product.price_usd)}</span>
            {hasDiscount && (
              <span className="price-original">{formatUSD(product.compare_at_price_usd)}</span>
            )}
          </div>

          {/* Colors */}
          {product.variants && product.variants.length > 0 && (
            <div className="product-colors">
              {[...new Set(product.variants.map(v => v.color))].filter(Boolean).slice(0, 5).map((color, index) => (
                <span
                  key={index}
                  className="color-dot"
                  style={{ backgroundColor: color.toLowerCase() }}
                  title={color}
                ></span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}

export default ProductCard