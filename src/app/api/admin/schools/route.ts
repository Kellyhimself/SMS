import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/config'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)

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

    // Get query parameters
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
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
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('verification_status', status)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: schools, error: schoolsError, count } = await query

    if (schoolsError) {
      console.error('Error fetching schools:', schoolsError)
      return NextResponse.json({ error: 'Failed to fetch schools' }, { status: 500 })
    }

    if (!schools || schools.length === 0) {
      return NextResponse.json({
        schools: [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
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

    // Get user count for each school
    const schoolsWithUserCount = await Promise.all(
      schools.map(async (school) => {
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', school.id)

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
          },
          user_count: userCount || 0
        }
      })
    )

    return NextResponse.json({
      schools: schoolsWithUserCount,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in schools API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 