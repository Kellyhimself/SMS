import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number }) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: { path?: string }) {
          res.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )

  // Get authenticated user with timeout handling
  let user, userError
  try {
    const authResult = await supabase.auth.getUser()
    user = authResult.data.user
    userError = authResult.error
  } catch (error) {
    console.error('Middleware auth timeout/error:', error)
    userError = error as Error
  }

  // Auth routes handling
  if (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register')) {
    if (user) {
      // If user is already logged in, redirect to dashboard
      const redirectUrl = new URL('/dashboard', req.url)
      return NextResponse.redirect(redirectUrl)
    }
    // If not logged in, allow access to auth pages
    return res
  }

  // Protected routes handling
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user || userError) {
      // If not logged in or error getting user, redirect to login
      const redirectUrl = new URL('/login', req.url)
      return NextResponse.redirect(redirectUrl)
    }

    try {
      // Role-based access control with timeout handling
      let userData, dbError
      try {
        const userResult = await supabase
          .from('users')
          .select('role, school_id')
          .eq('id', user.id)
          .single()
        userData = userResult.data
        dbError = userResult.error
      } catch (error) {
        console.error('Middleware database query timeout/error:', error)
        dbError = error as Error
      }

      if (dbError || !userData) {
        // If user not found in database, redirect to login
        const redirectUrl = new URL('/login', req.url)
        return NextResponse.redirect(redirectUrl)
      }

      // Check school verification status for non-admin users
      if (userData.role !== 'admin') {
        let schoolData, schoolError
        try {
          const schoolResult = await supabase
            .from('schools')
            .select('verification_status')
            .eq('id', userData.school_id)
            .single()
          schoolData = schoolResult.data
          schoolError = schoolResult.error
        } catch (error) {
          console.error('Middleware school query timeout/error:', error)
          schoolError = error as Error
        }

        if (schoolError || !schoolData) {
          // If school not found, redirect to login
          const redirectUrl = new URL('/login', req.url)
          return NextResponse.redirect(redirectUrl)
        }

        // Restrict access for unverified schools (except for admin)
        if (schoolData.verification_status !== 'verified') {
          // Redirect to verification pending page
          const redirectUrl = new URL('/verification-pending', req.url)
          return NextResponse.redirect(redirectUrl)
        }
      }

      // Admin-only routes
      if (req.nextUrl.pathname.startsWith('/dashboard/admin') && userData.role !== 'admin') {
        const redirectUrl = new URL('/dashboard', req.url)
        return NextResponse.redirect(redirectUrl)
      }

      // Finance routes - only admin and accountant can access
      if (req.nextUrl.pathname.startsWith('/finance') && !['admin', 'accountant'].includes(userData.role)) {
        const redirectUrl = new URL('/dashboard', req.url)
        return NextResponse.redirect(redirectUrl)
      }

      // Settings routes - only admin can access
      if (req.nextUrl.pathname.startsWith('/settings') && userData.role !== 'admin') {
        const redirectUrl = new URL('/dashboard', req.url)
        return NextResponse.redirect(redirectUrl)
      }

      // Teacher-only routes
      if (req.nextUrl.pathname.startsWith('/dashboard/teacher') && userData.role !== 'teacher') {
        const redirectUrl = new URL('/dashboard', req.url)
        return NextResponse.redirect(redirectUrl)
      }

      // Parent-only routes
      if (req.nextUrl.pathname.startsWith('/dashboard/parent') && userData.role !== 'parent') {
        const redirectUrl = new URL('/dashboard', req.url)
        return NextResponse.redirect(redirectUrl)
      }

      // If all checks pass, allow access to protected route
      return res
    } catch (error) {
      console.error('Middleware error:', error)
      const redirectUrl = new URL('/login', req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/finance/:path*', '/settings/:path*', '/admin/:path*', '/login', '/register'],
} 