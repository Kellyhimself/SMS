import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/config'
import { schoolService } from '@/services/school.service'
import type { RegisterCredentials } from '@/types/auth'

export async function POST(request: NextRequest) {
  try {
    const credentials: RegisterCredentials = await request.json()
    
    // Add detailed logging
    console.log('=== Registration Request Debug ===')
    console.log('Received credentials:', JSON.stringify(credentials, null, 2))
    console.log('Email:', credentials.email)
    console.log('Role:', credentials.role)
    console.log('School email:', credentials.school.email)
    console.log('School subscription_plan:', credentials.school.subscription_plan)

    // Validate that only admin registration is allowed
    if (credentials.role !== 'admin') {
      console.log('❌ Role validation failed:', credentials.role)
      return NextResponse.json(
        { error: 'Only admin registration is allowed for new schools' },
        { status: 400 }
      )
    }

    // Check if school already exists
    const existingSchool = await schoolService.getByEmail(credentials.school.email)
    if (existingSchool) {
      console.log('❌ School already exists:', credentials.school.email)
      return NextResponse.json(
        { error: 'School already exists. Please contact the school administrator.' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role for server-side operations
    const supabase = createServerSupabaseClient()

    // First create the school with pending verification status
    console.log('Creating school...')
    const school = await schoolService.create({
      ...credentials.school,
      verification_status: 'pending' as const,
    })

    console.log('School created:', school.id)

    // Then create the user account with school_id in metadata
    console.log('Attempting to sign up user:', credentials.email)
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: credentials.email,
      password: credentials.password,
      email_confirm: true, // Auto-confirm email for admin users
      user_metadata: {
        school_id: school.id,
        role: credentials.role,
        name: credentials.name
      }
    })

    if (error) {
      console.error('Signup error details:', error)
      console.error('Error message:', error.message)
      console.error('Error status:', error.status)
      console.error('Error code:', error.code)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      console.error('❌ No user data returned')
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    console.log('User created:', data.user.id)

    // Create the user profile with school association
    console.log('Creating user profile...')
    
    const now = new Date()
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .upsert({
        id: data.user.id,
        email: credentials.email,
        name: credentials.name,
        role: credentials.role,
        school_id: school.id,
        created_at: now,
        updated_at: now,
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error creating user profile:', dbError)
      console.error('Error details:', {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code
      })
      return NextResponse.json(
        { error: `Failed to create user profile: ${dbError.message}` },
        { status: 500 }
      )
    }

    console.log('User profile created:', userData)

    // Create a session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: credentials.email,
    })

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    console.log('✅ Registration completed successfully')

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: credentials.email,
        name: credentials.name,
        role: credentials.role,
        school_id: school.id,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
      },
      school: {
        id: school.id,
        name: school.name,
        email: school.email,
        subscription_plan: school.subscription_plan,
        verification_status: school.verification_status,
        createdAt: school.createdAt,
        updatedAt: school.updatedAt,
      },
      session: sessionData,
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
} 