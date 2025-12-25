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
      console.log('🔍 Starting email verification...')
      console.log('Full URL:', window.location.href)
      console.log('Search params:', window.location.search)
      console.log('Hash:', window.location.hash)
      
      // Method 1: Check for tokens in URL hash (Supabase default)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const tokenType = hashParams.get('type')
      const errorCode = hashParams.get('error')
      const errorDescription = hashParams.get('error_description')

      console.log('Hash params:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        type: tokenType,
        error: errorCode
      })

      // Check for error in URL
      if (errorCode) {
        throw new Error(errorDescription || 'Email verification failed')
      }

      // Method 2: Check for token_hash in query params (alternative format)
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      console.log('Query params:', {
        hasTokenHash: !!tokenHash,
        type: type
      })

      // If we have access_token and refresh_token in hash
      if (accessToken && refreshToken) {
        console.log('✅ Found tokens in hash, setting session...')
        
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })

        if (error) {
          console.error('❌ Session error:', error)
          throw error
        }

        console.log('✅ Session set successfully:', data)
        toast.success('Email verified successfully! Welcome to SXO6LUXE!')
        
        // Wait for auth state to update
        setTimeout(() => {
          navigate('/')
        }, 1500)
        return
      }

      // If we have token_hash in query (OTP verification)
      if (tokenHash && type) {
        console.log('✅ Found token_hash in query, verifying OTP...')
        
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type
        })

        if (error) {
          console.error('❌ OTP verification error:', error)
          throw error
        }

        console.log('✅ OTP verified successfully:', data)
        toast.success('Email verified successfully! Welcome to SXO6LUXE!')
        
        setTimeout(() => {
          navigate('/')
        }, 1500)
        return
      }

      // Check if user is already verified and logged in
      const { data: { session } } = await supabase.auth.getSession()
      
      console.log('Current session:', session ? 'Exists' : 'None')

      if (session?.user) {
        console.log('✅ User already verified and logged in')
        toast.success('Email already verified!')
        navigate('/')
        return
      }

      // If we get here, no valid tokens were found
      console.error('❌ No valid tokens found in URL')
      throw new Error('Verification link is invalid or expired. Please request a new verification email.')

    } catch (error) {
      console.error('❌ Verification error:', error)
      setError(error.message || 'Verification failed')
      toast.error(error.message || 'Verification failed')
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