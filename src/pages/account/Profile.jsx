import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import AccountLayout from '@/components/layout/AccountLayout'
import toast from 'react-hot-toast'
import './Account.css'

const Profile = () => {
  const { profile, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    nationality: profile?.nationality || ''
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      })
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.full_name || formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters'
    }

    if (formData.phone && formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    const { error } = await updateProfile(formData)
    setLoading(false)

    if (!error) {
      setEditing(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      nationality: profile?.nationality || ''
    })
    setErrors({})
    setEditing(false)
  }

  return (
    <AccountLayout>
      <div className="profile-page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Profile Settings</h1>
            <p>Manage your personal information</p>
          </div>
          {!editing && (
            <button
              className="btn btn-primary"
              onClick={() => setEditing(true)}
            >
              <i className="bi bi-pencil me-2"></i>
              Edit Profile
            </button>
          )}
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="profile-form">
          {/* Email (Read-only) */}
          <div className="form-section">
            <h3 className="form-section-title">Account Information</h3>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={profile?.email || ''}
                disabled
              />
              <small className="form-text">
                Email cannot be changed. Contact support if you need to update your email.
              </small>
            </div>
          </div>

          {/* Personal Information */}
          <div className="form-section">
            <h3 className="form-section-title">Personal Information</h3>
            
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                name="full_name"
                className={`form-control ${errors.full_name ? 'is-invalid' : ''}`}
                value={formData.full_name}
                onChange={handleChange}
                disabled={!editing || loading}
                placeholder="John Doe"
              />
              {errors.full_name && (
                <div className="invalid-feedback">{errors.full_name}</div>
              )}
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!editing || loading}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && (
                  <div className="invalid-feedback">{errors.phone}</div>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label">Nationality</label>
                <select
                  name="nationality"
                  className="form-control"
                  value={formData.nationality}
                  onChange={handleChange}
                  disabled={!editing || loading}
                >
                  <option value="">Select Nationality</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Ghana">Ghana</option>
                  <option value="South Africa">South Africa</option>
                  <option value="Kenya">Kenya</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Account Stats */}
          <div className="form-section">
            <h3 className="form-section-title">Account Statistics</h3>
            <div className="profile-stats">
              <div className="profile-stat">
                <i className="bi bi-calendar-check"></i>
                <div>
                  <p className="stat-label">Member Since</p>
                  <p className="stat-value">
                    {new Date(profile?.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="profile-stat">
                <i className="bi bi-shield-check"></i>
                <div>
                  <p className="stat-label">Account Status</p>
                  <p className="stat-value">
                    <span className="status-badge active">Active</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          {editing && (
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-2"></i>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </AccountLayout>
  )
}

export default Profile