'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useParentAccounts, useCreateParentAccount, useUpdateParentAccount, useDeleteParentAccount, useExtractParentsFromStudents } from '@/hooks/use-parents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Search, Users, Phone, Mail, Edit, Trash2, Download, RefreshCw, User, GraduationCap } from 'lucide-react'
import { parentService } from '@/services/parent.service'

export default function ParentsPage() {
  const { school } = useAuth()
  const { data: parentAccounts, isLoading, error, refetch } = useParentAccounts()
  const createParentAccount = useCreateParentAccount()
  const updateParentAccount = useUpdateParentAccount()
  const deleteParentAccount = useDeleteParentAccount()
  const extractParents = useExtractParentsFromStudents()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingParent, setEditingParent] = useState<{ id: string; name: string; phone: string; email: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [parentStudentLinks, setParentStudentLinks] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  })

  // Fetch parent-student links when parent accounts change
  useEffect(() => {
    const fetchParentStudentLinks = async () => {
      if (parentAccounts && parentAccounts.length > 0) {
        try {
          const links = await parentService.getParentStudentLinks()
          setParentStudentLinks(links)
        } catch (error) {
          console.error('Error fetching parent-student links:', error)
        }
      }
    }

    fetchParentStudentLinks()
  }, [parentAccounts])

  // Helper function to get students for a specific parent
  const getStudentsForParent = (parentId: string) => {
    return parentStudentLinks.filter(link => link.parent_id === parentId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.phone) {
      toast.error('Name and phone number are required')
      return
    }

    try {
      if (editingParent) {
        await updateParentAccount.mutateAsync({
          id: editingParent.id,
          data: {
            id: editingParent.id, // Add missing id
            name: formData.name,
            phone: formData.phone,
            email: formData.email || undefined
          }
        })
        setEditingParent(null)
      } else {
        await createParentAccount.mutateAsync({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          school_id: school?.id || '' // Add missing school_id
        })
      }
      
      setFormData({ name: '', phone: '', email: '' })
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving parent account:', error)
    }
  }

  const handleEdit = (parent: any) => {
    setEditingParent({
      id: parent.id,
      name: parent.name,
      phone: parent.phone,
      email: parent.email || ''
    })
    setFormData({
      name: parent.name,
      phone: parent.phone,
      email: parent.email || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this parent account?')) {
      try {
        await deleteParentAccount.mutateAsync(id)
      } catch (error) {
        console.error('Error deleting parent account:', error)
      }
    }
  }

  const handleExtractParents = async () => {
    try {
      await extractParents.mutateAsync()
    } catch (error) {
      console.error('Error extracting parents:', error)
    }
  }

  const filteredParents = parentAccounts?.filter(parent => {
    const matchesSearch = parent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         parent.phone.includes(searchQuery) ||
                         (parent.email && parent.email.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && parent.is_active) ||
                         (statusFilter === 'inactive' && !parent.is_active)
    
    return matchesSearch && matchesStatus
  }) || []

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Error loading parent accounts: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parent Accounts</h1>
          <p className="text-gray-600">Manage parent accounts and access</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExtractParents}
            disabled={extractParents.isPending}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${extractParents.isPending ? 'animate-spin' : ''}`} />
            {extractParents.isPending ? 'Extracting...' : 'Extract from Students'}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Parent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingParent ? 'Edit Parent Account' : 'Add New Parent Account'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter parent's full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingParent ? 'Update' : 'Add'} Parent
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search parents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Parents</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Parent Accounts List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredParents.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No parent accounts found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'Start by extracting parent accounts from existing student data or add them manually.'
                    }
                  </p>
                  {!searchQuery && statusFilter === 'all' && (
                    <div className="flex gap-2 justify-center">
                      <Button onClick={handleExtractParents} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Extract from Students
                      </Button>
                      <Button onClick={() => setIsDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Parent
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredParents.map((parent) => {
              const linkedStudents = getStudentsForParent(parent.id)
              return (
                <Card key={parent.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{parent.name}</h3>
                          <Badge variant={parent.is_active ? 'default' : 'secondary'}>
                            {parent.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {linkedStudents.length > 0 && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {linkedStudents.length} student{linkedStudents.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{parent.phone}</span>
                          </div>
                          {parent.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{parent.email}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Linked Students */}
                        {linkedStudents.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" />
                              Linked Students:
                            </h4>
                            <div className="space-y-2">
                              {linkedStudents.map((link) => (
                                <div key={link.id} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-lg">
                                  <User className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium">{link.student_name}</span>
                                  <span className="text-gray-500">•</span>
                                  <span className="text-gray-600">Class {link.class}</span>
                                  {link.is_primary && (
                                    <>
                                      <span className="text-gray-500">•</span>
                                      <Badge variant="secondary" className="text-xs">Primary</Badge>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(parent)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(parent.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Summary */}
      {filteredParents.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-600">
          Showing {filteredParents.length} of {parentAccounts?.length || 0} parent accounts
        </div>
      )}
    </div>
  )
} 