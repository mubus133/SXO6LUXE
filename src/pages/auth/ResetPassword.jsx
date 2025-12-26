import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import { validatePassword } from '@/utils/validation'
import toast from 'react-hot-toast'
import './Auth.css'

const ResetPassword = () => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    processResetLink()
  }, [])

  const processResetLink = async () => {
    try {
      console.log('🔍 Processing password reset link...')
      console.log('Full URL:', window.location.href)

      // Extract tokens from URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      console.log('Tokens:', {
        hasAccess: !!accessToken,
        hasRefresh: !!refreshToken,
        type: type
      })

      // Validate we have recovery tokens
      if (!accessToken || !refreshToken) {
        throw new Error('Invalid reset link - missing tokens')
      }

      if (type !== 'recovery') {
        throw new Error('Invalid reset link - wrong type')
      }

      console.log('✅ Valid tokens found, setting session in background...')

      // Set session in background WITHOUT WAITING (to avoid hanging)
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).catch(err => {
        console.error('Session error (non-blocking):', err)
      })

      // Show form immediately (don't wait for session)
      setValidSession(true)
      toast.success('Reset link verified!')

    } catch (error) {
      console.error('❌ Reset link error:', error)
      toast.error(error.message || 'Invalid or expired reset link')
      setTimeout(() => navigate('/forgot-password'), 3000)
    }
  }

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

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else {
      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0]
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    console.log('🔄 Updating password...')

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      })

      if (error) {
        console.error('❌ Password update error:', error)
        throw error
      }

      console.log('✅ Password updated successfully!')
      toast.success('Password updated successfully!')
      
      // Small delay then redirect
      setTimeout(() => {
        navigate('/login?message=password_reset_success')
      }, 2000)
    } catch (error) {
      console.error('❌ Error:', error)
      setErrors({ submit: error.message })
      toast.error('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  // Show loading briefly then show form
  if (!validSession) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="text-center">
              <div className="spinner-border mb-3" role="status" style={{ width: '3rem', height: '3rem', color: '#000' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h1 className="auth-title">Verifying Reset Link</h1>
              <p className="auth-subtitle">Just a moment...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show password reset form
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          {/* Logo */}
          <Link to="/" className="auth-logo">
            SXO6LUXE
          </Link>

          <h1 className="auth-title">Create New Password</h1>
          <p className="auth-subtitle">
            Please enter your new password
          </p>

          {/* Error Message */}
          {errors.submit && (
            <div className="auth-error">
              <i className="bi bi-exclamation-circle me-2"></i>
              {errors.submit}
            </div>
          )}

          {/* Reset Password Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                name="password"
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                autoComplete="new-password"
              />
              {errors.password && (
                <div className="invalid-feedback">{errors.password}</div>
              )}
              <small className="form-text">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <div className="invalid-feedback">{errors.confirmPassword}</div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Updating password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          {/* Back to Login */}
          <p className="auth-footer">
            <Link to="/login">
              <i className="bi bi-arrow-left me-2"></i>
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword