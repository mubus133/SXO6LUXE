import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import './Auth.css'

const EmailVerification = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [verifying, setVerifying] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        verifyEmail()
    }, [])

    const verifyEmail = async () => {
  try {
    // 1️⃣ Get tokens from hash first
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    let accessToken = hashParams.get('access_token')
    let refreshToken = hashParams.get('refresh_token')
    let type = hashParams.get('type')

    // 2️⃣ If not in hash, check query params (some links have ?token=)
    const queryParams = new URLSearchParams(window.location.search)
    if (!accessToken) {
      accessToken = queryParams.get('access_token') || queryParams.get('token')
    }
    if (!refreshToken) {
      refreshToken = queryParams.get('refresh_token')
    }
    if (!type) {
      type = queryParams.get('type') || 'signup'
    }

    // 3️⃣ If tokens exist, set session
    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
      if (error) throw error
      toast.success('Email verified successfully!')
      setTimeout(() => navigate('/'), 1500)
      return
    }

    // 4️⃣ If token param exists for OTP verification
    const tokenHash = queryParams.get('token_hash')
    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      if (error) throw error
      toast.success('Email verified successfully!')
      setTimeout(() => navigate('/'), 1500)
      return
    }

    // 5️⃣ Check existing session
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      toast.success('Email already verified!')
      navigate('/')
      return
    }

    // 6️⃣ If no token found
    throw new Error('Verification link is invalid or expired.')

  } catch (err) {
    console.error(err)
    setError(err.message || 'Verification failed')
    toast.error(err.message || 'Verification failed')
    setVerifying(false)
  }
}


    if (error) {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-card">
                        <div className="error-icon">
                            <i className="bi bi-x-circle-fill" style={{ fontSize: '48px', color: '#dc3545' }}></i>
                        </div>
                        <h1 className="auth-title">Verification Failed</h1>
                        <p className="auth-subtitle">{error}</p>

                        <div className="mt-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="btn btn-primary w-100 mb-3"
                            >
                                Go to Login
                            </button>

                            <button
                                onClick={() => navigate('/register')}
                                className="btn btn-outline w-100"
                            >
                                Create New Account
                            </button>

                            <p className="auth-footer mt-3">
                                Need help?{' '}
                                <a href="/contact">Contact Support</a>
                            </p>
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
                    <div className="text-center">
                        <div className="spinner-border mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <h1 className="auth-title">Verifying Your Email</h1>
                        <p className="auth-subtitle">
                            Please wait while we verify your email address...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EmailVerification