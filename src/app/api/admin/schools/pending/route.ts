import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/config'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (dbError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Fetch pending schools with admin user information
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select(`
        id,
        name,
        email,
        phone,
        address,
        subscription_plan,
        verification_status,
        created_at,
        verified_at
      `)
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false })

    if (schoolsError) {
      console.error('Error fetching pending schools:', schoolsError)
      return NextResponse.json({ error: 'Failed to fetch pending schools' }, { status: 500 })
    }

    if (!schools || schools.length === 0) {
      return NextResponse.json({
        schools: [],
        count: 0
      })
    }

    // Get admin users for these schools
    const schoolIds = schools.map(school => school.id)
    const { data: adminUsers, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        school_id
      `)
      .in('school_id', schoolIds)
      .eq('role', 'admin')

    if (usersError) {
      console.error('Error fetching admin users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch admin users' }, { status: 500 })
    }

    // Format the response
    const formattedSchools = schools.map(school => {
      const adminUser = adminUsers?.find(user => user.school_id === school.id)
      return {
        id: school.id,
        name: school.name,
        email: school.email,
        phone: school.phone,
        address: school.address,
        subscription_plan: school.subscription_plan,
        verification_status: school.verification_status,
        created_at: school.created_at,
        verified_at: school.verified_at,
        admin_user: adminUser ? {
          name: adminUser.name,
          email: adminUser.email
        } : {
          name: 'Unknown',
          email: 'No admin found'
        }
      }
    })

    return NextResponse.json({
      schools: formattedSchools,
      count: formattedSchools.length
    })

  } catch (error) {
    console.error('Error in pending schools API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 