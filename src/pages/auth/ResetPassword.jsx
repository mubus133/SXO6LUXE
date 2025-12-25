import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { validatePassword } from '@/utils/validation'
import toast from 'react-hot-toast'
import './Auth.css'

const ResetPassword = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { updatePassword, session } = useAuth()

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [validSession, setValidSession] = useState(false)

  // Check if we have a valid password recovery session
  useEffect(() => {
    checkSession()
  }, [session])

  const checkSession = () => {
    // Check for access_token in URL hash (Supabase sends it this way)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')

    console.log('🔍 Checking reset session:', {
      hasSession: !!session,
      hasToken: !!accessToken,
      type: type
    })

    // Check if we have a password recovery token
    if (type === 'recovery' && accessToken) {
      console.log('✅ Valid password recovery session detected')
      setValidSession(true)
    } else if (session) {
      console.log('✅ Valid user session detected')
      setValidSession(true)
    } else {
      console.log('❌ No valid session found')
      toast.error('Invalid or expired reset link. Please request a new one.')
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

    const { error } = await updatePassword(formData.password)
    setLoading(false)

    if (error) {
      console.error('❌ Password update error:', error)
      setErrors({ submit: error.message })
      toast.error('Failed to update password')
    } else {
      console.log('✅ Password updated successfully')
      toast.success('Password updated successfully!')
      setTimeout(() => {
        navigate('/login?message=password_reset_success')
      }, 2000)
    }
  }

  if (!validSession) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Verifying reset link...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

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