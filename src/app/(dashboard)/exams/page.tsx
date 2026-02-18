"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"
import { useExams } from "@/hooks/use-exams"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ALL_CLASS_OPTIONS } from "@/lib/constants/classes"
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

const EXAM_TYPES = ['Regular', 'Midterm', 'Final'] as const
const TERMS = ['Term 1', 'Term 2', 'Term 3'] as const

export default function ExamsPage() {
  const router = useRouter()
  const { user, school, isLoading: isAuthLoading } = useAuth()
  const [filters, setFilters] = useState({
    subject: '',
    grade: 'all',
    term: 'all',
    academic_year: '',
    exam_type: 'all',
    start_date: '',
    end_date: '',
    student_name: '',
  })
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const { data: exams = [], isLoading } = useExams({
    schoolId: school?.id,
    subject: filters.subject || undefined,
    term: filters.term !== 'all' ? filters.term : undefined,
    academic_year: filters.academic_year || undefined,
  })

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login")
      return
    }
  }, [isAuthLoading, user, router])

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      subject: '',
      grade: 'all',
      term: 'all',
      academic_year: '',
      exam_type: 'all',
      start_date: '',
      end_date: '',
      student_name: '',
    })
  }

  if (isAuthLoading || isLoading) {
    return <div>Loading...</div>
  }

  const filteredExams = exams.filter(exam => {
    if (filters.grade !== 'all' && exam.grade !== filters.grade) return false
    if (filters.exam_type !== 'all' && exam.exam_type !== filters.exam_type) return false
    if (filters.start_date && new Date(exam.date) < new Date(filters.start_date)) return false
    if (filters.end_date && new Date(exam.date) > new Date(filters.end_date)) return false
    if (filters.student_name && !exam.student?.name.toLowerCase().includes(filters.student_name.toLowerCase())) return false
    return true
  })

  return (
    <div className="container mx-auto py-10 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Exam Management</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <Link href="/exams/create">
            <Button className="w-full sm:w-auto">Create New Exam</Button>
          </Link>
          <Link href="/exams/report-cards">
            <Button variant="outline" className="w-full sm:w-auto">View Report Cards</Button>
          </Link>
        </div>
      </div>

      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} className="w-full mb-6">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full flex items-center justify-between px-4 py-2 text-base">
            <span>Filters</span>
            {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter exams by various criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="student_name">Student Name</Label>
                  <Input
                    id="student_name"
                    placeholder="Filter by student name"
                    value={filters.student_name}
                    onChange={(e) => handleFilterChange('student_name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Filter by subject"
                    value={filters.subject}
                    onChange={(e) => handleFilterChange('subject', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade">Class</Label>
                  <Select
                    value={filters.grade}
                    onValueChange={(value) => handleFilterChange('grade', value)}
                  >
                    <SelectTrigger id="grade">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {ALL_CLASS_OPTIONS.map((classOption) => (
                        <SelectItem key={classOption} value={classOption}>
                          {classOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="term">Term</Label>
                  <Select
                    value={filters.term}
                    onValueChange={(value) => handleFilterChange('term', value)}
                  >
                    <SelectTrigger id="term">
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Terms</SelectItem>
                      {TERMS.map((term) => (
                        <SelectItem key={term} value={term}>
                          {term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academic_year">Academic Year</Label>
                  <Input
                    id="academic_year"
                    placeholder="Filter by year"
                    value={filters.academic_year}
                    onChange={(e) => handleFilterChange('academic_year', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exam_type">Exam Type</Label>
                  <Select
                    value={filters.exam_type}
                    onValueChange={(value) => handleFilterChange('exam_type', value)}
                  >
                    <SelectTrigger id="exam_type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {EXAM_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      <Card>
        <CardHeader>
          <CardTitle>Exams</CardTitle>
          <CardDescription>
            View and manage all exams in your school
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[700px] text-xs sm:text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell>{new Date(exam.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {exam.student?.name}
                      {exam.student?.admission_number && (
                        <span className="text-muted-foreground ml-2">
                          ({exam.student.admission_number})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{exam.grade}</TableCell>
                    <TableCell>{exam.subject}</TableCell>
                    <TableCell>{exam.exam_type}</TableCell>
                    <TableCell>
                      {exam.score != null ? (
                        <span className={
                          exam.score >= 80 ? 'text-green-600 font-medium' :
                          exam.score >= 60 ? 'text-blue-600 font-medium' :
                          exam.score >= (exam.passing_marks || 40) ? 'text-yellow-600 font-medium' :
                          'text-red-600 font-medium'
                        }>
                          {exam.score}/{exam.total_marks}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{exam.term}</TableCell>
                    <TableCell>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Link href={`/exams/${exam.id}/results`}>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">Enter Results</Button>
                        </Link>
                        <Link href={`/exams/${exam.id}/edit`}>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">Edit</Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 