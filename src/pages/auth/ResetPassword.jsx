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
  const [verifyingLink, setVerifyingLink] = useState(true)
  const [errors, setErrors] = useState({})
  const [validSession, setValidSession] = useState(false)

  useEffect(() => {
    initializeSession()
  }, [])

  const initializeSession = async () => {
    try {
      console.log('🔍 Initializing password reset session...')
      console.log('Full URL:', window.location.href)

      // Extract tokens from URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')
      const error = hashParams.get('error')
      const errorDescription = hashParams.get('error_description')

      console.log('URL params:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        type: type,
        error: error
      })

      // Check for errors in URL
      if (error) {
        console.error('❌ Error in URL:', error, errorDescription)
        throw new Error(errorDescription || 'Password reset link is invalid')
      }

      // Check if this is a recovery link
      if (type !== 'recovery') {
        console.error('❌ Not a recovery link, type:', type)
        throw new Error('Invalid password reset link')
      }

      // Must have both tokens
      if (!accessToken || !refreshToken) {
        console.error('❌ Missing tokens')
        throw new Error('Password reset link is invalid or expired')
      }

      console.log('✅ Valid recovery tokens found, setting session...')

      // Set the session with the recovery tokens
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })

      if (sessionError) {
        console.error('❌ Session error:', sessionError)
        throw sessionError
      }

      console.log('✅ Session set successfully!')
      console.log('User:', data.user?.email)

      // Session is valid, show the form
      setValidSession(true)
      setVerifyingLink(false)

    } catch (error) {
      console.error('❌ Reset link verification error:', error)
      toast.error(error.message || 'Invalid or expired reset link')
      setVerifyingLink(false)
      setValidSession(false)
      
      // Redirect to forgot password after showing error
      setTimeout(() => {
        navigate('/forgot-password')
      }, 3000)
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

      console.log('✅ Password updated successfully')
      toast.success('Password updated successfully!')
      
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

  // Show loading while verifying link
  if (verifyingLink) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="text-center">
              <div className="spinner-border mb-3" role="status" style={{ width: '3rem', height: '3rem', color: '#000' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h1 className="auth-title">Verifying Reset Link</h1>
              <p className="auth-subtitle">
                Please wait while we verify your password reset link...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error if link is invalid
  if (!validSession) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="error-icon">
              <i className="bi bi-x-circle-fill" style={{ fontSize: '48px', color: '#dc3545' }}></i>
            </div>
            <h1 className="auth-title">Invalid Reset Link</h1>
            <p className="auth-subtitle">
              This password reset link is invalid or has expired.
            </p>
            <p className="auth-text">
              Password reset links expire after 1 hour. Please request a new one.
            </p>
            <button
              onClick={() => navigate('/forgot-password')}
              className="btn btn-primary w-100 mt-3"
            >
              Request New Reset Link
            </button>
            <p className="auth-footer mt-3">
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