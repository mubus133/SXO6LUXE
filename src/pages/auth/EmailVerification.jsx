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
      
      // Get token from URL
      const token = searchParams.get('token')
      const type = searchParams.get('type')
      
      console.log('Token:', token)
      console.log('Type:', type)

      // Check if we have a hash with access_token (Supabase sends it this way)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      console.log('Access Token from hash:', accessToken ? 'Found' : 'Not found')

      if (accessToken && refreshToken) {
        // Set the session with the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })

        if (error) {
          console.error('❌ Session error:', error)
          throw error
        }

        console.log('✅ Email verified successfully')
        toast.success('Email verified successfully! Welcome to SXO6LUXE!')
        
        // Wait a moment for auth state to update
        setTimeout(() => {
          navigate('/')
        }, 2000)
      } else {
        // If no tokens in hash, check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('✅ Already verified and logged in')
          toast.success('Email already verified!')
          navigate('/')
        } else {
          throw new Error('Verification link is invalid or expired. Please request a new verification email.')
        }
      }
    } catch (error) {
      console.error('❌ Verification error:', error)
      setError(error.message)
      toast.error(error.message)
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
                className="btn btn-primary w-100"
              >
                Go to Login
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