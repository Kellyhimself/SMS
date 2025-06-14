import { supabase } from '@/lib/supabase/client'
import type { Student, StudentCreate, StudentUpdate } from '@/types/student'
import { getDB } from '@/lib/indexeddb/client'
import type { Database } from '@/types/supabase'
import { syncService } from '@/lib/sync/sync-service'

type StudentRow = Database['public']['Tables']['students']['Row']

const transformStudent = (student: StudentRow): Student => ({
  id: student.id,
  school_id: student.school_id,
  name: student.name,
  admission_number: student.admission_number,
  class: student.class,
  parent_phone: student.parent_phone,
  parent_email: student.parent_email,
  created_at: student.created_at,
  updated_at: student.updated_at,
  sync_status: (student.sync_status || 'synced') as 'synced' | 'pending'
})

export const studentService = {
  async getStudents(schoolId: string, filters?: { class?: string; search?: string }): Promise<Student[]> {
      const db = await getDB()
    
    // Always get from IndexedDB first
      const students = await db.getAllFromIndex('students', 'by-school', schoolId)
    
    // If online, fetch from Supabase and update IndexedDB
    if (navigator.onLine) {
      try {
    let query = supabase
      .from('students')
      .select('*')
      .eq('school_id', schoolId)

    // Apply class filter if provided
    if (filters?.class) {
      query = query.eq('class', filters.class)
    }

    // Apply search filter if provided
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,admission_number.ilike.%${filters.search}%`)
    }

        const { data: supabaseStudents, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

        // Update IndexedDB with Supabase data
        for (const student of supabaseStudents) {
          await db.put('students', {
            ...student,
            sync_status: 'synced' as const
          })
        }

        return supabaseStudents.map(transformStudent)
      } catch (error) {
        console.error('Error fetching students from Supabase:', error)
        // Return IndexedDB data if Supabase fetch fails
        return students.map(transformStudent)
      }
    }

    // Apply filters to offline data
    let filteredStudents = students
    if (filters?.class) {
      filteredStudents = filteredStudents.filter(student => student.class === filters.class)
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      filteredStudents = filteredStudents.filter(student => 
        student.name.toLowerCase().includes(searchLower) ||
        (student.admission_number && student.admission_number.toLowerCase().includes(searchLower))
      )
    }

    return filteredStudents.map(transformStudent)
  },

  async getStudent(id: string): Promise<Student> {
      const db = await getDB()
    
    // Always get from IndexedDB first
      const student = await db.get('students', id)
      if (!student) throw new Error('Student not found')
    
    // If online, fetch from Supabase and update IndexedDB
    if (navigator.onLine) {
      try {
        const { data: supabaseStudent, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        // Update IndexedDB with Supabase data
        await db.put('students', {
          ...supabaseStudent,
          sync_status: 'synced' as const
        })
        
        return transformStudent(supabaseStudent)
      } catch (error) {
        console.error('Error fetching student from Supabase:', error)
        // Return IndexedDB data if Supabase fetch fails
        return transformStudent(student)
      }
    }
    
    return transformStudent(student)
  },

  async createStudent(student: StudentCreate): Promise<Student> {
    const db = await getDB()
    const now = new Date().toISOString()
    
    const newStudent: Student = {
      ...student,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      sync_status: 'pending' as const,
      parent_email: student.parent_email || null,
      admission_number: student.admission_number || null
    }

    // Store in IndexedDB
    await db.put('students', newStudent)
    
    // Queue for sync
    await syncService.queueSync('students', 'create', newStudent.id, newStudent)
    
    return newStudent
  },

  async updateStudent(id: string, student: StudentUpdate): Promise<Student> {
    const db = await getDB()
    const now = new Date().toISOString()
    
    // Get existing student
    const existingStudent = await db.get('students', id)
    if (!existingStudent) throw new Error('Student not found')

    // Update local record
    const updatedStudent: Student = {
      ...existingStudent,
      ...student,
      updated_at: now,
      sync_status: 'pending' as const,
      parent_email: student.parent_email ?? existingStudent.parent_email,
      admission_number: student.admission_number ?? existingStudent.admission_number
    }

    // Store in IndexedDB
    await db.put('students', updatedStudent)

    // Queue for sync
    await syncService.queueSync('students', 'update', id, updatedStudent)
    
    return updatedStudent
  },

  async deleteStudent(id: string): Promise<void> {
    const db = await getDB()
    
    // Get existing student
    const existingStudent = await db.get('students', id)
    if (!existingStudent) throw new Error('Student not found')
    
    // Delete from IndexedDB
    await db.delete('students', id)

    // Queue for sync
    await syncService.queueSync('students', 'delete', id, existingStudent)
  },

  async bulkExportStudents(schoolId: string): Promise<string> {
    const db = await getDB()
    const students = await db.getAllFromIndex('students', 'by-school', schoolId)

    // Define headers for the template
    const headers = ['name', 'class', 'parent_phone', 'parent_email', 'admission_number']

    // If we have existing students, use their data
    if (students.length > 0) {
      const rows = students.map(student => [
        student.name,
        student.class,
        student.parent_phone,
        student.parent_email || '',
        student.admission_number || ''
      ])

      // Combine headers and rows
      return [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')
    }

    // If no students, return just the template with headers
    return headers.join(',')
  },

  async bulkImportStudents(
    schoolId: string, 
    csvData: string
  ): Promise<{
    success: boolean;
    message: string;
    errors?: Array<{ row: number; error: string }>;
  }> {
    try {
      const db = await getDB()
      const rows = csvData.split('\n').map(row => row.split(',').map(cell => cell.trim()))
      const headers = rows[0]
      
      // Validate headers
      const requiredHeaders = ['name', 'class', 'parent_phone']
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`)
      }

      const errors: Array<{ row: number; error: string }> = []
      const students: Array<{
        name: string;
        class: string;
        parent_phone: string;
        parent_email: string | null;
        admission_number: string | null;
        school_id: string;
        sync_status: 'pending' | 'synced';
        created_at: string;
        updated_at: string;
      }> = []

      // Process each row
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (row.length === 0 || row.every(cell => !cell)) continue // Skip empty rows

        try {
          const studentData = {
            name: row[headers.indexOf('name')],
            class: row[headers.indexOf('class')],
            parent_phone: row[headers.indexOf('parent_phone')],
            parent_email: headers.includes('parent_email') ? row[headers.indexOf('parent_email')] : null,
            admission_number: headers.includes('admission_number') ? row[headers.indexOf('admission_number')] : null,
            school_id: schoolId, // Add school_id from context
            sync_status: 'pending' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          // Validate required fields
          if (!studentData.name || !studentData.class || !studentData.parent_phone) {
            throw new Error('Missing required fields')
          }

          // Validate phone number format
          if (!/^\+?[0-9]{10,15}$/.test(studentData.parent_phone.replace(/\D/g, ''))) {
            throw new Error('Invalid phone number format')
          }

          // Format phone number to international format if not already
          if (!studentData.parent_phone.startsWith('+')) {
            studentData.parent_phone = `+254${studentData.parent_phone.replace(/^0+/, '')}`
          }

          // Create student in IndexedDB first
          const id = crypto.randomUUID()
          await db.put('students', {
            ...studentData,
            id
          })

          // If online, create in Supabase
          if (navigator.onLine) {
            const { error } = await supabase
              .from('students')
              .insert({
                ...studentData,
                id
              })

            if (error) throw error

            // Update sync status
            await db.put('students', {
              ...studentData,
              id,
              sync_status: 'synced' as const
            })
          }

          students.push(studentData)
        } catch (error) {
          errors.push({
            row: i + 1,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return {
        success: errors.length === 0,
        message: `Imported ${students.length} students${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
        errors: errors.length > 0 ? errors : undefined
      }
    } catch (error) {
      console.error('Bulk import failed:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import students'
      }
    }
  }
} 