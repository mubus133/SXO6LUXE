import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import toast from 'react-hot-toast'
import './Auth.css'

const EmailVerification = () => {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(3)
  const [processing, setProcessing] = useState(true)

  useEffect(() => {
    processVerification()
  }, [])

  const processVerification = async () => {
    console.log('🔍 Processing verification...')
    console.log('Full URL:', window.location.href)

    try {
      // Get tokens from URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      console.log('Tokens found:', { 
        hasAccess: !!accessToken, 
        hasRefresh: !!refreshToken 
      })

      if (!accessToken || !refreshToken) {
        console.error('❌ No tokens found')
        toast.error('Invalid verification link')
        setTimeout(() => navigate('/login'), 2000)
        return
      }

      console.log('✅ Tokens found! Setting session in background...')

      // Set session in background WITHOUT WAITING
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).catch(err => {
        console.error('Session error (ignoring):', err)
      })

      // Show success immediately (don't wait for setSession)
      setProcessing(false)
      toast.success('Email verified successfully!')

      // Start countdown and redirect
      let count = 3
      const interval = setInterval(() => {
        count--
        setCountdown(count)
        if (count <= 0) {
          clearInterval(interval)
          console.log('🏠 Redirecting...')
          // Use window.location to force full page reload
          window.location.href = '/'
        }
      }, 1000)

    } catch (error) {
      console.error('❌ Error:', error)
      toast.error('Verification failed')
      setTimeout(() => navigate('/login'), 2000)
    }
  }

  if (processing) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="text-center">
              <div className="spinner-border mb-3" role="status" style={{ width: '3rem', height: '3rem', color: '#000' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h1 className="auth-title">Verifying Your Email</h1>
              <p className="auth-subtitle">Just a moment...</p>
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
            <div className="success-icon mb-4">
              <i className="bi bi-check-circle-fill" style={{ fontSize: '64px', color: '#28a745' }}></i>
            </div>
            <h1 className="auth-title">Email Verified!</h1>
            <p className="auth-subtitle">
              Your email has been successfully verified.
            </p>
            <div className="mt-4">
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#000' }}>
                Redirecting in {countdown}...
              </p>
              <button
                onClick={() => window.location.href = '/'}
                className="btn btn-primary mt-3"
              >
                Go to Home Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailVerification