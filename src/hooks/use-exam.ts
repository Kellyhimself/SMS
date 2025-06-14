import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getDB } from '@/lib/indexeddb/client'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './use-auth'

interface Exam {
  id: string
  subject: string
  grade: string
  total_marks: number
  passing_marks: number
  academic_year: string
  date: string
  exam_type: string
  term: string
  school_id: string
  score?: number
  remarks?: string | null
  teacher_remarks?: string | null
  principal_remarks?: string | null
  created_at: string
  updated_at: string
  sync_status: 'synced' | 'pending'
}

export function useExam() {
  const params = useParams()
  const examId = params?.examId as string
  const { school } = useAuth()
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadExam() {
      console.log('Loading exam with:', { examId, schoolId: school?.id })
      if (!examId || !school?.id) {
        console.log('Missing examId or schoolId')
        return
      }

      try {
        // Try to get from IndexedDB first
        const db = await getDB()
        const localExam = await db.get('exams', examId)
        console.log('Found local exam:', localExam)
        
        if (localExam) {
          setExam(localExam)
          setLoading(false)
        }

        // Then try to get from Supabase
        const { data, error } = await supabase
          .from('exams')
          .select('*')
          .eq('id', examId)
          .eq('school_id', school.id)
          .single()

        if (error) {
          console.error('Error fetching from Supabase:', error)
          throw error
        }

        if (data) {
          console.log('Found exam in Supabase:', data)
          const examWithSyncStatus = {
            ...data,
            sync_status: 'synced' as const
          }
          setExam(examWithSyncStatus)
          // Update IndexedDB
          await db.put('exams', examWithSyncStatus)
        }
      } catch (error) {
        console.error('Error loading exam:', error)
      } finally {
        setLoading(false)
      }
    }

    loadExam()
  }, [examId, school?.id])

  return { exam, loading }
} 