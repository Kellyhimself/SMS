'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, XCircle, Eye, Clock, RefreshCw } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { withTimeoutAndRetry } from '@/lib/utils/network'

interface PendingSchool {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  subscription_plan: string
  created_at: string
  admin_user: {
    name: string
    email: string
  }
}

export default function PendingSchoolsPage() {
  const [pendingSchools, setPendingSchools] = useState<PendingSchool[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const fetchPendingSchools = useCallback(async (isRetry = false) => {
    if (isRetry) {
      setRetryCount(prev => prev + 1)
    }
    
    try {
      setError(null)
      
      // Use network utility for better timeout and retry handling
      const schoolsData = await withTimeoutAndRetry(
        async () => {
          const { data: schools, error: schoolsError } = await supabase
            .from('schools')
            .select(`
              id,
              name,
              email,
              phone,
              address,
              subscription_plan,
              created_at
            `)
            .eq('verification_status', 'pending')
            .order('created_at', { ascending: false })

          if (schoolsError) {
            throw new Error(schoolsError.message)
          }

          return schools || []
        },
        15000, // 15 second timeout
        { maxRetries: 2, baseDelay: 2000 }
      )

      if (schoolsData.length === 0) {
        setPendingSchools([])
        return
      }

      // Get admin users for these schools
      const schoolIds = schoolsData.map(school => school.id)
      const adminUsersData = await withTimeoutAndRetry(
        async () => {
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
            throw new Error(usersError.message)
          }

          return adminUsers || []
        },
        15000, // 15 second timeout
        { maxRetries: 2, baseDelay: 2000 }
      )

      // Combine the data
      const formattedSchools = schoolsData.map(school => {
        const adminUser = adminUsersData?.find(user => user.school_id === school.id)
        return {
          id: school.id,
          name: school.name,
          email: school.email,
          phone: school.phone,
          address: school.address,
          subscription_plan: school.subscription_plan,
          created_at: school.created_at,
          admin_user: adminUser ? {
            name: adminUser.name,
            email: adminUser.email
          } : {
            name: 'Unknown',
            email: 'No admin found'
          }
        }
      })

      setPendingSchools(formattedSchools)
      setRetryCount(0) // Reset retry count on success
    } catch (error) {
      console.error('Error fetching pending schools:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch pending schools')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPendingSchools()
  }, [fetchPendingSchools])

  const handleVerification = async (schoolId: string, action: 'approve' | 'reject') => {
    setProcessing(schoolId)
    
    try {
      console.log(`Attempting to ${action} school ${schoolId}`)

      // Use the API route for verification with timeout
      const response = await withTimeoutAndRetry(
        async () => {
          return fetch(`/api/admin/schools/${schoolId}/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action,
              reason: action === 'reject' ? 'Rejected by admin' : null
            })
          })
        },
        30000, // 30 second timeout for verification
        { maxRetries: 1, baseDelay: 1000 }
      )

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || `Failed to ${action} school (Status: ${response.status})`)
      }

      const result = await response.json()
      console.log('Verification successful:', result)

      // Remove from pending list
      setPendingSchools(prev => prev.filter(school => school.id !== schoolId))
      
      // Show success message
      alert(`School ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
      
      // Refetch data to ensure UI is in sync with database
      await fetchPendingSchools()
      
    } catch (error) {
      console.error(`Error ${action}ing school:`, error)
      alert(`Failed to ${action} school: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setProcessing(null)
    }
  }

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    fetchPendingSchools()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading pending schools...</p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">Retry attempt {retryCount}/3</p>
          )}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Data</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRetry} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pending School Verifications</h1>
          <p className="text-muted-foreground">
            Review and approve new school registrations
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin">
              ← Back to Admin Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Schools</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSchools.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Today</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingSchools.filter(school => {
                const today = new Date()
                const schoolDate = new Date(school.created_at)
                return schoolDate.toDateString() === today.toDateString()
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Wait Time</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingSchools.length > 0 
                ? Math.round(pendingSchools.reduce((acc, school) => {
                    const waitTime = Date.now() - new Date(school.created_at).getTime()
                    return acc + waitTime
                  }, 0) / pendingSchools.length / (1000 * 60 * 60)) // Convert to hours
                : 0}h
            </div>
            <p className="text-xs text-muted-foreground">
              Average wait time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Schools List */}
      {pendingSchools.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Schools</h3>
            <p className="text-muted-foreground text-center">
              All schools have been verified. New registrations will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingSchools.map((school) => (
            <Card key={school.id} className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {school.name}
                      <Badge variant="secondary" className="text-yellow-600">
                        Pending
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Registered {formatDistanceToNow(new Date(school.created_at), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerification(school.id, 'approve')}
                      disabled={processing === school.id}
                    >
                      {processing === school.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerification(school.id, 'reject')}
                      disabled={processing === school.id}
                    >
                      {processing === school.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">School Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Email:</span> {school.email}</p>
                      {school.phone && <p><span className="font-medium">Phone:</span> {school.phone}</p>}
                      {school.address && <p><span className="font-medium">Address:</span> {school.address}</p>}
                      <div className="flex items-center">
                        <span className="font-medium">Plan:</span> 
                        <Badge variant="outline" className="ml-2 capitalize">
                          {school.subscription_plan}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Admin Contact</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {school.admin_user.name}</p>
                      <p><span className="font-medium">Email:</span> {school.admin_user.email}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 