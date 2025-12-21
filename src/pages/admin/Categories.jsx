import React, { useEffect, useState } from 'react'
import { supabase } from '@/config/supabase'
import AdminLayout from '@/components/admin/AdminLayout'
import Loading from '@/components/common/Loading'
import toast from 'react-hot-toast'
import './Admin.css'

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    display_order: 0,
    is_active: true
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Failed to load categories')
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

    // Auto-generate slug
    if (name === 'name' && !editingCategory) {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }

    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name) newErrors.name = 'Category name is required'
    if (!formData.slug) newErrors.slug = 'Slug is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setSaving(true)

    try {
      const categoryData = {
        ...formData,
        display_order: parseInt(formData.display_order) || 0
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id)

        if (error) throw error
        toast.success('Category updated successfully')
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([categoryData])

        if (error) throw error
        toast.success('Category created successfully')
      }

      await loadCategories()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      display_order: category.display_order,
      is_active: category.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (categoryId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error

      toast.success('Category deleted successfully')
      await loadCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category. It may have associated products.')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      display_order: 0,
      is_active: true
    })
    setErrors({})
  }

  if (loading) {
    return (
      <AdminLayout>
        <Loading text="Loading categories..." />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admin-categories">
        {/* Header */}
        <div className="page-header-admin">
          <div>
            <h1>Categories</h1>
            <p>Manage product categories</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Add Category
          </button>
        </div>

        {/* Categories List */}
        {categories.length === 0 ? (
          <div className="admin-section">
            <div className="empty-state-small">
              <i className="bi bi-tags"></i>
              <h3>No categories yet</h3>
              <p>Start by creating your first category</p>
            </div>
          </div>
        ) : (
          <div className="admin-section">
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td>{category.display_order}</td>
                      <td>
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="table-thumbnail"
                          />
                        ) : (
                          <div className="table-thumbnail-placeholder">
                            <i className="bi bi-image"></i>
                          </div>
                        )}
                      </td>
                      <td><strong>{category.name}</strong></td>
                      <td><code>{category.slug}</code></td>
                      <td>
                        <span className="text-truncate-2">
                          {category.description || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${category.is_active ? 'active' : 'inactive'}`}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-action"
                            onClick={() => handleEdit(category)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn-action delete"
                            onClick={() => handleDelete(category.id, category.name)}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <>
            <div className="modal-overlay" onClick={handleCloseModal}></div>
            <div className="modal-container">
              <div className="modal-header">
                <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Category Name *</label>
                  <input
                    type="text"
                    name="name"
                    className={`admin-form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Men's Clothing"
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
                    placeholder="mens-clothing"
                  />
                  {errors.slug && <div className="invalid-feedback d-block">{errors.slug}</div>}
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Description</label>
                  <textarea
                    name="description"
                    className="admin-form-control"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Category description..."
                  ></textarea>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Image URL</label>
                  <input
                    type="url"
                    name="image_url"
                    className="admin-form-control"
                    value={formData.image_url}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Display Order</label>
                  <input
                    type="number"
                    name="display_order"
                    className="admin-form-control"
                    value={formData.display_order}
                    onChange={handleChange}
                    min="0"
                  />
                  <small className="form-text">Lower numbers appear first</small>
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

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleCloseModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>
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
                        {editingCategory ? 'Update' : 'Create'} Category
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default Categories