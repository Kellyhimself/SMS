export interface Attendance {
  id: string
  student_id: string
  school_id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  remarks?: string
  recorded_by?: string
  created_at: string
  updated_at: string
  sync_status?: 'pending' | 'synced'
  // Joined fields
  student_name?: string
  student_admission_number?: string
  class?: string
  recorded_by_name?: string
}

export interface AttendanceCreate {
  student_id: string
  school_id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  remarks?: string
  recorded_by?: string
}

export interface AttendanceUpdate {
  id: string
  status?: 'present' | 'absent' | 'late' | 'excused'
  remarks?: string
}

export interface AttendanceFilters {
  schoolId?: string
  studentId?: string
  class?: string
  date?: string
  startDate?: string
  endDate?: string
  status?: 'present' | 'absent' | 'late' | 'excused'
  sortBy?: 'date' | 'student_name' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface AttendanceSummary {
  student_id: string
  student_name: string
  class: string
  school_id: string
  present_count: number
  absent_count: number
  late_count: number
  excused_count: number
  total_days: number
  attendance_percentage: number
}

export interface BulkAttendanceEntry {
  date: string
  class: string
  entries: {
    student_id: string
    status: 'present' | 'absent' | 'late' | 'excused'
    remarks?: string
  }[]
}

export interface AttendanceStats {
  total_students: number
  present_today: number
  absent_today: number
  late_today: number
  excused_today: number
  attendance_rate: number
  class_stats: {
    class: string
    total_students: number
    present: number
    absent: number
    late: number
    excused: number
    attendance_rate: number
  }[]
}

export interface AttendanceReport {
  date: string
  class: string
  total_students: number
  present: number
  absent: number
  late: number
  excused: number
  attendance_rate: number
  absent_students: {
    id: string
    name: string
    admission_number?: string
    parent_phone?: string
  }[]
} 