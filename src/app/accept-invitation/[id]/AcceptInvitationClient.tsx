'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Mail, User, Lock, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

const acceptInvitationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type AcceptInvitationFormData = z.infer<typeof acceptInvitationSchema>

interface Invitation {
  id: string
  email: string
  role: 'teacher' | 'parent' | 'accountant'
  school_id: string
  status: 'pending' | 'accepted' | 'expired'
  expires_at: string
  created_at: string
}

interface School {
  id: string
  name: string
}

interface AcceptInvitationClientProps {
  invitationId: string
  initialInvitation: Invitation | null
  initialSchool: School | null
  initialError: string | null
}

export default function AcceptInvitationClient({ 
  invitationId, 
  initialInvitation, 
  initialSchool, 
  initialError 
}: AcceptInvitationClientProps) {
  const router = useRouter()
  const [invitation] = useState<Invitation | null>(initialInvitation)
  const [school] = useState<School | null>(initialSchool)
  const [error] = useState<string | null>(initialError)
  const [isSubmitting, setIsSubmitting] = useState(false)

  console.log('AcceptInvitationClient rendered with invitationId:', invitationId)
  console.log('Current URL:', typeof window !== 'undefined' ? window.location.href : 'Server side')

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AcceptInvitationFormData>({
    resolver: zodResolver(acceptInvitationSchema)
  })

  const onSubmit = async (data: AcceptInvitationFormData) => {
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          password: data.password
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to accept invitation')
      }

      toast.success('Account created successfully!')
      
      // Redirect to dashboard after successful registration
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept invitation'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      teacher: 'bg-blue-100 text-blue-800',
      parent: 'bg-purple-100 text-purple-800',
      accountant: 'bg-orange-100 text-orange-800'
    }
    
    return (
      <Badge variant="outline" className={colors[role as keyof typeof colors]}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = invitation ? new Date() > new Date(invitation.expires_at) : false

  if (error || !invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Invalid Invitation
            </CardTitle>
            <CardDescription>
              This invitation is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error || 'Invitation not found'}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (invitation.status !== 'pending' || isExpired) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Invitation {invitation.status === 'accepted' ? 'Already Accepted' : 'Expired'}
            </CardTitle>
            <CardDescription>
              {invitation.status === 'accepted' 
                ? 'This invitation has already been accepted'
                : 'This invitation has expired'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Email: {invitation.email}</p>
              <p>Role: {getRoleBadge(invitation.role)}</p>
              <p>Expires: {formatDate(invitation.expires_at)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Accept Invitation
          </CardTitle>
          <CardDescription>
            Complete your registration for {school?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4" />
              <span className="font-medium">{invitation.email}</span>
            </div>
            <div className="flex items-center gap-2">
              {getRoleBadge(invitation.role)}
              <span className="text-sm text-muted-foreground">
                at {school?.name}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="pl-10"
                  {...register('name')}
                  disabled={isSubmitting}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  className="pl-10"
                  {...register('password')}
                  disabled={isSubmitting}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  className="pl-10"
                  {...register('confirmPassword')}
                  disabled={isSubmitting}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept Invitation
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> By accepting this invitation, you agree to join {school?.name} as a {invitation.role}.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 