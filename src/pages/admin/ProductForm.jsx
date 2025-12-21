import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import AdminLayout from '@/components/admin/AdminLayout'
import ImageUpload from '@/components/admin/ImageUpload'
import Loading from '@/components/common/Loading'
import toast from 'react-hot-toast'
import './Admin.css'

const ProductForm = () => {
  const { productId } = useParams()
  const navigate = useNavigate()
  const isEditing = !!productId

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState([])
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category_id: '',
    price_usd: '',
    compare_at_price_usd: '',
    cost_usd: '',
    sku: '',
    barcode: '',
    track_inventory: true,
    inventory_quantity: 0,
    low_stock_threshold: 5,
    is_featured: false,
    is_active: true,
    meta_title: '',
    meta_description: ''
  })

  const [variants, setVariants] = useState([])
  const [newVariant, setNewVariant] = useState({
    size: '',
    color: '',
    sku: '',
    price_adjustment_usd: 0,
    inventory_quantity: 0
  })

  const [imageUrls, setImageUrls] = useState([''])
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadCategories()
    if (isEditing) {
      loadProduct()
    }
  }, [productId])

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadProduct = async () => {
    try {
      setLoading(true)

      const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(*),
          variants:product_variants(*)
        `)
        .eq('id', productId)
        .single()

      if (productError) throw productError

      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        category_id: product.category_id || '',
        price_usd: product.price_usd,
        compare_at_price_usd: product.compare_at_price_usd || '',
        cost_usd: product.cost_usd || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        track_inventory: product.track_inventory,
        inventory_quantity: product.inventory_quantity,
        low_stock_threshold: product.low_stock_threshold,
        is_featured: product.is_featured,
        is_active: product.is_active,
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || ''
      })

      if (product.images && product.images.length > 0) {
        setImageUrls(product.images.map(img => img.image_url))
      }

      if (product.variants && product.variants.length > 0) {
        setVariants(product.variants)
      }
    } catch (error) {
      console.error('Error loading product:', error)
      toast.error('Failed to load product')
      navigate('/admin/products')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })

    // Auto-generate slug from name
    if (name === 'name' && !isEditing) {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }

    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const handleImageUrlChange = (index, value) => {
    const newUrls = [...imageUrls]
    newUrls[index] = value
    setImageUrls(newUrls)
  }

  const addImageUrl = () => {
    setImageUrls([...imageUrls, ''])
  }

  const removeImageUrl = (index) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index))
  }

  const handleVariantChange = (e) => {
    const { name, value } = e.target
    setNewVariant({
      ...newVariant,
      [name]: value
    })
  }

  const addVariant = () => {
    if (!newVariant.size && !newVariant.color) {
      toast.error('Please provide at least size or color')
      return
    }

    setVariants([...variants, { ...newVariant, id: Date.now() }])
    setNewVariant({
      size: '',
      color: '',
      sku: '',
      price_adjustment_usd: 0,
      inventory_quantity: 0
    })
  }

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name) newErrors.name = 'Product name is required'
    if (!formData.slug) newErrors.slug = 'Slug is required'
    if (!formData.price_usd || formData.price_usd <= 0) {
      newErrors.price_usd = 'Valid price is required'
    }
    if (!formData.category_id) newErrors.category_id = 'Category is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
  e.preventDefault()

  if (!validate()) {
    toast.error('Please fix the errors')
    return
  }

  setSaving(true)

  try {
    const productData = {
      ...formData,
      price_usd: parseFloat(formData.price_usd),
      compare_at_price_usd: formData.compare_at_price_usd ? parseFloat(formData.compare_at_price_usd) : null,
      cost_usd: formData.cost_usd ? parseFloat(formData.cost_usd) : null,
      inventory_quantity: parseInt(formData.inventory_quantity) || 0,
      low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
      // IMPORTANT FIX: Make SKU optional if empty
      sku: formData.sku ? formData.sku : null,
      barcode: formData.barcode ? formData.barcode : null
    }

    let productIdToUse = productId

    if (isEditing) {
      // Update product
      const { error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId)

      if (updateError) {
        // Handle specific errors
        if (updateError.code === '23505') {
          if (updateError.message.includes('sku')) {
            toast.error('A product with this SKU already exists. Please use a different SKU.')
          } else if (updateError.message.includes('slug')) {
            toast.error('A product with this slug already exists. Please use a different name.')
          } else {
            toast.error('This product information already exists.')
          }
          setSaving(false)
          return
        }
        throw updateError
      }

      // Delete existing images
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId)

      // Delete existing variants
      await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', productId)

    } else {
      // Create product
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single()

      if (insertError) {
        // Handle specific errors
        if (insertError.code === '23505') {
          if (insertError.message.includes('sku')) {
            toast.error('A product with this SKU already exists. Please use a different SKU or leave it empty.')
          } else if (insertError.message.includes('slug')) {
            toast.error('A product with this slug already exists. Please use a different product name.')
          } else {
            toast.error('This product information already exists.')
          }
          setSaving(false)
          return
        }
        throw insertError
      }
      productIdToUse = newProduct.id
    }

    // Insert images
    const validImages = imageUrls.filter(url => url.trim() !== '')
    if (validImages.length > 0) {
      const imageData = validImages.map((url, index) => ({
        product_id: productIdToUse,
        image_url: url,
        is_primary: index === 0,
        display_order: index
      }))

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imageData)

      if (imagesError) {
        console.error('Error inserting images:', imagesError)
        toast.error('Product saved but failed to add some images')
      }
    }

    // Insert variants
    if (variants.length > 0) {
      const variantData = variants.map(variant => ({
        product_id: productIdToUse,
        size: variant.size || null,
        color: variant.color || null,
        sku: variant.sku || null,
        price_adjustment_usd: parseFloat(variant.price_adjustment_usd) || 0,
        inventory_quantity: parseInt(variant.inventory_quantity) || 0,
        is_active: true
      }))

      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(variantData)

      if (variantsError) {
        console.error('Error inserting variants:', variantsError)
        toast.error('Product saved but failed to add some variants')
      }
    }

    toast.success(`Product ${isEditing ? 'updated' : 'created'} successfully`)
    navigate('/admin/products')
  } catch (error) {
    console.error('Error saving product:', error)
    toast.error('Failed to save product. Please try again.')
  } finally {
    setSaving(false)
  }
}

  if (loading) {
    return (
      <AdminLayout>
        <Loading text="Loading product..." />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="product-form-page">
        {/* Header */}
        <div className="page-header-admin">
          <h1>{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            {/* Main Content */}
            <div className="col-lg-8">
              {/* Basic Information */}
              <div className="admin-card mb-4">
                <h2 className="card-title">Basic Information</h2>

                <div className="admin-form-group">
                  <label className="admin-form-label">Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    className={`admin-form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Premium Cotton T-Shirt"
                  />
                  {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Slug *</label>
                  <input
                    type="text"
                    name="slug"
                    className={`admin-form-control ${errors.slug ? 'is-invalid' : ''}`}
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="premium-cotton-t-shirt"
                  />
                  {errors.slug && <div className="invalid-feedback d-block">{errors.slug}</div>}
                  <small className="form-text">URL-friendly version of the name</small>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Description</label>
                  <textarea
                    name="description"
                    className="admin-form-control"
                    rows="5"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Detailed product description..."
                  ></textarea>
                </div>
              </div>

              {/* Pricing */}
              <div className="admin-card mb-4">
                <h2 className="card-title">Pricing</h2>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="admin-form-label">Price (USD) *</label>
                    <input
                      type="number"
                      name="price_usd"
                      className={`admin-form-control ${errors.price_usd ? 'is-invalid' : ''}`}
                      value={formData.price_usd}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                    />
                    {errors.price_usd && <div className="invalid-feedback d-block">{errors.price_usd}</div>}
                  </div>

                  <div className="col-md-4">
                    <label className="admin-form-label">Compare at Price</label>
                    <input
                      type="number"
                      name="compare_at_price_usd"
                      className="admin-form-control"
                      value={formData.compare_at_price_usd}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                    />
                    <small className="form-text">Original price for discounts</small>
                  </div>

                  <div className="col-md-4">
                    <label className="admin-form-label">Cost</label>
                    <input
                      type="number"
                      name="cost_usd"
                      className="admin-form-control"
                      value={formData.cost_usd}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                    />
                    <small className="form-text">Cost per item</small>
                  </div>
                </div>
              </div>

              {/* Inventory */}
              <div className="admin-card mb-4">
                <h2 className="card-title">Inventory</h2>

                <div className="admin-form-group">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="track_inventory"
                      name="track_inventory"
                      checked={formData.track_inventory}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="track_inventory">
                      Track inventory quantity
                    </label>
                  </div>
                </div>

                {formData.track_inventory && (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="admin-form-label">Quantity</label>
                      <input
                        type="number"
                        name="inventory_quantity"
                        className="admin-form-control"
                        value={formData.inventory_quantity}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="admin-form-label">Low Stock Threshold</label>
                      <input
                        type="number"
                        name="low_stock_threshold"
                        className="admin-form-control"
                        value={formData.low_stock_threshold}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>
                  </div>
                )}

                <div className="row g-3 mt-3">
                  <div className="col-md-6">
                    <label className="admin-form-label">SKU</label>
                    <input
                      type="text"
                      name="sku"
                      className="admin-form-control"
                      value={formData.sku}
                      onChange={handleChange}
                      placeholder="STOCK-KEEPING-UNIT"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="admin-form-label">Barcode</label>
                    <input
                      type="text"
                      name="barcode"
                      className="admin-form-control"
                      value={formData.barcode}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Product Images */}
              <div className="admin-card mb-4">
  <h2 className="card-title">Product Images</h2>
  <ImageUpload 
    images={imageUrls}
    setImages={setImageUrls}
  />
</div>

              {/* Variants */}
              <div className="admin-card mb-4">
                <h2 className="card-title">Product Variants</h2>
                
                {variants.length > 0 && (
                  <div className="variants-list mb-3">
                    {variants.map((variant, index) => (
                      <div key={variant.id || index} className="variant-item">
                        <div className="variant-info">
                          {variant.size && <span className="variant-badge">Size: {variant.size}</span>}
                          {variant.color && <span className="variant-badge">Color: {variant.color}</span>}
                          {variant.sku && <span className="variant-sku">SKU: {variant.sku}</span>}
                          <span className="variant-price">
                            Adjustment: ${variant.price_adjustment_usd || 0}
                          </span>
                          <span className="variant-stock">Stock: {variant.inventory_quantity}</span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeVariant(index)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="variant-form">
                  <div className="row g-3">
                    <div className="col-md-3">
                      <input
                        type="text"
                        name="size"
                        className="admin-form-control"
                        value={newVariant.size}
                        onChange={handleVariantChange}
                        placeholder="Size (e.g., M)"
                      />
                    </div>
                    <div className="col-md-3">
                      <input
                        type="text"
                        name="color"
                        className="admin-form-control"
                        value={newVariant.color}
                        onChange={handleVariantChange}
                        placeholder="Color"
                      />
                    </div>
                    <div className="col-md-2">
                      <input
                        type="text"
                        name="sku"
                        className="admin-form-control"
                        value={newVariant.sku}
                        onChange={handleVariantChange}
                        placeholder="SKU"
                      />
                    </div>
                    <div className="col-md-2">
                      <input
                        type="number"
                        name="price_adjustment_usd"
                        className="admin-form-control"
                        value={newVariant.price_adjustment_usd}
                        onChange={handleVariantChange}
                        placeholder="Price +"
                        step="0.01"
                      />
                    </div>
                    <div className="col-md-1">
                      <input
                        type="number"
                        name="inventory_quantity"
                        className="admin-form-control"
                        value={newVariant.inventory_quantity}
                        onChange={handleVariantChange}
                        placeholder="Qty"
                        min="0"
                      />
                    </div>
                    <div className="col-md-1">
                      <button
                        type="button"
                        className="btn btn-primary w-100"
                        onClick={addVariant}
                      >
                        <i className="bi bi-plus-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEO */}
              <div className="admin-card mb-4">
                <h2 className="card-title">SEO</h2>

                <div className="admin-form-group">
                  <label className="admin-form-label">Meta Title</label>
                  <input
                    type="text"
                    name="meta_title"
                    className="admin-form-control"
                    value={formData.meta_title}
                    onChange={handleChange}
                    placeholder="SEO title"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Meta Description</label>
                  <textarea
                    name="meta_description"
                    className="admin-form-control"
                    rows="3"
                    value={formData.meta_description}
                    onChange={handleChange}
                    placeholder="SEO description"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              {/* Status */}
              <div className="admin-card mb-4">
                <h2 className="card-title">Status</h2>

                <div className="admin-form-group">
                  <label className="admin-form-label">Category *</label>
                  <select
                name="category_id"
                className={`admin-form-control ${errors.category_id ? 'is-invalid' : ''}`}
                value={formData.category_id}
                onChange={handleChange}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.category_id && <div className="invalid-feedback d-block">{errors.category_id}</div>}
            </div>

            <div className="admin-form-group">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="is_active">
                  Active (visible in store)
                </label>
              </div>
            </div>

            <div className="admin-form-group">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="is_featured"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="is_featured">
                  Featured product
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="admin-card">
            <div className="btn-group-vertical">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-2"></i>
                    {isEditing ? 'Update Product' : 'Create Product'}
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate('/admin/products')}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</AdminLayout>
)
}
export default ProductForm