import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/config/supabase'
import AccountLayout from '@/components/layout/AccountLayout'
import Loading from '@/components/common/Loading'
import toast from 'react-hot-toast'
import './Account.css'

const Addresses = () => {
  const { profile, user } = useAuth()
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [formData, setFormData] = useState({
    address_type: 'shipping',
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_default: false
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile?.id || user?.id) {
      loadAddresses()
    } else {
      setLoading(false)
    }
  }, [profile, user])

  const loadAddresses = async () => {
    try {
      setLoading(true)

      const userId = profile?.id || user?.id
      if (!userId) {
        console.error('No user ID available')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setAddresses(data || [])
    } catch (error) {
      console.error('Error loading addresses:', error)
      toast.error('Failed to load addresses')
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
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const validate = () => {
    const newErrors = {}
    const required = ['full_name', 'phone', 'address_line1', 'city', 'state', 'postal_code', 'country']

    required.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        newErrors[field] = 'This field is required'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setSaving(true)

    try {
      const userId = profile?.id || user?.id
      if (!userId) {
        throw new Error('No user ID available')
      }

      // If setting as default, unset other defaults
      if (formData.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', userId)
          .eq('address_type', formData.address_type)
      }

      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from('addresses')
          .update(formData)
          .eq('id', editingAddress.id)

        if (error) throw error
        toast.success('Address updated successfully')
      } else {
        // Create new address
        const { error } = await supabase
          .from('addresses')
          .insert([{ ...formData, user_id: userId }])

        if (error) throw error
        toast.success('Address added successfully')
      }

      await loadAddresses()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving address:', error)
      toast.error('Failed to save address')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (address) => {
    setEditingAddress(address)
    setFormData({
      address_type: address.address_type,
      full_name: address.full_name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default
    })
    setShowModal(true)
  }

  const handleDelete = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId)

      if (error) throw error

      toast.success('Address deleted successfully')
      await loadAddresses()
    } catch (error) {
      console.error('Error deleting address:', error)
      toast.error('Failed to delete address')
    }
  }

  const handleSetDefault = async (addressId, addressType) => {
    try {
      const userId = profile?.id || user?.id
      if (!userId) return

      // Unset all defaults for this type
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('address_type', addressType)

      // Set this one as default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId)

      if (error) throw error

      toast.success('Default address updated')
      await loadAddresses()
    } catch (error) {
      console.error('Error setting default:', error)
      toast.error('Failed to set default address')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingAddress(null)
    setFormData({
      address_type: 'shipping',
      full_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      is_default: false
    })
    setErrors({})
  }

  if (loading) {
    return (
      <AccountLayout>
        <Loading text="Loading addresses..." />
      </AccountLayout>
    )
  }

  return (
    <AccountLayout>
      <div className="addresses-page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Saved Addresses</h1>
            <p>Manage your shipping and billing addresses</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Add Address
          </button>
        </div>

        {/* Addresses Grid */}
        {addresses.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-geo-alt"></i>
            <h3>No addresses saved</h3>
            <p>Add an address to make checkout faster</p>
          </div>
        ) : (
          <div className="addresses-grid">
            {addresses.map((address) => (
              <div key={address.id} className="address-card">
                {address.is_default && (
                  <span className="default-badge">Default</span>
                )}
                <div className="address-type">
                  <i className={`bi ${address.address_type === 'shipping' ? 'bi-truck' : 'bi-credit-card'}`}></i>
                  <span>{address.address_type === 'shipping' ? 'Shipping' : 'Billing'}</span>
                </div>
                <div className="address-content">
                  <h4>{address.full_name}</h4>
                  <p>{address.address_line1}</p>
                  {address.address_line2 && <p>{address.address_line2}</p>}
                  <p>{address.city}, {address.state} {address.postal_code}</p>
                  <p>{address.country}</p>
                  <p className="address-phone">{address.phone}</p>
                </div>
                <div className="address-actions">
                  {!address.is_default && (
                    <button
                      className="btn-action"
                      onClick={() => handleSetDefault(address.id, address.address_type)}
                      title="Set as default"
                    >
                      <i className="bi bi-star"></i>
                    </button>
                  )}
                  <button
                    className="btn-action"
                    onClick={() => handleEdit(address)}
                    title="Edit"
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button
                    className="btn-action delete"
                    onClick={() => handleDelete(address.id)}
                    title="Delete"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <>
            <div className="modal-overlay" onClick={handleCloseModal}></div>
            <div className="modal-container address-modal">
              <div className="modal-header">
                <h2>{editingAddress ? 'Edit Address' : 'Add New Address'}</h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-group">
                  <label className="form-label">Address Type</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="address_type"
                        value="shipping"
                        checked={formData.address_type === 'shipping'}
                        onChange={handleChange}
                      />
                      <span>Shipping Address</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="address_type"
                        value="billing"
                        checked={formData.address_type === 'billing'}
                        onChange={handleChange}
                      />
                      <span>Billing Address</span>
                    </label>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      name="full_name"
                      className={`form-control ${errors.full_name ? 'is-invalid' : ''}`}
                      value={formData.full_name}
                      onChange={handleChange}
                    />
                    {errors.full_name && (
                      <div className="invalid-feedback">{errors.full_name}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                      value={formData.phone}
                      onChange={handleChange}
                    />
                    {errors.phone && (
                      <div className="invalid-feedback">{errors.phone}</div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label">Address Line 1 *</label>
                    <input
                      type="text"
                      name="address_line1"
                      className={`form-control ${errors.address_line1 ? 'is-invalid' : ''}`}
                      value={formData.address_line1}
                      onChange={handleChange}
                      placeholder="Street address, P.O. box"
                    />
                    {errors.address_line1 && (
                      <div className="invalid-feedback">{errors.address_line1}</div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label">Address Line 2</label>
                    <input
                      type="text"
                      name="address_line2"
                      className="form-control"
                      value={formData.address_line2}
                      onChange={handleChange}
                      placeholder="Apartment, suite, unit, building, floor, etc."
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      name="city"
                      className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                      value={formData.city}
                      onChange={handleChange}
                    />
                    {errors.city && (
                      <div className="invalid-feedback">{errors.city}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">State/Province *</label>
                    <input
                      type="text"
                      name="state"
                      className={`form-control ${errors.state ? 'is-invalid' : ''}`}
                      value={formData.state}
                      onChange={handleChange}
                    />
                    {errors.state && (
                      <div className="invalid-feedback">{errors.state}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Postal Code *</label>
                    <input
                      type="text"
                      name="postal_code"
                      className={`form-control ${errors.postal_code ? 'is-invalid' : ''}`}
                      value={formData.postal_code}
                      onChange={handleChange} />
                    {errors.postal_code && (
                      <div className="invalid-feedback">{errors.postal_code}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Country *</label>
                    <input
                      type="text"
                      name="country"
                      className={`form-control ${errors.country ? 'is-invalid' : ''}`}
                      value={formData.country}
                      onChange={handleChange}
                    />
                    {errors.country && (
                      <div className="invalid-feedback">{errors.country}</div>
                    )}
                  </div>

                  <div className="col-12">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="is_default"
                        name="is_default"
                        checked={formData.is_default}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="is_default">
                        Set as default {formData.address_type} address
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
                        {editingAddress ? 'Update' : 'Save'} Address
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </AccountLayout>
  )
}
export default Addresses