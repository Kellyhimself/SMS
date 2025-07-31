import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/config'

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json()
    
    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, message: 'Phone number and OTP are required' },
        { status: 400 }
      )
    }

    // Use server-side Supabase client with service role
    const supabase = createServerSupabaseClient()
    
    // Check if parent exists
    const { data: parentAccount, error } = await supabase
      .from('parent_accounts')
      .select('*')
      .eq('phone', phone)
      .eq('is_active', true)
      .single()

    if (error || !parentAccount) {
      return NextResponse.json(
        { success: false, message: 'Phone number not found in our system.' },
        { status: 404 }
      )
    }

    // Verify OTP from our database
    const { data: otpData, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('otp', otp)
      .single()

    console.log(`🔍 OTP lookup result:`, { otpData, otpError })

    if (otpError || !otpData) {
      console.log(`❌ OTP not found or error:`, otpError)
      return NextResponse.json(
        { success: false, message: 'Invalid OTP. Please try again.' },
        { status: 400 }
      )
    }

    // Check if OTP is expired
    const now = new Date()
    const expiresAt = new Date(otpData.expires_at)
    
    console.log(`🔍 OTP verification debug:`)
    console.log(`📱 Phone: ${phone}`)
    console.log(`🔢 OTP: ${otp}`)
    console.log(`🕐 Current time: ${now.toISOString()}`)
    console.log(`⏰ OTP expires at: ${expiresAt.toISOString()}`)
    console.log(`❓ Is expired: ${expiresAt < now}`)
    
    if (expiresAt < now) {
      console.log(`❌ OTP expired!`)
      return NextResponse.json(
        { success: false, message: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Clear OTP after successful verification
    await supabase
      .from('otp_codes')
      .delete()
      .eq('phone', phone)

    // Generate session token for offline access
    const sessionToken = crypto.randomUUID()

    // Store session in database for server-side validation
    const { error: sessionError } = await supabase
      .from('parent_sessions')
      .insert({
        id: sessionToken,
        parent_id: parentAccount.id,
        phone: parentAccount.phone,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })

    if (sessionError) {
      console.error('Error storing session:', sessionError)
      return NextResponse.json(
        { success: false, message: 'Failed to create session. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      parent: parentAccount,
      session_token: sessionToken
    })

  } catch (error) {
    console.error('Error in verify-otp API:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to verify OTP. Please try again.' },
      { status: 500 }
    )
  }
} 