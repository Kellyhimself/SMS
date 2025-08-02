import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    
    // Use the regular client for authentication
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: { path?: string; maxAge?: number }) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: { path?: string }) {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          },
        },
      }
    )

    const { id: schoolId } = await params

    console.log('Verification request for school ID:', schoolId)

    // Get the current user with timeout handling
    let user, userError
    try {
      const authResult = await supabase.auth.getUser()
      user = authResult.data.user
      userError = authResult.error
    } catch (error) {
      console.error('Auth timeout/error:', error)
      userError = error as Error
    }
    
    console.log('User auth result:', { user: user?.id, error: userError })
    
    if (userError || !user) {
      console.error('Authentication failed:', userError)
      return NextResponse.json({ 
        error: 'Authentication failed. Please try again.',
        details: userError?.message 
      }, { status: 401 })
    }

    // Check if user is admin with timeout handling
    let userData, dbError
    try {
      const userResult = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      userData = userResult.data
      dbError = userResult.error
    } catch (error) {
      console.error('Database query timeout/error:', error)
      dbError = error as Error
    }

    console.log('User role check:', { userData, error: dbError })

    if (dbError || !userData || userData.role !== 'admin') {
      console.error('Authorization failed:', { userData, error: dbError })
      return NextResponse.json({ 
        error: 'Forbidden - Admin access required',
        details: dbError?.message 
      }, { status: 403 })
    }

    // Get request body
    const body = await request.json()
    const { action, reason } = body

    console.log('Request body:', { action, reason })

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 })
    }

    // Check if school exists and is pending with timeout handling
    let school, schoolError
    try {
      const schoolResult = await supabase
        .from('schools')
        .select('id, verification_status, name')
        .eq('id', schoolId)
        .single()
      school = schoolResult.data
      schoolError = schoolResult.error
    } catch (error) {
      console.error('School query timeout/error:', error)
      schoolError = error as Error
    }

    console.log('School check:', { school, error: schoolError })

    if (schoolError || !school) {
      return NextResponse.json({ 
        error: 'School not found',
        details: schoolError?.message 
      }, { status: 404 })
    }

    if (school.verification_status !== 'pending') {
      return NextResponse.json({ error: 'School is not pending verification' }, { status: 400 })
    }

    // Update school verification status using service role to bypass RLS
    const updateData: any = {
      verification_status: action === 'approve' ? 'verified' : 'rejected',
      verified_at: new Date().toISOString(),
      verified_by: user.id
    }

    if (action === 'reject' && reason) {
      updateData.rejection_reason = reason
    }

    console.log('Updating school with data:', updateData)

    // Use service role client for the update to bypass RLS
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    let updatedSchools: any[] | null = null, updateError
    try {
      const updateResult = await serviceClient
        .from('schools')
        .update(updateData)
        .eq('id', schoolId)
        .select()
      updatedSchools = updateResult.data
      updateError = updateResult.error
    } catch (error) {
      console.error('Update timeout/error:', error)
      updateError = error as Error
    }

    console.log('Update result:', { updatedSchools, error: updateError, count: updatedSchools?.length })

    if (updateError) {
      console.error('Error updating school verification:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update school verification',
        details: updateError?.message 
      }, { status: 500 })
    }

    if (!updatedSchools || updatedSchools.length === 0) {
      console.error('No rows were updated')
      return NextResponse.json({ error: 'No rows were updated' }, { status: 500 })
    }

    const updatedSchool = updatedSchools[0]
    console.log('School updated successfully:', updatedSchool)

    // Log the verification action using service client (non-blocking)
    try {
      await serviceClient
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: `school_${action}`,
          resource_type: 'school',
          resource_id: schoolId,
          details: {
            action,
            reason: action === 'reject' ? reason : null,
            school_name: updatedSchool.name
          }
        })
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError)
      // Don't fail the main operation if audit logging fails
    }

    return NextResponse.json({
      success: true,
      message: `School ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      school: updatedSchool
    })

  } catch (error) {
    console.error('Error in school verification API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 