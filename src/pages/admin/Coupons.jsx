import React, { useEffect, useState } from 'react'
import { supabase } from '@/config/supabase'
import { formatDate } from '@/utils/date'
import AdminLayout from '@/components/admin/AdminLayout'
import Loading from '@/components/common/Loading'
import toast from 'react-hot-toast'
import './Admin.css'

const Coupons = () => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    minimum_purchase_usd: '',
    maximum_discount_usd: '',
    usage_limit: '',
    valid_from: '',
    valid_until: '',
    is_active: true
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCoupons(data || [])
    } catch (error) {
      console.error('Error loading coupons:', error)
      toast.error('Failed to load coupons')
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

    // Auto-uppercase coupon code
    if (name === 'code') {
      setFormData(prev => ({ ...prev, code: value.toUpperCase() }))
    }

    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.code) newErrors.code = 'Coupon code is required'
    if (!formData.discount_value || formData.discount_value <= 0) {
      newErrors.discount_value = 'Valid discount value is required'
    }

    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      newErrors.discount_value = 'Percentage cannot exceed 100'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setSaving(true)

    try {
      const couponData = {
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        minimum_purchase_usd: formData.minimum_purchase_usd ? parseFloat(formData.minimum_purchase_usd) : 0,
        maximum_discount_usd: formData.maximum_discount_usd ? parseFloat(formData.maximum_discount_usd) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null
      }

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id)

        if (error) throw error
        toast.success('Coupon updated successfully')
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert([couponData])

        if (error) throw error
        toast.success('Coupon created successfully')
      }

      await loadCoupons()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving coupon:', error)
      if (error.code === '23505') {
        toast.error('Coupon code already exists')
      } else {
        toast.error('Failed to save coupon')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      minimum_purchase_usd: coupon.minimum_purchase_usd || '',
      maximum_discount_usd: coupon.maximum_discount_usd || '',
      usage_limit: coupon.usage_limit || '',
      valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : '',
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
      is_active: coupon.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (couponId, couponCode) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${couponCode}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId)

      if (error) throw error

      toast.success('Coupon deleted successfully')
      await loadCoupons()
    } catch (error) {
      console.error('Error deleting coupon:', error)
      toast.error('Failed to delete coupon')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCoupon(null)
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      minimum_purchase_usd: '',
      maximum_discount_usd: '',
      usage_limit: '',
      valid_from: '',
      valid_until: '',
      is_active: true
    })
    setErrors({})
  }

  if (loading) {
    return (
      <AdminLayout>
        <Loading text="Loading coupons..." />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admin-coupons">
        {/* Header */}
        <div className="page-header-admin">
          <div>
            <h1>Coupons</h1>
            <p>Manage discount coupons</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Create Coupon
          </button>
        </div>

        {/* Coupons Table */}
        {coupons.length === 0 ? (
          <div className="admin-section">
            <div className="empty-state-small">
              <i className="bi bi-ticket-perforated"></i>
              <h3>No coupons yet</h3>
              <p>Create your first discount coupon</p>
            </div>
          </div>
        ) : (
          <div className="admin-section">
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Usage</th>
                    <th>Valid Period</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td>
                        <strong className="coupon-code">{coupon.code}</strong>
                      </td>
                      <td>
                        <span className="badge-type">
                          {coupon.discount_type === 'percentage' ? 'Percentage' : 'Fixed'}
                        </span>
                      </td>
                      <td>
                        <strong>
                          {coupon.discount_type === 'percentage' 
                            ? `${coupon.discount_value}%` 
                            : `$${coupon.discount_value}`
                          }
                        </strong>
                      </td>
                      <td>
                        {coupon.usage_count || 0}
                        {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                      </td>
                      <td>
                        {coupon.valid_from && coupon.valid_until ? (
                          <div className="date-range">
                            <div>{formatDate(coupon.valid_from)}</div>
                            <div className="text-muted-small">to</div>
                            <div>{formatDate(coupon.valid_until)}</div>
                          </div>
                        ) : (
                          'No expiry'
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${coupon.is_active ? 'active' : 'inactive'}`}>
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-action"
                            onClick={() => handleEdit(coupon)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn-action delete"
                            onClick={() => handleDelete(coupon.id, coupon.code)}
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
            <div className="modal-container modal-large">
              <div className="modal-header">
                <h2>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="admin-form-label">Coupon Code *</label>
                    <input
                      type="text"
                      name="code"
                      className={`admin-form-control ${errors.code ? 'is-invalid' : ''}`}
                      value={formData.code}
                      onChange={handleChange}
                      placeholder="SAVE20"
                      style={{ textTransform: 'uppercase' }}
                    />
                    {errors.code && <div className="invalid-feedback d-block">{errors.code}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="admin-form-label">Discount Type *</label>
                    <select
                      name="discount_type"
                      className="admin-form-control"
                      value={formData.discount_type}
                      onChange={handleChange}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed_usd">Fixed Amount (USD)</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="admin-form-label">Discount Value *</label>
                    <input
                      type="number"
                      name="discount_value"
                      className={`admin-form-control ${errors.discount_value ? 'is-invalid' : ''}`}
                      value={formData.discount_value}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder={formData.discount_type === 'percentage' ? '20' : '50.00'}
                    />
                    {errors.discount_value && <div className="invalid-feedback d-block">{errors.discount_value}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="admin-form-label">Minimum Purchase (USD)</label>
                    <input
                      type="number"
                      name="minimum_purchase_usd"
                      className="admin-form-control"
                      value={formData.minimum_purchase_usd}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                  </div>

                  {formData.discount_type === 'percentage' && (
                    <div className="col-md-6">
                      <label className="admin-form-label">Maximum Discount (USD)</label>
                      <input
                        type="number"
                        name="maximum_discount_usd"
                        className="admin-form-control"
                        value={formData.maximum_discount_usd}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        placeholder="No limit"
                      />
                    </div>
                  )}

                  <div className="col-md-6">
                    <label className="admin-form-label">Usage Limit</label>
                    <input
                      type="number"
                      name="usage_limit"
                      className="admin-form-control"
                      value={formData.usage_limit}
                      onChange={handleChange}
                      min="0"
                      placeholder="Unlimited"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="admin-form-label">Valid From</label>
                    <input
                      type="date"
                      name="valid_from"
                      className="admin-form-control"
                      value={formData.valid_from}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="admin-form-label">Valid Until</label>
                    <input
                      type="date"
                      name="valid_until"
                      className="admin-form-control"
                      value={formData.valid_until}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12">
                    <label className="admin-form-label">Description</label>
                    <textarea
                      name="description"
                      className="admin-form-control"
                      rows="3"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Optional description for internal use"
                    ></textarea>
                  </div>

                  <div className="col-12">
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
                        Active (coupon can be used)
                      </label>
                    </div>
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
                        {editingCoupon ? 'Update' : 'Create'} Coupon
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

export default Coupons