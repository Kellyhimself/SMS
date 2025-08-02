'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { School, Users, Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface AdminStats {
  totalSchools: number
  pendingSchools: number
  verifiedSchools: number
  totalUsers: number
  totalAdmins: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalSchools: 0,
    pendingSchools: 0,
    verifiedSchools: 0,
    totalUsers: 0,
    totalAdmins: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get school statistics
        const { data: schools } = await supabase
          .from('schools')
          .select('verification_status')

        const { data: users } = await supabase
          .from('users')
          .select('role')

        if (schools && users) {
          const totalSchools = schools.length
          const pendingSchools = schools.filter(s => s.verification_status === 'pending').length
          const verifiedSchools = schools.filter(s => s.verification_status === 'verified').length
          const totalUsers = users.length
          const totalAdmins = users.filter(u => u.role === 'admin').length

          setStats({
            totalSchools,
            pendingSchools,
            verifiedSchools,
            totalUsers,
            totalAdmins
          })
        }
      } catch (error) {
        console.error('Error fetching admin stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage schools and system administration</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/schools/pending">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Review Pending Schools
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/schools">
              <School className="w-4 h-4 mr-2" />
              All Schools
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSchools}</div>
            <p className="text-xs text-muted-foreground">
              Registered schools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSchools}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Schools</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedSchools}</div>
            <p className="text-xs text-muted-foreground">
              Active schools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAdmins} admins
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Pending Verifications
            </CardTitle>
            <CardDescription>
              Review and approve new school registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{stats.pendingSchools} pending</Badge>
              <Button asChild size="sm">
                <Link href="/admin/schools/pending">Review</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5 text-blue-500" />
              School Management
            </CardTitle>
            <CardDescription>
              View and manage all registered schools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{stats.totalSchools} schools</Badge>
              <Button asChild size="sm">
                <Link href="/admin/schools">Manage</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              System Security
            </CardTitle>
            <CardDescription>
              Monitor system security and access controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Active</Badge>
              <Button asChild size="sm">
                <Link href="/admin/security">Monitor</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest school registrations and verifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.pendingSchools > 0 ? (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">New schools awaiting verification</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.pendingSchools} schools need your attention
                    </p>
                  </div>
                </div>
                <Button asChild size="sm">
                  <Link href="/admin/schools/pending">Review Now</Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">All schools verified</p>
                    <p className="text-sm text-muted-foreground">
                      No pending verifications
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 