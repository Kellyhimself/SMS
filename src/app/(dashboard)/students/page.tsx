'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useStudents } from '@/hooks/use-students'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CLASS_OPTIONS } from '@/lib/constants/classes'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Download, Upload } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { studentService } from "@/services/student.service"

export default function StudentsPage() {
  const { school, isLoading: isAuthLoading } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [isImporting, setIsImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    console.log('Auth state:', { school, isAuthLoading })
  }, [school, isAuthLoading])

  const { data: students, isLoading, error } = useStudents({
    schoolId: school?.id,
    search: searchQuery,
    class: classFilter === 'all' ? '' : classFilter
  })

  useEffect(() => {
    console.log('Students data:', { students, isLoading, error })
  }, [students, isLoading, error])

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file to import')
      return
    }

    setIsImporting(true)
    try {
      const text = await importFile.text()
      const result = await studentService.bulkImportStudents(school?.id || '', text)
      
      if (result.success) {
        toast.success(result.message)
        // Refresh the students list
        queryClient.invalidateQueries({ queryKey: ['students', school?.id] })
      } else {
        toast.error(result.message)
        if (result.errors) {
          console.error('Import errors:', result.errors)
        }
      }
    } catch (error) {
      console.error('Import failed:', error)
      toast.error('Failed to import students')
    } finally {
      setIsImporting(false)
      setImportFile(null)
    }
  }

  const handleExport = async () => {
    try {
      const csvContent = await studentService.bulkExportStudents(school?.id || '')
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `students-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Students exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export students')
    }
  }

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p>Loading authentication...</p>
      </div>
    )
  }

  if (!school) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <p className="text-red-500">No school found. Please make sure you're logged in.</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <p className="text-red-500">Error loading students: {error.message}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Students</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Upload className="mr-2 h-4 w-4" />
                Import Students
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import Students</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="import-file">CSV File</Label>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium mb-2">Steps to import:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Download the CSV template</li>
                        <li>Open in Excel or similar</li>
                        <li>Fill in student details</li>
                        <li>Save as CSV</li>
                        <li>Upload here</li>
                      </ol>
                    </div>
                    <div>
                      <p className="font-medium mb-2">Required columns:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>name - Student's full name</li>
                        <li>class - Student's class</li>
                        <li>parent_phone - Parent's phone</li>
                      </ul>
                      <p className="font-medium mt-4 mb-2">Optional columns:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>parent_email - Parent's email</li>
                        <li>admission_number - Admission number</li>
                      </ul>
                    </div>
                  </div>
                  <p className="text-sm text-yellow-600 mt-2">Note: We recommend using Excel or a similar spreadsheet program to fill the template. This ensures proper formatting and reduces the chance of errors.</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={handleExport}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                  <Button 
                    onClick={handleImport} 
                    disabled={!importFile || isImporting}
                    className="w-full"
                  >
                    {isImporting ? 'Importing...' : 'Import'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Students
          </Button>
          <Link href="/students/new">
            <Button className="w-full sm:w-auto">Add New Student</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="search">Search Student</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="class">Filter by Class</Label>
            <Select
              value={classFilter}
              onValueChange={setClassFilter}
            >
              <SelectTrigger id="class">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {Object.entries(CLASS_OPTIONS).map(([category, classes]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      {category}
                    </div>
                    {classes.map((classOption) => (
                      <SelectItem key={classOption} value={classOption}>
                        {classOption}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : students?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[30vh] space-y-4 mt-6">
          <p className="text-muted-foreground">
            {searchQuery || classFilter 
              ? 'No students found matching your search criteria'
              : 'No students found'}
          </p>
          <Button asChild>
            <Link href="/students/new">Add Your First Student</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {students?.map((student) => (
            <Card key={student.id} className="hover:border-2 hover:border-yellow-400 hover:bg-transparent transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{student.name}</span>
                  {student.admission_number && (
                    <span className="text-sm text-muted-foreground">
                      #{student.admission_number}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Class: {student.class}</p>
                  <p className="text-sm text-gray-500">Parent Phone: {student.parent_phone}</p>
                  {student.parent_email && (
                    <p className="text-sm text-gray-500">Parent Email: {student.parent_email}</p>
                  )}
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/students/${student.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 