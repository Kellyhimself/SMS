import { supabase } from '@/lib/supabase/client'
import { getDB } from '@/lib/indexeddb/client'
import type { 
  Attendance, 
  AttendanceCreate, 
  AttendanceUpdate, 
  AttendanceFilters,
  AttendanceSummary,
  AttendanceStats,
  AttendanceReport,
  BulkAttendanceEntry
} from '@/types/attendance'
import { addToSyncQueue } from '@/lib/sync/sync-service'

function transformAttendance(attendance: any): Attendance {
  return {
    id: attendance.id,
    student_id: attendance.student_id,
    school_id: attendance.school_id,
    date: attendance.date,
    status: attendance.status,
    remarks: attendance.remarks,
    recorded_by: attendance.recorded_by,
    created_at: attendance.created_at,
    updated_at: attendance.updated_at,
    sync_status: attendance.sync_status || 'pending',
    student_name: attendance.student_name,
    student_admission_number: attendance.student_admission_number,
    class: attendance.class,
    recorded_by_name: attendance.recorded_by_name
  }
}

export const attendanceService = {
  async getAttendance(filters?: AttendanceFilters): Promise<Attendance[]> {
    const db = await getDB()
    
    // Always get from IndexedDB first
    let attendance: any[] = []
    
    if (filters?.schoolId) {
      attendance = await db.getAllFromIndex('attendance', 'by-school', filters.schoolId)
    } else {
      attendance = await db.getAll('attendance')
    }
    
    // Apply additional filters to offline data
    if (filters?.date) {
      attendance = attendance.filter(a => a.date === filters.date)
    }
    if (filters?.studentId) {
      attendance = attendance.filter(a => a.student_id === filters.studentId)
    }
    if (filters?.status) {
      attendance = attendance.filter(a => a.status === filters.status)
    }
    if (filters?.startDate) {
      attendance = attendance.filter(a => a.date >= filters.startDate!)
    }
    if (filters?.endDate) {
      attendance = attendance.filter(a => a.date <= filters.endDate!)
    }
    
    // If online, fetch from Supabase and update IndexedDB
    if (navigator.onLine) {
      try {
        let query = supabase
          .from('attendance')
          .select(`
            *,
            students!inner(name, admission_number, class)
          `)

        if (filters?.schoolId) {
          query = query.eq('school_id', filters.schoolId)
        }
        if (filters?.studentId) {
          query = query.eq('student_id', filters.studentId)
        }
        if (filters?.date) {
          query = query.eq('date', filters.date)
        }
        if (filters?.status) {
          query = query.eq('status', filters.status)
        }
        if (filters?.startDate) {
          query = query.gte('date', filters.startDate)
        }
        if (filters?.endDate) {
          query = query.lte('date', filters.endDate)
        }
        if (filters?.sortBy) {
          query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' })
        } else {
          query = query.order('date', { ascending: false })
        }

        const { data: supabaseAttendance, error } = await query

        if (error) throw error

        // Update IndexedDB with Supabase data
        for (const record of supabaseAttendance) {
          const attendanceRecord = {
            ...record,
            student_name: record.students?.name,
            student_admission_number: record.students?.admission_number,
            class: record.students?.class,
            sync_status: 'synced' as const
          }
          await db.put('attendance', attendanceRecord)
        }

        return supabaseAttendance.map(record => ({
          ...record,
          student_name: record.students?.name,
          student_admission_number: record.students?.admission_number,
          class: record.students?.class,
          sync_status: 'synced' as const
        })) as Attendance[]
      } catch (error) {
        console.error('Error fetching attendance from Supabase:', error)
        // Return IndexedDB data if Supabase fetch fails
        return attendance.map(transformAttendance)
      }
    }

    return attendance.map(transformAttendance)
  },

  async createAttendance(attendance: AttendanceCreate): Promise<Attendance> {
    const db = await getDB()
    const now = new Date().toISOString()
    
    const newAttendance = {
      id: crypto.randomUUID(),
      ...attendance,
      created_at: now,
      updated_at: now,
      sync_status: 'pending' as const
    }

    // Add to IndexedDB
    await db.put('attendance', newAttendance)

    // Add to sync queue
    await addToSyncQueue('attendance', newAttendance.id, 'create', newAttendance)

    // If online, try to sync immediately
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .insert(attendance)
          .select(`
            *,
            students!inner(name, admission_number, class)
          `)
          .single()

        if (error) throw error

        // Update IndexedDB with synced data
        const syncedRecord = {
          ...data,
          student_name: data.students?.name,
          student_admission_number: data.students?.admission_number,
          class: data.students?.class,
          sync_status: 'synced' as const
        }
        await db.put('attendance', syncedRecord)

        return transformAttendance(syncedRecord)
      } catch (error) {
        console.error('Error creating attendance in Supabase:', error)
        // Return local data if sync fails
        return transformAttendance(newAttendance)
      }
    }

    return transformAttendance(newAttendance)
  },

  async updateAttendance(attendance: AttendanceUpdate): Promise<Attendance> {
    const db = await getDB()
    const now = new Date().toISOString()
    
    // Get existing record
    const existing = await db.get('attendance', attendance.id)
    if (!existing) {
      throw new Error('Attendance record not found')
    }

    const updatedAttendance = {
      ...existing,
      ...attendance,
      updated_at: now,
      sync_status: 'pending' as const
    }

    // Update IndexedDB
    await db.put('attendance', updatedAttendance)

    // Add to sync queue
    await addToSyncQueue('attendance', attendance.id, 'update', attendance)

    // If online, try to sync immediately
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .update(attendance)
          .eq('id', attendance.id)
          .select(`
            *,
            students!inner(name, admission_number, class)
          `)
          .single()

        if (error) throw error

        // Update IndexedDB with synced data
        const syncedRecord = {
          ...data,
          student_name: data.students?.name,
          student_admission_number: data.students?.admission_number,
          class: data.students?.class,
          sync_status: 'synced' as const
        }
        await db.put('attendance', syncedRecord)

        return transformAttendance(syncedRecord)
      } catch (error) {
        console.error('Error updating attendance in Supabase:', error)
        // Return local data if sync fails
        return transformAttendance(updatedAttendance)
      }
    }

    return transformAttendance(updatedAttendance)
  },

  async deleteAttendance(id: string): Promise<void> {
    const db = await getDB()
    
    // Delete from IndexedDB
    await db.delete('attendance', id)

    // Add to sync queue
    await addToSyncQueue('attendance', id, 'delete', null)

    // If online, try to sync immediately
    if (navigator.onLine) {
      try {
        const { error } = await supabase
          .from('attendance')
          .delete()
          .eq('id', id)

        if (error) throw error
      } catch (error) {
        console.error('Error deleting attendance from Supabase:', error)
        // Data will be synced later via sync queue
      }
    }
  },

  async bulkCreateAttendance(entries: BulkAttendanceEntry, schoolId: string, recordedBy?: string): Promise<Attendance[]> {
    const db = await getDB()
    const now = new Date().toISOString()
    const createdAttendance: Attendance[] = []

    for (const entry of entries.entries) {
      const newAttendance = {
        id: crypto.randomUUID(),
        student_id: entry.student_id,
        school_id: schoolId,
        date: entries.date,
        status: entry.status,
        remarks: entry.remarks,
        recorded_by: recordedBy,
        created_at: now,
        updated_at: now,
        sync_status: 'pending' as const
      }

      // Add to IndexedDB
      await db.put('attendance', newAttendance)

      // Add to sync queue
      await addToSyncQueue('attendance', newAttendance.id, 'create', newAttendance)

      createdAttendance.push(transformAttendance(newAttendance))
    }

    // If online, try to sync immediately
    if (navigator.onLine) {
      try {
        const attendanceData = entries.entries.map(entry => ({
          student_id: entry.student_id,
          school_id: schoolId,
          date: entries.date,
          status: entry.status,
          remarks: entry.remarks,
          recorded_by: recordedBy
        }))

        const { data, error } = await supabase
          .from('attendance')
          .insert(attendanceData)
          .select(`
            *,
            students!inner(name, admission_number, class)
          `)

        if (error) throw error

        // Update IndexedDB with synced data
        for (const record of data) {
          const syncedRecord = {
            ...record,
            student_name: record.students?.name,
            student_admission_number: record.students?.admission_number,
            class: record.students?.class,
            sync_status: 'synced' as const
          }
          await db.put('attendance', syncedRecord)
        }

        return data.map(record => ({
          ...record,
          student_name: record.students?.name,
          student_admission_number: record.students?.admission_number,
          class: record.students?.class,
          sync_status: 'synced' as const
        })) as Attendance[]
      } catch (error) {
        console.error('Error bulk creating attendance in Supabase:', error)
        // Return local data if sync fails
        return createdAttendance
      }
    }

    return createdAttendance
  },

  async getAttendanceStats(schoolId: string, date?: string): Promise<AttendanceStats> {
    const targetDate = date || new Date().toISOString().split('T')[0]
    
    // Get all students for the school
    const { studentService } = await import('@/services/student.service')
    const allStudents = await studentService.getStudents(schoolId)
    const totalStudents = allStudents.length
    
    const attendance = await this.getAttendance({
      schoolId,
      date: targetDate
    })

    const present = attendance.filter(a => a.status === 'present').length
    const absent = attendance.filter(a => a.status === 'absent').length
    const late = attendance.filter(a => a.status === 'late').length
    const excused = attendance.filter(a => a.status === 'excused').length
    const attendanceRate = totalStudents > 0 ? (present / totalStudents) * 100 : 0

    // Group by class
    const classStats = attendance.reduce((acc, record) => {
      const className = record.class || 'Unknown'
      if (!acc[className]) {
        acc[className] = {
          class: className,
          total_students: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          attendance_rate: 0
        }
      }
      
      acc[className].total_students++
      if (record.status === 'present') acc[className].present++
      else if (record.status === 'absent') acc[className].absent++
      else if (record.status === 'late') acc[className].late++
      else if (record.status === 'excused') acc[className].excused++
      
      return acc
    }, {} as Record<string, any>)

    // Calculate attendance rate for each class
    Object.values(classStats).forEach((stat: any) => {
      stat.attendance_rate = stat.total_students > 0 
        ? (stat.present / stat.total_students) * 100 
        : 0
    })

    return {
      total_students: totalStudents,
      present_today: present,
      absent_today: absent,
      late_today: late,
      excused_today: excused,
      attendance_rate: attendanceRate,
      class_stats: Object.values(classStats)
    }
  },

  async getAttendanceReport(schoolId: string, date: string, className?: string): Promise<AttendanceReport> {
    const filters: AttendanceFilters = {
      schoolId,
      date
    }
    
    if (className) {
      filters.class = className
    }

    const attendance = await this.getAttendance(filters)
    
    const totalStudents = attendance.length
    const present = attendance.filter(a => a.status === 'present').length
    const absent = attendance.filter(a => a.status === 'absent').length
    const late = attendance.filter(a => a.status === 'late').length
    const excused = attendance.filter(a => a.status === 'excused').length
    const attendanceRate = totalStudents > 0 ? (present / totalStudents) * 100 : 0

    const absentStudents = attendance
      .filter(a => a.status === 'absent')
      .map(a => ({
        id: a.student_id,
        name: a.student_name || 'Unknown',
        admission_number: a.student_admission_number,
        parent_phone: '' // Would need to join with students table
      }))

    return {
      date,
      class: className || 'All Classes',
      total_students: totalStudents,
      present,
      absent,
      late,
      excused,
      attendance_rate: attendanceRate,
      absent_students: absentStudents
    }
  }
} 