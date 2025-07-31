import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import type { 
  AttendanceFilters, 
  AttendanceCreate, 
  AttendanceUpdate, 
  Attendance,
  AttendanceStats,
  AttendanceReport,
  BulkAttendanceEntry
} from '@/types/attendance'
import { attendanceService } from '@/services/attendance.service'
import { toast } from 'sonner'

export function useAttendance(filters?: AttendanceFilters) {
  const { school } = useAuth()
  
  return useQuery({
    queryKey: ['attendance', { schoolId: school?.id, ...filters }],
    queryFn: async () => {
      if (!school) throw new Error('School context is required')
      
      try {
        const attendance = await attendanceService.getAttendance({
          schoolId: school.id,
          ...filters
        })
        
        return attendance.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      } catch (error) {
        console.error('Error fetching attendance:', error)
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

export function useCreateAttendance() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: attendanceService.createAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Attendance recorded successfully')
    },
    onError: (error) => {
      console.error('Error creating attendance:', error)
      toast.error('Failed to record attendance')
    }
  })
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: attendanceService.updateAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Attendance updated successfully')
    },
    onError: (error) => {
      console.error('Error updating attendance:', error)
      toast.error('Failed to update attendance')
    }
  })
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: attendanceService.deleteAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Attendance deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting attendance:', error)
      toast.error('Failed to delete attendance')
    }
  })
}

export function useBulkCreateAttendance() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: async ({ entries, schoolId }: { entries: BulkAttendanceEntry, schoolId: string }) => {
      return attendanceService.bulkCreateAttendance(entries, schoolId, user?.id)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success(`Attendance recorded for ${data.length} students`)
    },
    onError: (error) => {
      console.error('Error bulk creating attendance:', error)
      toast.error('Failed to record attendance')
    }
  })
}

export function useAttendanceStats(date?: string) {
  const { school } = useAuth()
  
  return useQuery({
    queryKey: ['attendance-stats', { schoolId: school?.id, date }],
    queryFn: async () => {
      if (!school) throw new Error('School context is required')
      
      try {
        return await attendanceService.getAttendanceStats(school.id, date)
      } catch (error) {
        console.error('Error fetching attendance stats:', error)
        throw error
      }
    },
    enabled: !!school,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}

export function useAttendanceReport(date: string, className?: string) {
  const { school } = useAuth()
  
  return useQuery({
    queryKey: ['attendance-report', { schoolId: school?.id, date, className }],
    queryFn: async () => {
      if (!school) throw new Error('School context is required')
      
      try {
        return await attendanceService.getAttendanceReport(school.id, date, className)
      } catch (error) {
        console.error('Error fetching attendance report:', error)
        throw error
      }
    },
    enabled: !!school && !!date,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnMount: true,
  })
}

export function useTodayAttendance() {
  const { school } = useAuth()
  const today = new Date().toISOString().split('T')[0]
  
  return useQuery({
    queryKey: ['today-attendance', { schoolId: school?.id, date: today }],
    queryFn: async () => {
      if (!school) throw new Error('School context is required')
      
      try {
        return await attendanceService.getAttendance({
          schoolId: school.id,
          date: today
        })
      } catch (error) {
        console.error('Error fetching today\'s attendance:', error)
        throw error
      }
    },
    enabled: !!school,
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}

export function useStudentAttendance(studentId: string, startDate?: string, endDate?: string) {
  const { school } = useAuth()
  
  return useQuery({
    queryKey: ['student-attendance', { schoolId: school?.id, studentId, startDate, endDate }],
    queryFn: async () => {
      if (!school) throw new Error('School context is required')
      
      try {
        return await attendanceService.getAttendance({
          schoolId: school.id,
          studentId,
          startDate,
          endDate,
          sortBy: 'date',
          sortOrder: 'desc'
        })
      } catch (error) {
        console.error('Error fetching student attendance:', error)
        throw error
      }
    },
    enabled: !!school && !!studentId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnMount: true,
  })
} 