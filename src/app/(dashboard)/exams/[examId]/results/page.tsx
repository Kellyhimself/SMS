"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import { useExam } from "@/hooks/use-exam"
import { useStudents } from "@/hooks/use-students"
import { getDB } from "@/lib/indexeddb/client"
import { syncService } from "@/lib/sync/sync-service"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"
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

interface ExamResult {
  student_id: string
  student_name: string
  score: number
  remarks: string
  teacher_remarks: string
  principal_remarks: string
  position?: number
}

export default function ExamResultsPage() {
  const { exam } = useExam()
  const { school } = useAuth()
  const { data: allStudents, isLoading: isLoadingStudents } = useStudents()
  const router = useRouter()
  const [results, setResults] = useState<ExamResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadResults = async () => {
      console.log('Loading results with:', { exam, school, allStudents })
      if (!exam || !school || !allStudents) {
        console.log('Missing required data:', { exam, school, allStudents })
        return
      }
      
      try {
        const db = await getDB()
        
        // Filter students based on exam grade
        const filteredStudents = allStudents.filter(student => 
          student.class === exam.grade
        )
        
        // Get existing exam results for this exam
        const existingResults = await db.getAllFromIndex('exams', 'by-school', school.id)
        console.log('Found existing results:', existingResults)
        
        // Filter results by exam subject, grade, term, and academic year
        const examResults = existingResults.filter(e => 
          e.subject === exam.subject && 
          e.grade === exam.grade && 
          e.term === exam.term && 
          e.academic_year === exam.academic_year
        )
        console.log('Filtered exam results:', examResults)
        
        // Create results array with filtered students
        let resultsWithStudents = filteredStudents.map(student => {
          const existingResult = examResults.find(r => r.student_id === student.id)
          return {
            student_id: student.id,
            student_name: student.name,
            score: existingResult?.score || 0,
            remarks: existingResult?.remarks || '',
            teacher_remarks: existingResult?.teacher_remarks || '',
            principal_remarks: existingResult?.principal_remarks || ''
          }
        })

        // Sort results by score in descending order
        resultsWithStudents.sort((a, b) => b.score - a.score)

        // Calculate positions
        let currentPosition = 1
        let currentScore = resultsWithStudents[0]?.score
        let sameScoreCount = 0

        resultsWithStudents = resultsWithStudents.map((result, index) => {
          if (index > 0) {
            if (result.score === currentScore) {
              sameScoreCount++
            } else {
              currentPosition = index + 1
              sameScoreCount = 0
              currentScore = result.score
            }
          }
          return {
            ...result,
            position: currentPosition
          }
        })

        console.log('Final results array with positions:', resultsWithStudents)
        
        setResults(resultsWithStudents)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading exam results:', error)
        toast.error('Failed to load exam results')
        setIsLoading(false)
      }
    }

    loadResults()
  }, [exam, school, allStudents])

  const handleResultChange = (studentId: string, field: keyof ExamResult, value: string | number) => {
    console.log('Handling result change:', { studentId, field, value })
    setResults(prev => {
      const newResults = prev.map(result => 
        result.student_id === studentId 
          ? { ...result, [field]: value }
          : result
      )
      console.log('Updated results:', newResults)
      return newResults
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!exam || !school) return

    try {
      const db = await getDB()
      
      // Get existing exam results for this exam
      const existingResults = await db.getAllFromIndex('exams', 'by-school', school.id)
      console.log('All existing results:', existingResults)
      
      // Filter results by exam subject, grade, term, and academic year
      const examResults = existingResults.filter(e => 
        e.subject === exam.subject && 
        e.grade === exam.grade && 
        e.term === exam.term && 
        e.academic_year === exam.academic_year
      )
      console.log('Filtered exam results:', examResults)
      
      // Update each student's exam results
      for (const result of results) {
        console.log('Processing result for student:', result.student_id)
        // Find existing exam record for this student
        const existingExam = examResults.find(e => e.student_id === result.student_id)
        console.log('Found existing exam:', existingExam)
        
        const updatedExam = {
          ...(existingExam || exam), // Use existing exam data if available, otherwise use base exam
          id: existingExam?.id || exam.id, // Keep existing ID if available
          student_id: result.student_id,
          school_id: school.id,
          score: Number(result.score),
          remarks: result.remarks || null,
          teacher_remarks: result.teacher_remarks || null,
          principal_remarks: result.principal_remarks || null,
          updated_at: new Date().toISOString(),
          sync_status: 'pending' as const
        }
        console.log('Updated exam data:', updatedExam)

        // Update in IndexedDB
        await db.put('exams', updatedExam)
        console.log('Updated in IndexedDB')
        
        // Queue for sync
        await syncService.queueSync('exams', 'update', updatedExam.id, updatedExam)
        console.log('Queued for sync')
      }
      
      toast.success('Results saved successfully')
      router.push('/exams')
    } catch (error) {
      console.error('Failed to save results:', error)
      toast.error('Failed to save results')
    }
  }

  if (!exam) {
    console.log('No exam data available')
    return <div>Loading exam data...</div>
  }

  if (isLoading || isLoadingStudents) {
    console.log('Loading results or students...')
    return <div>Loading...</div>
  }

  if (!results || results.length === 0) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>No Students Found</CardTitle>
            <CardDescription>
              No students found in grade {exam.grade} for {exam.subject}. Please add students to this grade before entering exam results.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  console.log('Rendering with results:', results)

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Enter Results - {exam.subject}</CardTitle>
          <CardDescription>
            Grade: {exam.grade} | Total Marks: {exam.total_marks} | Passing Marks: {exam.passing_marks}
            <br />
            Total Students: {results.length} out of {allStudents?.filter(s => s.class === exam.grade).length || 0}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Teacher Remarks</TableHead>
                    <TableHead>Principal Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.student_id}>
                      <TableCell>{result.position}</TableCell>
                      <TableCell>{result.student_name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={exam.total_marks}
                          value={result.score}
                          onChange={(e) => {
                            console.log('Score input change:', e.target.value)
                            handleResultChange(result.student_id, 'score', e.target.value)
                          }}
                          required
                          className="w-24"
                        />
                        <span className="text-sm text-gray-500 ml-2">/ {exam.total_marks}</span>
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={result.remarks}
                          onChange={(e) => {
                            console.log('Remarks input change:', e.target.value)
                            handleResultChange(result.student_id, 'remarks', e.target.value)
                          }}
                          placeholder="Enter remarks"
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={result.teacher_remarks}
                          onChange={(e) => {
                            console.log('Teacher remarks input change:', e.target.value)
                            handleResultChange(result.student_id, 'teacher_remarks', e.target.value)
                          }}
                          placeholder="Enter teacher's remarks"
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={result.principal_remarks}
                          onChange={(e) => {
                            console.log('Principal remarks input change:', e.target.value)
                            handleResultChange(result.student_id, 'principal_remarks', e.target.value)
                          }}
                          placeholder="Enter principal's remarks"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end mt-6 space-x-4">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={results.length === 0}>
                Save Results
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 