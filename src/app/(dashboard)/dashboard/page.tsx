'use client'
import { Card } from '@/components/ui/card'
import { School, Users, BookOpen, Bell, Calendar, Settings } from 'lucide-react'
import Link from 'next/link'
import { useStudents } from '@/hooks/use-students'
import { useAuth } from '@/hooks/use-auth'
import { getCommunications } from '@/app/actions/communications'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const { school } = useAuth()
  const { data: students } = useStudents()
  const [communications, setCommunications] = useState([])
  const [academicYear, setAcademicYear] = useState('')

  useEffect(() => {
    const fetchCommunications = async () => {
      if (school?.id) {
        const comms = await getCommunications(school.id)
        setCommunications(comms)
      }
    }
    fetchCommunications()
  }, [school?.id])

  useEffect(() => {
    // Calculate academic year based on current date
    const now = new Date()
    const year = now.getFullYear()
    setAcademicYear(`${year}`)
  }, [])

  // Get unique classes from students
  const activeClasses = students ? [...new Set(students.map(student => student.class))].length : 0

  // Get upcoming events (communications) from the last 7 days
  const upcomingEvents = communications.filter(comm => {
    const commDate = new Date(comm.createdAt)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return commDate >= sevenDaysAgo
  }).length

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
          <p className="text-muted-foreground">
            Here's an overview of your school management system
          </p>
        </div>
        <Link 
          href="/settings"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          <Settings className="mr-2 h-4 w-4" />
          Customize Dashboard
        </Link>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Students</p>
              <h3 className="text-2xl font-bold">{students?.length || 0}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Classes</p>
              <h3 className="text-2xl font-bold">{activeClasses}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Bell className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Notifications</p>
              <h3 className="text-2xl font-bold">{communications.filter(c => c.status === 'pending').length}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Upcoming Events</p>
              <h3 className="text-2xl font-bold">{upcomingEvents}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* School Profile and Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">School Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">School Name</p>
              <p className="font-medium">{school?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">{school?.address || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Academic Year</p>
              <p className="font-medium">{academicYear}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Term</p>
              <p className="font-medium">
                {(() => {
                  const month = new Date().getMonth() + 1
                  if (month >= 1 && month <= 4) return 'Term 1'
                  if (month >= 5 && month <= 8) return 'Term 2'
                  return 'Term 3'
                })()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {communications.slice(0, 5).map((comm, index) => (
              <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{comm.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(comm.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  comm.status === 'sent' ? 'bg-green-100 text-green-800' :
                  comm.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {comm.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Customizable Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Fee Collection Overview</h2>
          <div className="h-[200px] flex items-center justify-center bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">Chart will be displayed here</p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Attendance Summary</h2>
          <div className="h-[200px] flex items-center justify-center bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">Chart will be displayed here</p>
          </div>
        </Card>
      </div>
    </div>
  )
} 