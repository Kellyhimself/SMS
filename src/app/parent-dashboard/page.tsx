'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils'
import { 
  Users, 
  Calendar, 
  DollarSign, 
  BookOpen, 
  TrendingUp, 
  AlertCircle,
  Download,
  Phone,
  Mail,
  LogOut
} from 'lucide-react'
import Link from 'next/link'
import { useParentAuth } from '@/contexts/parent-auth-context'
import { useParentDashboard } from '@/hooks/use-parents'

// Mock data - in real implementation, this would come from the parent service
const mockParentData = {
  name: 'John Doe',
  phone: '+254700123456',
  email: 'john.doe@example.com',
  children: [
    {
      id: '1',
      name: 'Sarah Doe',
      class: 'Class 3',
      admission_number: '2024/001',
      attendance_percentage: 95,
      total_fees: 50000,
      paid_fees: 35000,
      outstanding_fees: 15000,
      recent_attendance: [
        { date: '2024-01-15', status: 'present' },
        { date: '2024-01-14', status: 'present' },
        { date: '2024-01-13', status: 'absent' },
        { date: '2024-01-12', status: 'present' },
        { date: '2024-01-11', status: 'present' },
      ],
      recent_fees: [
        { date: '2024-01-10', amount: 10000, status: 'paid' },
        { date: '2024-01-05', amount: 15000, status: 'paid' },
        { date: '2024-01-01', amount: 25000, status: 'pending' },
      ]
    }
  ]
}

export default function ParentDashboardPage() {
  const { parent, logout } = useParentAuth()
  const { data: dashboardData, isLoading } = useParentDashboard(parent?.id || '')
  const [selectedChild, setSelectedChild] = useState<any>(null)

  console.log('🔍 Parent Dashboard Debug:', {
    parent: parent ? 'exists' : 'null',
    parentId: parent?.id,
    dashboardData: dashboardData ? `${dashboardData.length} items` : 'null',
    isLoading
  })

  // Set first child as selected when data loads
  useEffect(() => {
    if (dashboardData && dashboardData.length > 0 && !selectedChild) {
      setSelectedChild(dashboardData[0])
    }
  }, [dashboardData, selectedChild])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800'
      case 'absent':
        return 'bg-red-100 text-red-800'
      case 'late':
        return 'bg-orange-100 text-orange-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Show no data state
  if (!dashboardData || dashboardData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Parent Portal</h1>
                <p className="text-gray-600">Welcome back, {parent?.name}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">{parent?.phone}</p>
                  <p className="text-sm text-gray-600">{parent?.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Children Found</h3>
              <p className="text-muted-foreground">
                No children are currently linked to your account. Please contact your school administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Parent Portal</h1>
              <p className="text-gray-600">Welcome back, {parent?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">{parent?.phone}</p>
                <p className="text-sm text-gray-600">{parent?.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Child Selection */}
        {dashboardData && dashboardData.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Select Child</h2>
            <div className="flex gap-2">
              {dashboardData.map((child) => (
                <Button
                  key={child.student_id}
                  variant={selectedChild?.student_id === child.student_id ? 'default' : 'outline'}
                  onClick={() => setSelectedChild(child)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {child.student_name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Overview Cards */}
        {selectedChild && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(selectedChild.attendance_percentage)}%</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(selectedChild.total_fee_amount)}</div>
                <p className="text-xs text-muted-foreground">
                  Total amount
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(selectedChild.total_paid_amount)}</div>
                <p className="text-xs text-muted-foreground">
                  Amount paid
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(selectedChild.outstanding_amount)}</div>
                <p className="text-xs text-muted-foreground">
                  Outstanding balance
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Student Information */}
        {selectedChild && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Student Name</p>
                  <p className="font-medium">{selectedChild.student_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Class</p>
                  <p className="font-medium">{selectedChild.class}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admission Number</p>
                  <p className="font-medium">{selectedChild.admission_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Relationship</p>
                  <p className="font-medium capitalize">{selectedChild.relationship}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Primary Contact</p>
                  <p className="font-medium">{selectedChild.is_primary ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attendance Days</p>
                  <p className="font-medium">{selectedChild.total_attendance_days} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Information Tabs */}
        {selectedChild && (
          <Tabs defaultValue="attendance" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="fees">Fees</TabsTrigger>
              <TabsTrigger value="academics">Academics</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{selectedChild.present_days}</div>
                      <p className="text-sm text-green-600">Present Days</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{selectedChild.absent_days}</div>
                      <p className="text-sm text-red-600">Absent Days</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{selectedChild.late_days}</div>
                      <p className="text-sm text-orange-600">Late Days</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Attendance Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fees" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Fee Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{selectedChild.total_fees}</div>
                      <p className="text-sm text-blue-600">Total Fee Records</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedChild.total_paid_amount)}</div>
                      <p className="text-sm text-green-600">Total Paid</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{formatCurrency(selectedChild.outstanding_amount)}</div>
                      <p className="text-sm text-red-600">Outstanding</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Fee Statement
                    </Button>
                    <Button className="w-full">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Pay Outstanding Fees
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="academics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Academic Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Student Name</p>
                        <p className="font-medium">{selectedChild.student_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Class</p>
                        <p className="font-medium">{selectedChild.class}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Admission Number</p>
                        <p className="font-medium">{selectedChild.admission_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Academic Year</p>
                        <p className="font-medium">2024</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download Report Card
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
} 