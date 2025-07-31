'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle, BarChart3, FileText } from 'lucide-react'
import { useAttendanceStats, useTodayAttendance } from '@/hooks/use-attendance'
import { useStudents } from '@/hooks/use-students'
import { useAuth } from '@/hooks/use-auth'
import { format } from 'date-fns'
import Link from 'next/link'

export default function AttendancePage() {
  const { school } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  const { data: stats, isLoading: isLoadingStats } = useAttendanceStats(selectedDate)
  const { data: todayAttendance, isLoading: isLoadingToday } = useTodayAttendance()
  const { data: students, isLoading: isLoadingStudents } = useStudents()

  const today = new Date().toISOString().split('T')[0]
  const isToday = selectedDate === today

  if (isLoadingStats || isLoadingStudents) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Attendance</h1>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              <Calendar className="mr-2 h-4 w-4" />
              Select Date
            </Button>
            <Button disabled>
              Mark Attendance
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm-mobile:grid-cols-2 md-mobile:grid-cols-3 desktop:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">
            Manage daily attendance and track student presence
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            {format(new Date(selectedDate), 'MMM dd, yyyy')}
          </Button>
          <Button asChild>
            <Link href={`/attendance/mark/${selectedDate}`}>
              Mark Attendance
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm-mobile:grid-cols-2 md-mobile:grid-cols-3 desktop:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.present_today || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {students?.length ? Math.round((stats?.present_today || 0) / students.length * 100) : 0}% attendance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.absent_today || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Students absent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Today</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.late_today || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Students late
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm-mobile:grid-cols-2 md-mobile:grid-cols-3">
        <Link href={`/attendance/mark/${selectedDate}`}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Mark Attendance
              </CardTitle>
              <CardDescription>
                Record attendance for today's classes
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/attendance/reports">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                View Reports
              </CardTitle>
              <CardDescription>
                Generate attendance reports and analytics
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/attendance/analytics">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Analytics
              </CardTitle>
              <CardDescription>
                View attendance trends and patterns
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Today's Summary */}
      {isToday && todayAttendance && todayAttendance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance Summary</CardTitle>
            <CardDescription>
              Quick overview of today's attendance by class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.class_stats?.map((classStat) => (
                <div key={classStat.class} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{classStat.class}</h3>
                    <p className="text-sm text-muted-foreground">
                      {classStat.total_students} students
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {classStat.present}
                      </div>
                      <div className="text-xs text-muted-foreground">Present</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">
                        {classStat.absent}
                      </div>
                      <div className="text-xs text-muted-foreground">Absent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {classStat.late}
                      </div>
                      <div className="text-xs text-muted-foreground">Late</div>
                    </div>
                    <Badge variant={classStat.attendance_rate >= 90 ? 'default' : 'secondary'}>
                      {classStat.attendance_rate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest attendance updates and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayAttendance && todayAttendance.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Today's Attendance</span>
                  <Badge variant="outline">
                    {todayAttendance.length} records
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-2 sm-mobile:grid-cols-2 md-mobile:grid-cols-3">
                  {todayAttendance.slice(0, 6).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium text-sm">{record.student_name}</p>
                        <p className="text-xs text-muted-foreground">{record.class}</p>
                      </div>
                      <Badge 
                        variant={
                          record.status === 'present' ? 'default' :
                          record.status === 'absent' ? 'destructive' :
                          record.status === 'late' ? 'secondary' : 'outline'
                        }
                      >
                        {record.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                {todayAttendance.length > 6 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/attendance/mark/${today}`}>
                      View All ({todayAttendance.length} records)
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No attendance recorded for today</p>
                <Button className="mt-2" asChild>
                  <Link href={`/attendance/mark/${today}`}>
                    Mark Today's Attendance
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 