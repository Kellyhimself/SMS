'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Phone, Lock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { parentAuthService } from '@/services/parent-auth.service'

export default function ParentLoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [error, setError] = useState('')

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phone) {
      toast.error('Please enter your phone number')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await parentAuthService.sendOTP(phone)
      
      if (result.success) {
        setShowOtpInput(true)
        toast.success('OTP sent to your phone number')
      } else {
        setError(result.message)
      }
    } catch (error) {
      console.error('Error sending OTP:', error)
      setError('Failed to send OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!otp) {
      toast.error('Please enter the OTP')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      console.log('🔐 Starting OTP verification for phone:', phone)
      const result = await parentAuthService.verifyOTP(phone, otp)
      console.log('🔐 OTP verification result:', result)
      
      if (result.success) {
        console.log('✅ OTP verification successful, storing session token:', result.session_token)
        // Store session token in localStorage
        localStorage.setItem('parent_session_token', result.session_token!)
        
        console.log('✅ Session token stored, redirecting to dashboard...')
        // Redirect to parent dashboard
        router.push('/parent-dashboard')
      } else {
        console.log('❌ OTP verification failed:', result.message)
        setError(result.message)
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      setError('Invalid OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Parent Portal</CardTitle>
            <p className="text-muted-foreground">
              Access your child's information and school updates
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!showOtpInput ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    We've sent a 6-digit code to {phone}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setShowOtpInput(false)
                      setOtp('')
                      setError('')
                    }}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link 
                href="/login" 
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to School Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 