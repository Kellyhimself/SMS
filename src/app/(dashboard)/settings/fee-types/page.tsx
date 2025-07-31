'use client'

import { useState } from 'react'
import { useFeeTypes, useCreateFeeType, useUpdateFeeType, useDeleteFeeType } from '@/hooks/use-fee-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import type { FeeTypeCreate, FeeTypeUpdate } from '@/types/fee'

export default function FeeTypesPage() {
  const { school } = useAuth()
  const { data: feeTypes, isLoading, error } = useFeeTypes()
  const createFeeType = useCreateFeeType()
  const updateFeeType = useUpdateFeeType()
  const deleteFeeType = useDeleteFeeType()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFeeType, setEditingFeeType] = useState<{ id: string; name: string; description: string } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Fee type name is required')
      return
    }

    try {
      if (editingFeeType) {
        await updateFeeType.mutateAsync({
          id: editingFeeType.id,
          data: {
            name: formData.name,
            description: formData.description || null
          }
        })
        toast.success('Fee type updated successfully')
      } else {
        await createFeeType.mutateAsync({
          school_id: school?.id || '',
          name: formData.name,
          description: formData.description || null
        })
        toast.success('Fee type created successfully')
      }
      
      setIsDialogOpen(false)
      setEditingFeeType(null)
      setFormData({ name: '', description: '' })
    } catch (error) {
      toast.error('Failed to save fee type')
    }
  }

  const handleEdit = (feeType: { id: string; name: string; description: string | null }) => {
    setEditingFeeType({
      id: feeType.id,
      name: feeType.name,
      description: feeType.description || ''
    })
    setFormData({
      name: feeType.name,
      description: feeType.description || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this fee type?')) {
      try {
        await deleteFeeType.mutateAsync(id)
        toast.success('Fee type deleted successfully')
      } catch (error) {
        toast.error('Failed to delete fee type')
      }
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingFeeType(null)
    setFormData({ name: '', description: '' })
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-4xl font-bold">Fee Types</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Fee Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Fee Type</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Tuition, Transport, Meals"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the fee type"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createFeeType.isPending || updateFeeType.isPending}>
                    {createFeeType.isPending || updateFeeType.isPending
                      ? 'Saving...'
                      : editingFeeType
                      ? 'Update Fee Type'
                      : 'Add Fee Type'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load fee types'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-4xl font-bold">Fee Types</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Fee Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFeeType ? 'Edit Fee Type' : 'Add New Fee Type'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Tuition, Transport, Meals"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the fee type"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createFeeType.isPending || updateFeeType.isPending}>
                  {createFeeType.isPending || updateFeeType.isPending
                    ? 'Saving...'
                    : editingFeeType
                    ? 'Update Fee Type'
                    : 'Add Fee Type'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading fee types...</div>
        </div>
      ) : !feeTypes || feeTypes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-muted-foreground">No fee types found</div>
              <div className="text-sm text-muted-foreground mt-2">
                Create fee types to categorize your fees (e.g., Tuition, Transport, Meals)
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {feeTypes.map((feeType) => (
            <Card key={feeType.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{feeType.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(feeType)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(feeType.id)}
                      disabled={deleteFeeType.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {feeType.description && (
                  <p className="text-sm text-muted-foreground">{feeType.description}</p>
                )}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-muted-foreground">
                    Created: {new Date(feeType.created_at).toLocaleDateString()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    feeType.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {feeType.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 