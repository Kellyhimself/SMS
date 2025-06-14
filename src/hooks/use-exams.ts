import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './use-auth'
import { examService } from '@/services/exam.service'
import { toast } from 'sonner'
import type { Tables } from '@/types/supabase'

export type Exam = Tables<'exams'> & {
  sync_status: 'synced' | 'pending'
}

export type CreateExamData = Omit<Exam, 'id' | 'created_at' | 'updated_at' | 'sync_status'>

export function useExams(filters?: { class?: string; term?: string; academic_year?: string }) {
  const { school } = useAuth()

  return useQuery({
    queryKey: ['exams', { schoolId: school?.id, ...filters }],
    queryFn: async () => {
      if (!school) throw new Error('School context is required')

      try {
        // Get exams from service (which now handles offline/online logic)
        const exams = await examService.getAll({
          schoolId: school.id,
          ...filters
        })
        
        return exams.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      } catch (error) {
        console.error('Error fetching exams:', error)
        throw error
      }
    },
    enabled: !!school,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
  })
}

export function useCreateExam() {
  const queryClient = useQueryClient()
  const { school } = useAuth()

  return useMutation({
    mutationFn: async (data: CreateExamData) => {
      if (!school) throw new Error('School context is required')

      console.log('Creating exam with data:', data)
      const newExam = await examService.create({
        ...data,
        school_id: school.id
      })
      return newExam
    },
    onSuccess: async (data) => {
      console.log('Exam created successfully:', data)
      
      // Update the cache with the new exam
      queryClient.setQueryData<Exam[]>(
        ['exams', { schoolId: school?.id }],
        (oldData) => {
          if (!oldData) return [data]
          return [data, ...oldData]
        }
      )
    },
    onError: (error) => {
      console.error('Error creating exam:', error)
      toast.error('Failed to create exam')
    }
  })
}

export function useUpdateExam() {
  const queryClient = useQueryClient()
  const { school } = useAuth()

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Exam> & { id: string }) => {
      if (!school) throw new Error('School context is required')

      const updatedExam = await examService.update({ id, ...data })
      return updatedExam
    },
    onSuccess: (data, variables) => {
      // Update the cache with the updated exam
      queryClient.setQueryData<Exam[]>(
        ['exams', { schoolId: school?.id }],
        (oldData) => {
          if (!oldData) return [data]
          return oldData.map((exam) => 
            exam.id === variables.id ? data : exam
          )
        }
      )
    },
    onError: (error) => {
      console.error('Error updating exam:', error)
      toast.error('Failed to update exam')
    }
  })
}

export function useDeleteExam() {
  const queryClient = useQueryClient()
  const { school } = useAuth()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!school) throw new Error('School context is required')

      await examService.delete(id)
      return id
    },
    onSuccess: (_, id) => {
      // Remove the exam from the cache
      queryClient.setQueryData<Exam[]>(
        ['exams', { schoolId: school?.id }],
        (oldData) => {
          if (!oldData) return []
          return oldData.filter((exam) => exam.id !== id)
        }
      )
    },
    onError: (error) => {
      console.error('Error deleting exam:', error)
      toast.error('Failed to delete exam')
    }
  })
} 