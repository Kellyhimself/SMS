'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

const inviteUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['teacher', 'parent', 'accountant'], {
    required_error: 'Please select a role'
  })
})

type InviteUserFormData = z.infer<typeof inviteUserSchema>

interface InviteUserFormProps {
  onSuccess?: () => void
  schoolId: string
}

export function InviteUserForm({ onSuccess, schoolId }: InviteUserFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      role: undefined
    }
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: InviteUserFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          role: data.role,
          school_id: schoolId
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation')
      }

      toast.success('Invitation sent successfully!')
      reset()
      onSuccess?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invitation'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'teacher':
        return 'Can manage classes, grades, and student records'
      case 'parent':
        return 'Can view their children\'s information and make payments'
      case 'accountant':
        return 'Can manage fees, payments, and financial records'
      default:
        return ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Invite New User
        </CardTitle>
        <CardDescription>
          Send an invitation to a new teacher, parent, or accountant
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                className="pl-10"
                {...register('email')}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              onValueChange={(value) => setValue('role', value as any)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          {selectedRole && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {getRoleDescription(selectedRole)}
              </p>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Invitation...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Invitation
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> The invitation will expire in 7 days. The user will receive an email with instructions to join your school.
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 