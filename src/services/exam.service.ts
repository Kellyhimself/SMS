import { supabase } from '@/lib/supabase/client'
import type { Tables } from '@/types/supabase'
import { getDB } from '@/lib/indexeddb/client'
import { syncService } from '@/lib/sync/sync-service'

type Exam = Tables<'exams'> & {
  sync_status: 'synced' | 'pending'
}

type CreateExamDTO = Omit<Exam, 'id' | 'created_at' | 'updated_at' | 'sync_status'>
type UpdateExamDTO = Partial<Omit<Exam, 'id' | 'created_at' | 'updated_at'>> & { id: string }

type ExamFilters = {
  schoolId?: string
  studentId?: string
  subject?: string
  startDate?: Date
  endDate?: Date
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const examService = {
  async getAll(filters?: ExamFilters): Promise<Exam[]> {
    const db = await getDB()
    
    // Always get from IndexedDB first
    const exams = await db.getAllFromIndex('exams', 'by-school', filters?.schoolId || '')
    
    // If online, fetch from Supabase and update IndexedDB
    if (navigator.onLine) {
      try {
        let query = supabase
          .from('exams')
          .select('*')

        if (filters?.schoolId) {
          query = query.eq('school_id', filters.schoolId)
        }

        if (filters?.studentId) {
          query = query.eq('student_id', filters.studentId)
        }

        if (filters?.subject) {
          query = query.eq('subject', filters.subject)
        }

        if (filters?.startDate) {
          query = query.gte('date', filters.startDate.toISOString())
        }

        if (filters?.endDate) {
          query = query.lte('date', filters.endDate.toISOString())
        }

        if (filters?.sortBy) {
          query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' })
        }

        const { data: supabaseExams, error } = await query

        if (error) throw error

        // Update IndexedDB with Supabase data
        for (const exam of supabaseExams) {
          await db.put('exams', {
            ...exam,
            sync_status: 'synced' as const
          })
        }

        return supabaseExams.map(exam => ({
          ...exam,
          sync_status: 'synced' as const
        })) as Exam[]
      } catch (error) {
        console.error('Error fetching exams from Supabase:', error)
        // Return IndexedDB data if Supabase fetch fails
        return exams.map(exam => ({
          ...exam,
          sync_status: exam.sync_status || 'pending' as const
        })) as Exam[]
      }
    }

    return exams.map(exam => ({
      ...exam,
      sync_status: exam.sync_status || 'pending' as const
    })) as Exam[]
  },

  async getById(id: string): Promise<Exam> {
    const db = await getDB()
    
    // Always get from IndexedDB first
    const exam = await db.get('exams', id)
    if (!exam) throw new Error('Exam not found')
    
    // If online, fetch from Supabase and update IndexedDB
    if (navigator.onLine) {
      try {
        const { data: supabaseExam, error } = await supabase
          .from('exams')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        // Update IndexedDB with Supabase data
        const updatedExam = {
          ...supabaseExam,
          sync_status: 'synced' as const
        }
        await db.put('exams', updatedExam)
        
        return updatedExam as Exam
      } catch (error) {
        console.error('Error fetching exam from Supabase:', error)
        // Return IndexedDB data if Supabase fetch fails
        return {
          ...exam,
          sync_status: exam.sync_status || 'pending' as const
        } as Exam
      }
    }
    
    return {
      ...exam,
      sync_status: exam.sync_status || 'pending' as const
    } as Exam
  },

  async create(exam: Omit<Exam, 'id' | 'created_at' | 'updated_at'>): Promise<Exam> {
    const db = await getDB()
    
    // Check if exam already exists for this student, subject, term and academic year
    const existingExams = await db.getAllFromIndex('exams', 'by-student', exam.student_id)
    const duplicate = existingExams.find(e => 
      e.subject === exam.subject && 
      e.term === exam.term && 
      e.academic_year === exam.academic_year
    )
    
    if (duplicate) {
      console.log('Exam already exists for this student:', duplicate)
      return duplicate
    }

    const newExam: Exam = {
      id: crypto.randomUUID(),
      ...exam,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: 'pending'
    }

    // Store in IndexedDB
    await db.put('exams', newExam)
    
    // Queue for sync
    await syncService.queueSync('exams', 'create', newExam.id, newExam)
    
    return newExam
  },

  async update(exam: UpdateExamDTO): Promise<Exam> {
    const db = await getDB()
    const now = new Date().toISOString()
    
    // Get existing exam
    const existingExam = await db.get('exams', exam.id)
    if (!existingExam) throw new Error('Exam not found')
    
    // Update local record
    const updatedExam: Exam = {
      ...existingExam,
      ...exam,
      updated_at: now,
      sync_status: 'pending' as const
    }

    // Store in IndexedDB
    await db.put('exams', updatedExam)
    
    // Queue for sync
    await syncService.queueSync('exams', 'update', exam.id, updatedExam)
    
    return updatedExam
  },

  async delete(id: string): Promise<void> {
    const db = await getDB()
    
    // Get existing exam
    const existingExam = await db.get('exams', id)
    if (!existingExam) throw new Error('Exam not found')
    
    // Delete from IndexedDB
    await db.delete('exams', id)
    
    // Queue for sync
    await syncService.queueSync('exams', 'delete', id, existingExam)
  }
} 