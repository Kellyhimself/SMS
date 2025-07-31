'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Save, 
  ArrowLeft,
  Users,
  Calendar
} from 'lucide-react'
import { useStudents } from '@/hooks/use-students'
import { useAttendance, useBulkCreateAttendance } from '@/hooks/use-attendance'
import { useAuth } from '@/hooks/use-auth'
import { format } from 'date-fns'
import Link from 'next/link'
import { toast } from 'sonner'

interface AttendanceEntry {
  student_id: string
  status: 'present' | 'absent' | 'late' | 'excused'
  remarks?: string
}

export default function MarkAttendancePage() {
  const params = useParams()
  const router = useRouter()
  const { school, user } = useAuth()
  const date = params.date as string
  
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [attendanceEntries, setAttendanceEntries] = useState<Record<string, AttendanceEntry>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: students, isLoading: isLoadingStudents } = useStudents()
  const { data: existingAttendance, isLoading: isLoadingAttendance } = useAttendance({
    date,
    class: selectedClass
  })
  const bulkCreateMutation = useBulkCreateAttendance()

  // Get unique classes from students
  const classes = students ? [...new Set(students.map(student => student.class))].sort() : []

  // Filter students by selected class
  const classStudents = selectedClass && students 
    ? students.filter(student => student.class === selectedClass) 
    : []

  // Initialize attendance entries when class or existing attendance changes
  useEffect(() => {
    if (selectedClass && students && students.length > 0) {
      const classStudents = students.filter(student => student.class === selectedClass)
      
      if (classStudents.length > 0) {
        const initialEntries: Record<string, AttendanceEntry> = {}
        
        classStudents.forEach(student => {
          // Check if attendance already exists for this student
          const existing = existingAttendance?.find(a => a.student_id === student.id)
          
          initialEntries[student.id] = {
            student_id: student.id,
            status: existing?.status || 'present', // Default to present
            remarks: existing?.remarks || ''
          }
        })
        
        setAttendanceEntries(initialEntries)
      }
    }
  }, [selectedClass, students, existingAttendance])

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendanceEntries(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }))
  }

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceEntries(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }))
  }

  const handleBulkAction = (status: 'present' | 'absent' | 'late' | 'excused') => {
    const newEntries = { ...attendanceEntries }
    Object.keys(newEntries).forEach(studentId => {
      newEntries[studentId].status = status
    })
    setAttendanceEntries(newEntries)
    toast.success(`Marked all students as ${status}`)
  }

  const handleSubmit = async () => {
    if (!school || !selectedClass || Object.keys(attendanceEntries).length === 0) {
      toast.error('Please select a class and mark attendance')
      return
    }

    setIsSubmitting(true)
    try {
      const entries = Object.values(attendanceEntries)
      
      await bulkCreateMutation.mutateAsync({
        entries: {
          date,
          class: selectedClass,
          entries
        },
        schoolId: school.id
      })

      toast.success('Attendance recorded successfully')
      router.push('/attendance')
    } catch (error) {
      console.error('Error recording attendance:', error)
      toast.error('Failed to record attendance')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'late':
        return <Clock className="h-4 w-4 text-orange-600" />
      case 'excused':
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800'
      case 'absent':
        return 'bg-red-100 text-red-800'
      case 'late':
        return 'bg-orange-100 text-orange-800'
      case 'excused':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoadingStudents) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/attendance">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-4xl font-bold">Mark Attendance</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-48"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/attendance">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-4xl font-bold">Mark Attendance</h1>
          <p className="text-muted-foreground">
            Record attendance for {format(new Date(date), 'EEEE, MMMM dd, yyyy')}
          </p>
        </div>
      </div>

      {/* Class Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Class
          </CardTitle>
          <CardDescription>
            Choose the class to mark attendance for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full sm-mobile:w-64">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map(className => (
                <SelectItem key={className} value={className}>
                  {className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Attendance Marking */}
      {selectedClass && (
        <>
          {/* Bulk Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Mark all students at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('present')}
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark All Present
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('absent')}
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Mark All Absent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('late')}
                  className="border-orange-200 text-orange-700 hover:bg-orange-50"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Mark All Late
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('excused')}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Mark All Excused
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Student List */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedClass} - {classStudents.length} Students
              </CardTitle>
              <CardDescription>
                Mark attendance for each student
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {classStudents.map(student => {
                  const entry = attendanceEntries[student.id]
                  if (!entry) return null

                  return (
                    <div key={student.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {student.admission_number}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant={entry.status === 'present' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleStatusChange(student.id, 'present')}
                          className="h-8 px-3"
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Present
                        </Button>
                        <Button
                          variant={entry.status === 'absent' ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => handleStatusChange(student.id, 'absent')}
                          className="h-8 px-3"
                        >
                          <XCircle className="mr-1 h-3 w-3" />
                          Absent
                        </Button>
                        <Button
                          variant={entry.status === 'late' ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => handleStatusChange(student.id, 'late')}
                          className="h-8 px-3"
                        >
                          <Clock className="mr-1 h-3 w-3" />
                          Late
                        </Button>
                        <Button
                          variant={entry.status === 'excused' ? 'outline' : 'outline'}
                          size="sm"
                          onClick={() => handleStatusChange(student.id, 'excused')}
                          className="h-8 px-3"
                        >
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Excused
                        </Button>
                      </div>

                      <div className="w-32">
                        <Input
                          placeholder="Remarks"
                          value={entry.remarks || ''}
                          onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>

                      <Badge className={getStatusColor(entry.status)}>
                        {getStatusIcon(entry.status)}
                        <span className="ml-1">{entry.status}</span>
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild>
              <Link href="/attendance">
                Cancel
              </Link>
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(attendanceEntries).length === 0}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        </>
      )}

      {/* No Class Selected */}
      {!selectedClass && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a Class</h3>
            <p className="text-muted-foreground">
              Choose a class from the dropdown above to start marking attendance
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 