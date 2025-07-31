import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { parentService } from '@/services/parent.service'
import { useAuth } from '@/hooks/use-auth'
import type { 
  ParentAccountCreate, 
  ParentAccountUpdate, 
  ParentAccount,
  ParentStudentLinkCreate,
  ParentStudentLinkUpdate,
  ParentStudentLink,
  ParentDashboard,
  ParentFilters,
  ParentStudentLinkFilters
} from '@/types/parent'
import { toast } from 'sonner'

export function useParentAccounts(filters?: ParentFilters) {
  const { school } = useAuth()
  
  return useQuery({
    queryKey: ['parent-accounts', { schoolId: school?.id, ...filters }],
    queryFn: async () => {
      if (!school) throw new Error('School context is required')
      return await parentService.getParentAccounts({
        schoolId: school.id,
        ...filters
      })
    },
    enabled: !!school,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
  })
}

export function useExtractParentsFromStudents() {
  const queryClient = useQueryClient()
  const { school } = useAuth()

  return useMutation({
    mutationFn: async () => {
      if (!school) throw new Error('School context is required')
      
      try {
        console.log('Starting parent extraction...')
        const result = await parentService.extractParentsFromStudents(school.id)
        console.log('Parent extraction completed successfully')
        return result
      } catch (error) {
        console.error('Parent extraction failed:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['parent-accounts'] })
      toast.success(`Successfully extracted ${data.length} parent accounts from student data`)
    },
    onError: (error) => {
      console.error('Error extracting parents from students:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to extract parent accounts from student data'
      toast.error(errorMessage)
    }
  })
}

export function useCreateParentAccount() {
  const queryClient = useQueryClient()
  const { school } = useAuth()

  return useMutation({
    mutationFn: async (parentAccount: ParentAccountCreate) => {
      if (!school) throw new Error('School context is required')
      return await parentService.createParentAccount({
        ...parentAccount,
        school_id: school.id
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-accounts'] })
      toast.success('Parent account created successfully')
    },
    onError: (error) => {
      console.error('Error creating parent account:', error)
      toast.error('Failed to create parent account')
    }
  })
}

export function useUpdateParentAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ParentAccountUpdate }) => {
      return await parentService.updateParentAccount(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-accounts'] })
      toast.success('Parent account updated successfully')
    },
    onError: (error) => {
      console.error('Error updating parent account:', error)
      toast.error('Failed to update parent account')
    }
  })
}

export function useDeleteParentAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return await parentService.deleteParentAccount(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-accounts'] })
      toast.success('Parent account deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting parent account:', error)
      toast.error('Failed to delete parent account')
    }
  })
}

export function useParentStudentLinks(filters?: ParentStudentLinkFilters) {
  return useQuery({
    queryKey: ['parent-student-links', filters],
    queryFn: async () => {
      return await parentService.getParentStudentLinks(filters)
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    gcTime: 10 * 60 * 1000,
  })
}

export function useCreateParentStudentLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (link: ParentStudentLinkCreate) => {
      return await parentService.createParentStudentLink(link)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-student-links'] })
      toast.success('Parent-student link created successfully')
    },
    onError: (error) => {
      console.error('Error creating parent-student link:', error)
      toast.error('Failed to create parent-student link')
    }
  })
}

export function useUpdateParentStudentLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ParentStudentLinkUpdate }) => {
      return await parentService.updateParentStudentLink(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-student-links'] })
      toast.success('Parent-student link updated successfully')
    },
    onError: (error) => {
      console.error('Error updating parent-student link:', error)
      toast.error('Failed to update parent-student link')
    }
  })
}

export function useDeleteParentStudentLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return await parentService.deleteParentStudentLink(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-student-links'] })
      toast.success('Parent-student link deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting parent-student link:', error)
      toast.error('Failed to delete parent-student link')
    }
  })
}

export function useParentDashboard(parentId: string) {
  return useQuery({
    queryKey: ['parent-dashboard', parentId],
    queryFn: async () => {
      return await parentService.getParentDashboard(parentId)
    },
    enabled: !!parentId,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    gcTime: 10 * 60 * 1000,
  })
} 