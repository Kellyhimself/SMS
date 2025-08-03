import { supabase } from '@/lib/supabase/client'
import { createServerSupabaseClient } from '@/lib/supabase/config'
import { schoolService } from './school.service'
import type { AuthResponse, LoginCredentials, RegisterCredentials, School, User } from '@/types/auth'
import { getDB } from '@/lib/indexeddb/client'
import bcrypt from 'bcryptjs'

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Try online login first
    if (navigator.onLine) {
      console.log('🔐 Attempting online login...')
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })

        if (error) throw error

        if (!data.session) {
          throw new Error('No session created')
        }

        console.log('✅ Online login successful - Session created')

        // Get authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('Failed to get authenticated user')

        console.log('✅ User authenticated successfully')

        const { data: userData, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (dbError) throw dbError

        const school = await schoolService.getById(userData.school_id)

        // Store auth state in IndexedDB
        const now = new Date().toISOString()
        const db = await getDB()
        await db.put('auth_state', {
          id: 'current',
          user_id: userData.id,
          school_id: userData.school_id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          created_at: now,
          updated_at: now,
          last_sync_at: now,
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at || Date.now() + 3600 * 1000,
          },
          school: {
            id: school.id,
            name: school.name,
            email: school.email,
            subscription_plan: school.subscription_plan,
            verification_status: school.verification_status,
            created_at: school.createdAt ? new Date(school.createdAt).toISOString() : now,
            updated_at: school.updatedAt ? new Date(school.updatedAt).toISOString() : now,
          }
        })

        console.log('✅ Auth state stored in IndexedDB')

        // Store hashed credentials for offline use
        const passwordHash = await bcrypt.hash(credentials.password, 10)
        await db.put('offline_credentials', {
          id: userData.id,
          email: credentials.email,
          password_hash: passwordHash,
          created_at: now,
          updated_at: now
        })

        console.log('✅ Offline credentials stored with hashed password')

        return {
          user: userData as User,
          school,
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          },
        }
      } catch (error) {
        console.error('❌ Online login failed:', error)
        throw error
      }
    }

    // Offline login - check IndexedDB
    console.log('🔐 Attempting offline login...')
    const db = await getDB()
    const authState = await db.get('auth_state', 'current')
    const offlineCreds = await db.get('offline_credentials', credentials.email)
    
    if (!authState || !offlineCreds) {
      console.error('❌ No offline credentials found')
      throw new Error('No offline credentials found. Please login while online first.')
    }

    // Verify stored credentials match
    const isValidPassword = await bcrypt.compare(credentials.password, offlineCreds.password_hash)
    if (!isValidPassword) {
      console.error('❌ Invalid offline credentials')
      throw new Error('Invalid credentials')
    }

    console.log('✅ Offline login successful - Credentials verified')

    // Return stored auth state
    return {
      user: {
        id: authState.user_id,
        email: authState.email,
        name: authState.name,
        role: authState.role as 'admin' | 'teacher' | 'parent' | 'accountant',
        school_id: authState.school_id,
        createdAt: new Date(authState.created_at),
        updatedAt: new Date(authState.updated_at)
      },
      school: {
        id: authState.school.id,
        name: authState.school.name,
        email: authState.school.email,
        subscription_plan: authState.school.subscription_plan as 'core' | 'premium',
        verification_status: authState.school.verification_status as 'pending' | 'verified' | 'rejected',
        createdAt: new Date(authState.school.created_at),
        updatedAt: new Date(authState.school.updated_at),
      },
      session: {
        access_token: authState.session.access_token,
        refresh_token: authState.session.refresh_token,
      },
    }
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    // Use the API route for registration to handle server-side operations
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Registration failed')
    }

    const data = await response.json()

    // Store auth state in IndexedDB
    const now = new Date().toISOString()
    const db = await getDB()
    await db.put('auth_state', {
      id: 'current',
      user_id: data.user.id,
      school_id: data.user.school_id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role,
      created_at: now,
      updated_at: now,
      last_sync_at: now,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
      },
      school: {
        id: data.school.id,
        name: data.school.name,
        email: data.school.email,
        subscription_plan: data.school.subscription_plan,
        verification_status: data.school.verification_status,
        created_at: now,
        updated_at: now
      }
    })

    // Store hashed credentials for offline use
    const passwordHash = await bcrypt.hash(credentials.password, 10)
    await db.put('offline_credentials', {
      id: data.user.id,
      email: credentials.email,
      password_hash: passwordHash,
      created_at: now,
      updated_at: now
    })

    return data
  },

  async getCurrentUser(): Promise<{ user: User; school: School } | null> {
    if (!navigator.onLine) {
      const db = await getDB()
      const authState = await db.get('auth_state', 'current')
      if (authState) {
        return {
          user: {
            id: authState.user_id,
            email: authState.email,
            name: authState.name,
            role: authState.role as 'admin' | 'teacher' | 'parent' | 'accountant',
            school_id: authState.school_id,
            createdAt: new Date(authState.created_at),
            updatedAt: new Date(authState.updated_at)
          },
          school: {
            id: authState.school.id,
            name: authState.school.name,
            email: authState.school.email,
            subscription_plan: authState.school.subscription_plan as 'core' | 'premium',
            verification_status: authState.school.verification_status as 'pending' | 'verified' | 'rejected',
            createdAt: new Date(authState.school.created_at),
            updatedAt: new Date(authState.school.updated_at),
          }
        }
      }
      return null
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return null

    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (dbError) throw dbError

    const school = await schoolService.getById(userData.school_id)

    // Update IndexedDB with latest data
    const now = new Date().toISOString()
    const db = await getDB()
    await db.put('auth_state', {
      id: 'current',
      user_id: userData.id,
      school_id: userData.school_id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      created_at: now,
      updated_at: now,
      last_sync_at: now,
      session: {
        access_token: userData.session?.access_token || '',
        refresh_token: userData.session?.refresh_token || '',
        expires_at: Date.now() + 3600 * 1000,
      },
      school: {
        id: school.id,
        name: school.name,
        email: school.email,
        subscription_plan: school.subscription_plan,
        verification_status: school.verification_status,
        created_at: school.createdAt ? new Date(school.createdAt).toISOString() : now,
        updated_at: school.updatedAt ? new Date(school.updatedAt).toISOString() : now,
      }
    })

    return {
      user: userData as User,
      school,
    }
  },

  async logout(): Promise<void> {
    if (navigator.onLine) {
      await supabase.auth.signOut()
    }
    
    // Clear auth state and offline credentials from IndexedDB
    const db = await getDB()
    await db.delete('auth_state', 'current')
    
    // Clear all offline credentials
    const tx = db.transaction('offline_credentials', 'readwrite')
    const store = tx.objectStore('offline_credentials')
    await store.clear()
    await tx.done
  },

  async validateSession(): Promise<boolean> {
    if (!navigator.onLine) {
      // When offline, we can't validate against the server
      // Return true to allow offline access
      return true
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return false
      }

      // Check if user still exists in database
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (dbError || !userData) {
        return false
      }

      // Check if school still exists
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('id')
        .eq('id', userData.school_id)
        .single()

      if (schoolError || !schoolData) {
        return false
      }

      return true
    } catch (error) {
      console.error('Session validation error:', error)
      return false
    }
  },

  async syncAuthState(): Promise<void> {
    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline')
    }

    const db = await getDB()
    const authState = await db.get('auth_state', 'current')
    
    if (!authState) {
      throw new Error('No auth state to sync')
    }

    // Verify session is still valid
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      throw new Error('Invalid session')
    }

    // Update user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authState.user_id)
      .single()

    if (userError) throw userError

    const school = await schoolService.getById(userData.school_id)

    // Update IndexedDB with latest data
    const now = new Date().toISOString()
    await db.put('auth_state', {
      ...authState,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      updated_at: now,
      last_sync_at: now,
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at || Date.now() + 3600 * 1000,
      },
      school: {
        id: school.id,
        name: school.name,
        email: school.email,
        subscription_plan: school.subscription_plan,
        verification_status: school.verification_status,
        created_at: school.createdAt ? new Date(school.createdAt).toISOString() : now,
        updated_at: school.updatedAt ? new Date(school.updatedAt).toISOString() : now,
      }
    })
  },

  async clearAllCachedData(): Promise<void> {
    const db = await getDB()
    
    // Clear all auth-related data
    await db.delete('auth_state', 'current')
    
    // Clear all offline credentials
    const tx = db.transaction('offline_credentials', 'readwrite')
    const store = tx.objectStore('offline_credentials')
    await store.clear()
    await tx.done
    
    // Sign out from Supabase if online
    if (navigator.onLine) {
      await supabase.auth.signOut()
    }
    
    console.log('✅ All cached authentication data cleared')
  }
} 