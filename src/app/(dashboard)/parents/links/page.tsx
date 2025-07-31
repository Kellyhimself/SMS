'use client'

import { useState } from 'react'
import { useParentStudentLinks, useCreateParentStudentLink, useUpdateParentStudentLink, useDeleteParentStudentLink } from '@/hooks/use-parents'
import { useParentAccounts } from '@/hooks/use-parents'
import { useStudents } from '@/hooks/use-students'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Users, Search, Filter, Link, Unlink } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import type { ParentStudentLinkCreate, ParentStudentLinkUpdate } from '@/types/parent'

export default function ParentStudentLinksPage() {
  const { school } = useAuth()
  const { data: links, isLoading, error } = useParentStudentLinks()
  const { data: parentAccounts } = useParentAccounts()
  const { data: students } = useStudents()
  const createLink = useCreateParentStudentLink()
  const updateLink = useUpdateParentStudentLink()
  const deleteLink = useDeleteParentStudentLink()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<{ id: string; parent_id: string; student_id: string; relationship: string; is_primary: boolean } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [parentFilter, setParentFilter] = useState<string>('all')
  const [studentFilter, setStudentFilter] = useState<string>('all')
  const [formData, setFormData] = useState({
    parent_id: '',
    student_id: '',
    relationship: 'parent',
    is_primary: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.parent_id || !formData.student_id) {
      toast.error('Parent and student are required')
      return
    }

    try {
      if (editingLink) {
        await updateLink.mutateAsync({
          id: editingLink.id,
          data: {
            relationship: formData.relationship,
            is_primary: formData.is_primary
          }
        })
        setEditingLink(null)
      } else {
        await createLink.mutateAsync({
          parent_id: formData.parent_id,
          student_id: formData.student_id,
          relationship: formData.relationship,
          is_primary: formData.is_primary
        })
      }
      
      setFormData({ parent_id: '', student_id: '', relationship: 'parent', is_primary: false })
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving parent-student link:', error)
    }
  }

  const handleEdit = (link: any) => {
    setEditingLink({
      id: link.id,
      parent_id: link.parent_id,
      student_id: link.student_id,
      relationship: link.relationship,
      is_primary: link.is_primary
    })
    setFormData({
      parent_id: link.parent_id,
      student_id: link.student_id,
      relationship: link.relationship,
      is_primary: link.is_primary
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this parent-student link?')) {
      try {
        await deleteLink.mutateAsync(id)
      } catch (error) {
        console.error('Error deleting parent-student link:', error)
      }
    }
  }

  // Filter links
  const filteredLinks = links?.filter(link => {
    const matchesSearch = !searchQuery || 
      link.parent_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.parent_phone?.includes(searchQuery) ||
      link.student_admission_number?.includes(searchQuery)
    
    const matchesParent = parentFilter === 'all' || link.parent_id === parentFilter
    const matchesStudent = studentFilter === 'all' || link.student_id === studentFilter
    
    return matchesSearch && matchesParent && matchesStudent
  })

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-4xl font-bold">Parent-Student Links</h1>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Link
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load parent-student links. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Parent-Student Links</h1>
          <p className="text-muted-foreground">Manage connections between parents and students</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLink ? 'Edit Parent-Student Link' : 'Add New Parent-Student Link'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="parent_id">Parent</Label>
                <Select 
                  value={formData.parent_id} 
                  onValueChange={(value) => setFormData({ ...formData, parent_id: value })}
                  disabled={!!editingLink}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentAccounts?.map((parent) => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.name} ({parent.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="student_id">Student</Label>
                <Select 
                  value={formData.student_id} 
                  onValueChange={(value) => setFormData({ ...formData, student_id: value })}
                  disabled={!!editingLink}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} - {student.class} ({student.admission_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="relationship">Relationship</Label>
                <Select 
                  value={formData.relationship} 
                  onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="step-parent">Step Parent</SelectItem>
                    <SelectItem value="grandparent">Grandparent</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={formData.is_primary}
                  onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_primary">Primary Contact</Label>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createLink.isPending || updateLink.isPending}>
                  {editingLink ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by parent name, student name, phone, or admission number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={parentFilter} onValueChange={setParentFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by parent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Parents</SelectItem>
            {parentAccounts?.map((parent) => (
              <SelectItem key={parent.id} value={parent.id}>
                {parent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={studentFilter} onValueChange={setStudentFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by student" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            {students?.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name} - {student.class}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Parent-Student Links Table */}
      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Loading links...</p>
          </CardContent>
        </Card>
      ) : filteredLinks?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Link className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No links found</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery || parentFilter !== 'all' || studentFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first parent-student link'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Parent-Student Links</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Contact Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLinks?.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{link.parent_name}</div>
                        <div className="text-sm text-muted-foreground">{link.parent_phone}</div>
                        {link.parent_email && (
                          <div className="text-sm text-muted-foreground">{link.parent_email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{link.student_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {link.class} - {link.student_admission_number}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {link.relationship}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {link.is_primary ? (
                        <Badge variant="default">Primary</Badge>
                      ) : (
                        <Badge variant="secondary">Secondary</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(link)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(link.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{links?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Parent-student connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primary Contacts</CardTitle>
            <Badge variant="default" className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {links?.filter(l => l.is_primary).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Primary parent contacts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students with Parents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(links?.map(l => l.student_id) || []).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Students with parent links
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 