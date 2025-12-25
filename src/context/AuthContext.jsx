import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/config/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session ? 'Found' : 'Not found')
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setIsAdmin(false)
          setLoading(false)
        }

        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          console.log('✅ User signed in')
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out')
        } else if (event === 'USER_UPDATED') {
          console.log('🔄 User updated')
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      if (!userId) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          const { data: userData } = await supabase.auth.getUser()
          if (userData?.user) {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: userData.user.id,
                  email: userData.user.email,
                  full_name: userData.user.user_metadata?.full_name || '',
                  is_admin: false
                }
              ])
              .select()
              .single()

            if (!createError && newProfile) {
              setProfile(newProfile)
              setIsAdmin(newProfile?.is_admin || false)
            }
          }
        }
      } else if (data) {
        setProfile(data)
        setIsAdmin(data?.is_admin || false)
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`,
          data: {
            full_name: fullName
          }
        }
      })

      if (error) throw error

      // Create profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              full_name: fullName,
              is_admin: false
            }
          ])

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }
      }

      toast.success('Account created! Please check your email to verify.')
      return { data, error: null }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error(error.message)
      return { data: null, error }
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      toast.success('Welcome back!')
      return { data, error: null }
    } catch (error) {
      toast.error(error.message)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setSession(null)
      setProfile(null)
      setIsAdmin(false)
      
      toast.success('Signed out successfully')
      return { error: null }
    } catch (error) {
      toast.error(error.message)
      return { error }
    }
  }

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const updateProfile = async (updates) => {
    try {
      if (!user?.id) {
        throw new Error('No user logged in')
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      // Refresh profile
      await fetchProfile(user.id)
      
      toast.success('Profile updated successfully')
      return { error: null }
    } catch (error) {
      console.error('Update profile error:', error)
      toast.error(error.message)
      return { error }
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    isAdmin,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}