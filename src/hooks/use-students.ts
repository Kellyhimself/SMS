import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import type { StudentFilters, StudentCreate, StudentUpdate, Student } from '@/types/student'
import { studentService } from '@/services/student.service'
import { toast } from 'sonner'
import { getDB } from '@/lib/indexeddb/client'
import { addToSyncQueue } from '@/lib/sync/sync-service'

export function useStudents(filters?: StudentFilters) {
  const { school } = useAuth()
  
  return useQuery({
    queryKey: ['students', { schoolId: school?.id, search: filters?.search || '', class: filters?.class || '' }],
    queryFn: async () => {
      if (!school) throw new Error('School context is required')
      
      try {
        // Get students from service (which now handles offline/online logic)
        const students = await studentService.getStudents(school.id, { 
          class: filters?.class,
          search: filters?.search 
        })
        
        return students.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      } catch (error) {
        console.error('Error fetching students:', error)
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

export function useStudent(id: string) {
  const { school } = useAuth()

  return useQuery({
    queryKey: ['students', id, school?.id],
    queryFn: async () => {
      if (!school) throw new Error('School context is required')
      return studentService.getStudent(id)
    },
    enabled: !!school && !!id,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    gcTime: 10 * 60 * 1000,
  })
}

export async function createStudentOffline(data: StudentCreate) {
  const now = new Date().toISOString();
  const newStudent: Student = {
    ...data,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
    sync_status: 'pending',
    parent_email: data.parent_email || null,
    admission_number: data.admission_number || null
  };
  const db = await getDB();
  await db.put('students', newStudent);
  // Add to sync queue
  await addToSyncQueue('students', newStudent.id, 'create', newStudent);
  return newStudent;
}

export function useCreateStudent() {
  const queryClient = useQueryClient()
  const { user, school } = useAuth()

  return useMutation({
    mutationFn: async (data: StudentCreate) => {
      if (!user || !school) {
        throw new Error('User must be authenticated and have a school to create a student')
      }

      // Verify that the school_id matches
      if (data.school_id !== user.school_id) {
        throw new Error('Cannot create student for a different school')
      }

      const student = await studentService.createStudent(data)
      return student
    },
    onSuccess: (data) => {
      // Update cache with the new student
      queryClient.setQueryData<Student[]>(
        ['students', { schoolId: school?.id }],
        (oldData) => {
          if (!oldData) return [data]
          return [data, ...oldData]
        }
      )
      
      // Show appropriate message based on online status
      if (!navigator.onLine) {
        toast.success('Student created offline. Will sync when online.')
      } else {
        toast.success('Student created successfully')
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create student')
    }
  })
}

export function useUpdateStudent() {
  const queryClient = useQueryClient()
  const { user, school } = useAuth()

  return useMutation({
    mutationFn: async (data: StudentUpdate & { id: string }) => {
      if (!user || !school) {
        throw new Error('User must be authenticated and have a school to update a student')
      }

      // Verify that the school_id matches
      if (data.school_id !== user.school_id) {
        throw new Error('Cannot update student for a different school')
      }

      const student = await studentService.updateStudent(data.id, data)
      return student
    },
    onSuccess: (data, variables) => {
      // Update the cache with the updated student
      queryClient.setQueryData<Student[]>(
        ['students', { schoolId: school?.id }],
        (oldData) => {
          if (!oldData) return [data]
          return oldData.map((student) => 
            student.id === variables.id ? data : student
          )
        }
      )
      
      // Update individual student cache
      queryClient.setQueryData<Student>(
        ['students', variables.id, school?.id],
        data
      )

      // Show appropriate message based on online status
      if (!navigator.onLine) {
        toast.success('Student updated offline. Will sync when online.')
      } else {
        toast.success('Student updated successfully')
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update student')
    }
  })
}

export function useDeleteStudent() {
  const queryClient = useQueryClient()
  const { user, school } = useAuth()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user || !school) {
        throw new Error('User must be authenticated and have a school to delete a student')
      }

      // First get the student to verify school_id
      const student = await studentService.getStudent(id)
      if (student.school_id !== user.school_id) {
        throw new Error('Cannot delete student from a different school')
      }

      await studentService.deleteStudent(id)
    },
    onSuccess: (_, id) => {
      // Remove the student from the cache
      queryClient.setQueryData<Student[]>(
        ['students', { schoolId: school?.id }],
        (oldData) => {
          if (!oldData) return []
          return oldData.filter((student) => student.id !== id)
        }
      )
      
      // Remove individual student cache
      queryClient.removeQueries({ queryKey: ['students', id, school?.id] })

      // Show appropriate message based on online status
      if (!navigator.onLine) {
        toast.success('Student deleted offline. Will sync when online.')
      } else {
        toast.success('Student deleted successfully')
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete student')
    }
  })
}