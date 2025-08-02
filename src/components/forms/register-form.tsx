'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import type { RegisterCredentials } from '@/types/auth'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.literal('admin'), // Only admin allowed for new school registration
  school: z.object({
    name: z.string().min(2, 'School name must be at least 2 characters'),
    email: z.string().email('Invalid school email address'),
    address: z.string().optional(),
    phone: z.string().optional(),
    subscription_plan: z.enum(['core', 'premium']),
  }),
})

interface RegisterFormProps {
  onSubmit: (data: RegisterCredentials) => Promise<void>
  isLoading?: boolean
}

export function RegisterForm({ onSubmit, isLoading }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterCredentials>({
    name: '',
    email: '',
    password: '',
    role: 'admin', // Fixed to admin only
    school: {
      name: '',
      email: '',
      address: '',
      phone: '',
      subscription_plan: 'core',
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Registration failed:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create School Account</CardTitle>
        <CardDescription>Register as a school administrator to set up your school</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This registration is for school administrators only. Teachers, parents, and accountants will be invited by the school administrator after registration.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">School Information</h3>

          <div>
            <Label htmlFor="schoolName">School Name</Label>
            <Input
              id="schoolName"
              value={formData.school.name}
              onChange={(e) => setFormData({ ...formData, school: { ...formData.school, name: e.target.value } })}
              required
            />
          </div>

          <div>
            <Label htmlFor="schoolEmail">School Email</Label>
            <Input
              id="schoolEmail"
              type="email"
              value={formData.school.email}
              onChange={(e) => setFormData({ ...formData, school: { ...formData.school, email: e.target.value } })}
              required
            />
          </div>

          <div>
            <Label htmlFor="schoolAddress">School Address</Label>
            <Input
              id="schoolAddress"
              value={formData.school.address}
              onChange={(e) => setFormData({ ...formData, school: { ...formData.school, address: e.target.value } })}
            />
          </div>

          <div>
            <Label htmlFor="schoolPhone">School Phone</Label>
            <Input
              id="schoolPhone"
              type="tel"
              value={formData.school.phone}
              onChange={(e) => setFormData({ ...formData, school: { ...formData.school, phone: e.target.value } })}
            />
          </div>

          <div>
            <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
            <select
              id="subscriptionPlan"
              value={formData.school.subscription_plan}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  school: { ...formData.school, subscription_plan: e.target.value as 'core' | 'premium' },
                })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="core">Core</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating School Account...' : 'Create School Account'}
        </Button>
      </form>
    </Card>
  )
} 