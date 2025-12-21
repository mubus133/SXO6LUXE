import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/config/supabase'
import { validatePassword } from '@/utils/validation'
import { formatDateTime } from '@/utils/date'
import AccountLayout from '@/components/layout/AccountLayout'
import toast from 'react-hot-toast'
import './Account.css'

const Security = () => {
  const { updatePassword, profile, user } = useAuth()
  const [activities, setActivities] = useState([])
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  useEffect(() => {
    loadActivities()
  }, [profile])

  const loadActivities = async () => {
    if (!profile?.id) return

    try {
      // Get real activity from admin_logs if available
      const { data } = await supabase
        .from('admin_logs')
        .select('*')
        .eq('admin_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (data && data.length > 0) {
        setActivities(data.map(log => ({
          icon: log.action.includes('login') ? 'bi-box-arrow-in-right' : 
                log.action.includes('password') ? 'bi-lock' : 'bi-gear',
          title: log.action,
          time: formatDateTime(log.created_at)
        })))
      } else {
        // Show user registration and last login
        setActivities([
          {
            icon: 'bi-box-arrow-in-right',
            title: 'Recent login',
            time: 'Today'
          },
          {
            icon: 'bi-person-plus',
            title: 'Account created',
            time: formatDateTime(profile?.created_at || user?.created_at)
          }
        ])
      }
    } catch (error) {
      console.error('Error loading activities:', error)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    })
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else {
      const passwordValidation = validatePassword(formData.newPassword)
      if (!passwordValidation.isValid) {
        newErrors.newPassword = passwordValidation.errors[0]
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (formData.currentPassword && formData.newPassword && 
        formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    const { error } = await updatePassword(formData.newPassword)
    setLoading(false)

    if (!error) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      // Log activity
      await logActivity('Password changed')
      // Reload activities
      await loadActivities()
    }
  }

  const logActivity = async (action) => {
    try {
      if (profile?.is_admin) {
        await supabase
          .from('admin_logs')
          .insert([{
            admin_id: profile.id,
            action,
            entity_type: 'user',
            entity_id: profile.id
          }])
      }
    } catch (error) {
      console.error('Error logging activity:', error)
    }
  }

  return (
    <AccountLayout>
      <div className="security-page">
        {/* Header */}
        <div className="page-header">
          <h1>Security Settings</h1>
          <p>Manage your password and account security</p>
        </div>

        {/* Change Password */}
        <div className="security-section">
          <h2 className="section-title">Change Password</h2>
          <form onSubmit={handleSubmit} className="security-form">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div className="password-input-group">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  className={`form-control ${errors.currentPassword ? 'is-invalid' : ''}`}
                  value={formData.currentPassword}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  <i className={`bi ${showPasswords.current ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
              {errors.currentPassword && (
                <div className="invalid-feedback d-block">{errors.currentPassword}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="password-input-group">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                  value={formData.newPassword}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  <i className={`bi ${showPasswords.new ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
              {errors.newPassword && (
                <div className="invalid-feedback d-block">{errors.newPassword}</div>
              )}
              <small className="form-text">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div className="password-input-group">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  <i className={`bi ${showPasswords.confirm ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="invalid-feedback d-block">{errors.confirmPassword}</div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Updating password...
                </>
              ) : (
                <>
                  <i className="bi bi-shield-check me-2"></i>
                  Update Password
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Tips */}
        <div className="security-section">
          <h2 className="section-title">Security Tips</h2>
          <div className="security-tips">
            <div className="security-tip">
              <i className="bi bi-check-circle-fill"></i>
              <div>
                <h4>Use a strong password</h4>
                <p>Mix uppercase, lowercase, numbers, and special characters</p>
              </div>
            </div>
            <div className="security-tip">
              <i className="bi bi-check-circle-fill"></i>
              <div>
                <h4>Don't reuse passwords</h4>
                <p>Use a unique password for each account</p>
              </div>
            </div>
            <div className="security-tip">
              <i className="bi bi-check-circle-fill"></i>
              <div>
                <h4>Change regularly</h4>
                <p>Update your password every 3-6 months</p>
              </div>
            </div>
            <div className="security-tip">
              <i className="bi bi-check-circle-fill"></i>
              <div>
                <h4>Enable email notifications</h4>
                <p>Get alerts for account activity and changes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Activity */}
        <div className="security-section">
          <h2 className="section-title">Recent Activity</h2>
          <div className="activity-list">
            {activities.length === 0 ? (
              <p className="text-muted-small">No recent activity</p>
            ) : (
              activities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <i className={`bi ${activity.icon}`}></i>
                  <div className="activity-content">
                    <h4>{activity.title}</h4>
                    <p>{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AccountLayout>
  )
}

export default Security