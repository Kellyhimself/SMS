'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, UserPlus, Mail, Shield } from 'lucide-react'
import { InviteUserForm } from '@/components/forms/invite-user-form'
import { InvitationList } from '@/components/ui/invitation-list'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'teacher' | 'parent' | 'accountant'
  created_at: string
  invited_by?: string
}

interface School {
  id: string
  name: string
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Get current user's school
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userProfile } = await supabase
        .from('users')
        .select('school_id')
        .eq('id', user.id)
        .single()

      if (!userProfile?.school_id) return

      // Get school info
      const { data: schoolData } = await supabase
        .from('schools')
        .select('id, name')
        .eq('id', userProfile.school_id)
        .single()

      setSchool(schoolData)

      // Get all users in the school
      const { data: usersData } = await supabase
        .from('users')
        .select('id, email, name, role, created_at, invited_by')
        .eq('school_id', userProfile.school_id)
        .order('created_at', { ascending: false })

      setUsers(usersData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
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
      day: 'numeric'
    })
  }

  const getRoleStats = () => {
    const stats = {
      admin: 0,
      teacher: 0,
      parent: 0,
      accountant: 0
    }

    users.forEach(user => {
      stats[user.role as keyof typeof stats]++
    })

    return stats
  }

  const roleStats = getRoleStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading user management...</p>
        </div>
      </div>
    )
  }

  if (!school) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                You don't have permission to access user management.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage users and send invitations for {school.name}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Active users in your school
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <Badge variant="outline" className="bg-blue-100 text-blue-800">Teacher</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.teacher}</div>
            <p className="text-xs text-muted-foreground">
              Teaching staff
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parents</CardTitle>
            <Badge variant="outline" className="bg-purple-100 text-purple-800">Parent</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.parent}</div>
            <p className="text-xs text-muted-foreground">
              Parent accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accountants</CardTitle>
            <Badge variant="outline" className="bg-orange-100 text-orange-800">Accountant</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.accountant}</div>
            <p className="text-xs text-muted-foreground">
              Financial staff
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="invite" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Users
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Pending Invitations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>School Users</CardTitle>
              <CardDescription>
                All users registered in your school
              </CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No users found</h3>
                  <p className="text-muted-foreground">
                    Start by inviting users to your school.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{user.name}</span>
                          {getRoleBadge(user.role)}
                          {user.role === 'admin' && (
                            <Badge variant="default" className="bg-red-100 text-red-800">
                              School Admin
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{user.email}</span>
                          <span>Joined: {formatDate(user.created_at)}</span>
                          {user.invited_by && (
                            <span className="text-blue-600">Invited user</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invite" className="space-y-4">
          <InviteUserForm 
            schoolId={school.id} 
            onSuccess={() => {
              setActiveTab('invitations')
              fetchData()
            }}
          />
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <InvitationList 
            schoolId={school.id}
            onRefresh={fetchData}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
} 