import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/services/auth.service'

export async function POST(request: NextRequest) {
  try {
    await authService.clearAllCachedData()
    
    return NextResponse.json({ 
      success: true, 
      message: 'All cached authentication data cleared successfully' 
    })
  } catch (error) {
    console.error('Error clearing cached data:', error)
    return NextResponse.json(
      { error: 'Failed to clear cached data' },
      { status: 500 }
    )
  }
} 