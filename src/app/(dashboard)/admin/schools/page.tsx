'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { School, Search, CheckCircle, XCircle, Clock, Eye } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface SchoolData {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  subscription_plan: string
  verification_status: 'pending' | 'verified' | 'rejected'
  created_at: string
  verified_at?: string
  admin_user: {
    name: string
    email: string
  }
  user_count: number
}

export default function AllSchoolsPage() {
  const [schools, setSchools] = useState<SchoolData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all')

  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    try {
      // First, get all schools
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
        .order('created_at', { ascending: false })

      if (schoolsError) throw schoolsError

      if (!schools || schools.length === 0) {
        setSchools([])
        return
      }

      // Then, get the admin users for these schools
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

      if (usersError) throw usersError

      // Get user count for each school and combine the data
      const schoolsWithUserCount = await Promise.all(
        schools.map(async (school) => {
          const { count } = await supabase
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
            user_count: count || 0
          }
        })
      )

      setSchools(schoolsWithUserCount)
    } catch (error) {
      console.error('Error fetching schools:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.admin_user.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || school.verification_status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <School className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading schools...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Schools</h1>
          <p className="text-muted-foreground">
            Manage and monitor all registered schools
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schools.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered schools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schools.filter(s => s.verification_status === 'verified').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active schools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schools.filter(s => s.verification_status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <School className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schools.reduce((acc, school) => acc + school.user_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all schools
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search schools by name, email, or admin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All ({schools.length})
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
              >
                Pending ({schools.filter(s => s.verification_status === 'pending').length})
              </Button>
              <Button
                variant={statusFilter === 'verified' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('verified')}
              >
                Verified ({schools.filter(s => s.verification_status === 'verified').length})
              </Button>
              <Button
                variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('rejected')}
              >
                Rejected ({schools.filter(s => s.verification_status === 'rejected').length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schools List */}
      {filteredSchools.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <School className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No schools found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No schools have been registered yet.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSchools.map((school) => (
            <Card key={school.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(school.verification_status)}
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {school.name}
                          {getStatusBadge(school.verification_status)}
                        </CardTitle>
                        <CardDescription>
                          Registered {formatDistanceToNow(new Date(school.created_at), { addSuffix: true })}
                          {school.verified_at && (
                            <span className="ml-2">
                              • Verified {formatDistanceToNow(new Date(school.verified_at), { addSuffix: true })}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/schools/${school.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <h4 className="font-medium">School Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Email:</span> {school.email}</p>
                      {school.phone && <p><span className="font-medium">Phone:</span> {school.phone}</p>}
                      {school.address && <p><span className="font-medium">Address:</span> {school.address}</p>}
                      <p><span className="font-medium">Plan:</span> 
                        <Badge variant="outline" className="ml-2 capitalize">
                          {school.subscription_plan}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Admin Contact</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {school.admin_user.name}</p>
                      <p><span className="font-medium">Email:</span> {school.admin_user.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Usage</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Users:</span> {school.user_count}</p>
                      <p><span className="font-medium">Status:</span> {getStatusBadge(school.verification_status)}</p>
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