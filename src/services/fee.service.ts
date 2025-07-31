import { supabase } from '@/lib/supabase/client'
import type { Fee, FeeCreate, FeeUpdate, PaymentDetails, FeeFilters, FeeAnalytics } from '@/types/fee'
import { getDB } from '@/lib/indexeddb/client'
import type { Database } from '@/types/supabase'
import { syncService } from '@/lib/sync/sync-service'

type FeeRow = Database['public']['Tables']['fees']['Row']

type FeeWithStudent = FeeRow & {
  students: {
    name: string
    admission_number: string | null
  }[] | null
}

const transformFee = (fee: FeeWithStudent): Fee => {
  const student = fee.students?.[0] || null
  return {
    id: fee.id,
    student_id: fee.student_id,
    school_id: fee.school_id,
    amount: fee.amount,
    amount_paid: fee.amount_paid,
    date: fee.date,
    due_date: fee.due_date,
    status: fee.status,
    description: fee.description,
    payment_method: fee.payment_method,
    payment_reference: fee.payment_reference,
    payment_date: fee.payment_date,
    receipt_url: fee.receipt_url,
    payment_details: fee.payment_details as PaymentDetails | null,
    created_at: fee.created_at,
    updated_at: fee.updated_at,
    sync_status: (fee.sync_status || 'synced') as 'synced' | 'pending',
    fee_type: fee.fee_type,
    student_admission_number: student?.admission_number || fee.student_admission_number,
    student_name: student?.name || fee.student_name || null,
    term: fee.term || null,
    academic_year: fee.academic_year || null
  }
}

export const feeService = {
  async getFees(schoolId: string, filters?: FeeFilters): Promise<Fee[]> {
    console.log('🔍 Fetching fees for school:', schoolId)
    console.log('📡 Online status:', navigator.onLine)
    
    const db = await getDB()
    
    // Always get from IndexedDB first
    let fees = await db.getAllFromIndex('fees', 'by-school', schoolId)
    console.log('💾 Fees from IndexedDB:', fees.length)
    
    // Apply filters to offline data
    if (filters?.studentId) {
      fees = fees.filter(f => f.student_id === filters.studentId)
    }
    if (filters?.status) {
      fees = fees.filter(f => f.status === filters.status)
    }
    if (filters?.feeType) {
      fees = fees.filter(f => f.fee_type === filters.feeType)
    }
    if (filters?.startDate) {
      fees = fees.filter(f => new Date(f.date) >= filters.startDate!)
    }
    if (filters?.endDate) {
      fees = fees.filter(f => new Date(f.date) <= filters.endDate!)
    }
    
    // If online, fetch from Supabase and update IndexedDB
    if (navigator.onLine) {
      try {
        console.log('🌐 Fetching from Supabase...')
        let query = supabase
          .from('fees')
          .select('*')
          .eq('school_id', schoolId)
        
        if (filters?.studentId) {
          query = query.eq('student_id', filters.studentId)
        }
        if (filters?.status) {
          query = query.eq('status', filters.status)
        }
        if (filters?.feeType) {
          query = query.eq('fee_type', filters.feeType)
        }
        if (filters?.startDate) {
          query = query.gte('date', filters.startDate.toISOString().split('T')[0])
        }
        if (filters?.endDate) {
          query = query.lte('date', filters.endDate.toISOString().split('T')[0])
        }
        if (filters?.sortBy) {
          query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' })
        } else {
          query = query.order('created_at', { ascending: false })
        }
        
        const { data: supabaseFees, error } = await query
        
        if (error) throw error
        
        console.log('✅ Supabase fees fetched:', supabaseFees.length)
        
        // Update IndexedDB with Supabase data
        for (const fee of supabaseFees) {
          await db.put('fees', {
            ...fee,
            sync_status: 'synced' as const
          })
        }
        
        console.log('💾 Updated IndexedDB with Supabase data')
        return supabaseFees.map(transformFee)
      } catch (error) {
        console.error('❌ Error fetching fees from Supabase:', error)
        // Return IndexedDB data if Supabase fetch fails
        console.log('⚠️ Falling back to IndexedDB data')
        return fees.map(transformFee)
      }
    }
    
    console.log('📴 Offline mode - returning IndexedDB data')
    return fees.map(transformFee)
  },

  async getStudentFees(studentId: string): Promise<Fee[]> {
    if (!navigator.onLine) {
      const db = await getDB()
      const fees = await db.getAllFromIndex('fees', 'by-student', studentId)
      // Get student data for each fee
      const feesWithStudents = await Promise.all(
        fees.map(async (fee) => {
          const student = await db.get('students', fee.student_id)
          return {
            ...fee,
            students: student ? [{ name: student.name, admission_number: student.admission_number }] : null
          }
        })
      )
      return feesWithStudents.map(transformFee).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }

    const { data, error } = await supabase
      .from('fees')
      .select(`
        id,
        student_id,
        school_id,
        amount,
        amount_paid,
        date,
        due_date,
        status,
        description,
        payment_method,
        payment_reference,
        payment_date,
        receipt_url,
        payment_details,
        created_at,
        updated_at,
        sync_status,
        fee_type,
        student_admission_number,
        term,
        academic_year,
        students:student_id (
          name,
          admission_number
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data as unknown as FeeWithStudent[]).map(transformFee)
  },

  async getFee(id: string): Promise<Fee> {
      const db = await getDB()
    
    // Always get from IndexedDB first
      const fee = await db.get('fees', id)
      if (!fee) throw new Error('Fee not found')
    
    // If online, fetch from Supabase and update IndexedDB
    if (navigator.onLine) {
      try {
        const { data: supabaseFee, error } = await supabase
      .from('fees')
          .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

        // Update IndexedDB with Supabase data
        await db.put('fees', {
          ...supabaseFee,
          sync_status: 'synced' as const
        })
        
        return transformFee(supabaseFee)
      } catch (error) {
        console.error('Error fetching fee from Supabase:', error)
        // Return IndexedDB data if Supabase fetch fails
        return transformFee(fee)
      }
    }
    
    return transformFee(fee)
  },

  async createFee(fee: FeeCreate): Promise<Fee> {
    const db = await getDB()
    const now = new Date().toISOString()

    let studentName = null
    let studentAdmissionNumber = null
    if (!navigator.onLine) {
      const student = await db.get('students', fee.student_id)
      studentName = student?.name || null
      studentAdmissionNumber = student?.admission_number || null

      const newFee: Fee = {
        id: crypto.randomUUID(),
        student_id: fee.student_id,
        school_id: fee.school_id,
        amount: fee.amount,
        amount_paid: 0,
        date: fee.date,
        due_date: fee.due_date || null,
        status: 'pending',
        description: fee.description || null,
        payment_method: null,
        payment_reference: null,
        payment_date: null,
        receipt_url: null,
        payment_details: null,
        created_at: now,
        updated_at: now,
        sync_status: 'pending' as const,
        fee_type: fee.fee_type || null,
        student_admission_number: studentAdmissionNumber || fee.student_admission_number || null,
        student_name: studentName,
        term: fee.term || null,
        academic_year: fee.academic_year || null
      }

      // Store in IndexedDB
      await db.put('fees', newFee)
      // Queue for sync
      await syncService.queueSync('fees', 'create', newFee.id, newFee)
      return newFee
    } else {
      // Online: fetch student info
      const { data: student } = await supabase
        .from('students')
        .select('name, admission_number')
        .eq('id', fee.student_id)
        .single()
      studentName = student?.name || null
      studentAdmissionNumber = student?.admission_number || null

      // Insert directly into Supabase
      const { data: inserted, error } = await supabase
        .from('fees')
        .insert([{
          student_id: fee.student_id,
          school_id: fee.school_id,
          amount: fee.amount,
          amount_paid: 0,
          date: fee.date,
          due_date: fee.due_date || null,
          status: 'pending',
          description: fee.description || null,
          payment_method: null,
          payment_reference: null,
          payment_date: null,
          receipt_url: null,
          payment_details: null,
          created_at: now,
          updated_at: now,
          sync_status: 'synced',
          fee_type: fee.fee_type || null,
          student_admission_number: studentAdmissionNumber || fee.student_admission_number || null,
          student_name: studentName,
          term: fee.term || null,
          academic_year: fee.academic_year || null
        }])
        .select('*')
        .single()

      if (error) throw error

      // Update IndexedDB for offline support
      await db.put('fees', { ...inserted, sync_status: 'synced' })
      return inserted as Fee
    }
  },

  async updateFee(id: string, fee: FeeUpdate): Promise<Fee> {
    const db = await getDB()
    const now = new Date().toISOString()
    
    // Get existing fee
    const existingFee = await db.get('fees', id)
    if (!existingFee) throw new Error('Fee not found')
    
    // Update local record
    const updatedFee: Fee = {
      ...existingFee,
      ...fee,
      updated_at: now,
      sync_status: 'pending' as const
    }

    // Store in IndexedDB
    await db.put('fees', updatedFee)
    
    // Queue for sync
    await syncService.queueSync('fees', 'update', id, updatedFee)
    
    return updatedFee
  },

  async deleteFee(id: string): Promise<void> {
      const db = await getDB()
    
    // Get existing fee
    const existingFee = await db.get('fees', id)
    if (!existingFee) throw new Error('Fee not found')
    
    // Delete from IndexedDB
      await db.delete('fees', id)
    
    // Queue for sync
    await syncService.queueSync('fees', 'delete', id, existingFee)
  },

  async processPayment(feeId: string, payment: PaymentDetails): Promise<Fee> {
    const db = await getDB()
    const now = new Date().toISOString()
    
    // Get existing fee
    const existingFee = await db.get('fees', feeId)
    if (!existingFee) throw new Error('Fee not found')
    
    // Update local record
    const updatedFee: Fee = {
      ...existingFee,
      amount_paid: (existingFee.amount_paid || 0) + payment.amount,
      status: payment.amount >= existingFee.amount ? 'paid' : 'pending',
      payment_method: payment.paymentMethod,
      payment_reference: payment.paymentDetails?.bank_slip_number || 
                         payment.paymentDetails?.account_number || 
                         payment.paymentDetails?.paybill_number || 
                         '',
      payment_date: now,
      payment_details: payment.paymentDetails || null,
      updated_at: now,
      sync_status: 'pending' as const
    }

    // Store in IndexedDB
    await db.put('fees', updatedFee)
    
    // Queue for sync
    await syncService.queueSync('fees', 'update', feeId, updatedFee)
    
    return updatedFee
  },

  async getFeeAnalytics(schoolId: string, filters?: FeeFilters): Promise<FeeAnalytics> {
    const fees = await this.getFees(schoolId, filters)
    
    const totalFees = fees.length
    const totalCollected = fees.reduce((sum, fee) => sum + (fee.amount_paid || 0), 0)
    const totalPending = fees.reduce((sum, fee) => {
      const pending = fee.amount - (fee.amount_paid || 0)
      return pending > 0 ? sum + pending : sum
    }, 0)
    const collectionRate = totalFees > 0 ? (totalCollected / (totalCollected + totalPending)) * 100 : 0
    
    // Group by fee type
    const feesByType = fees.reduce((acc, fee) => {
      const type = fee.fee_type || 'Uncategorized'
      acc[type] = (acc[type] || 0) + fee.amount
      return acc
    }, {} as Record<string, number>)
    
    // Group by month
    const feesByMonth = fees.reduce((acc, fee) => {
      const month = new Date(fee.date).toISOString().slice(0, 7) // YYYY-MM
      acc[month] = (acc[month] || 0) + fee.amount
      return acc
    }, {} as Record<string, number>)
    
    // Calculate overdue fees
    const now = new Date()
    const overdueFees = fees.filter(fee => {
      if (fee.status === 'paid') return false
      if (!fee.due_date) return false
      return new Date(fee.due_date) < now
    })
    
    const overdueAmount = overdueFees.reduce((sum, fee) => {
      const pending = fee.amount - (fee.amount_paid || 0)
      return pending > 0 ? sum + pending : sum
    }, 0)
    
    return {
      total_fees: totalFees,
      total_collected: totalCollected,
      total_pending: totalPending,
      collection_rate: collectionRate,
      fees_by_type: feesByType,
      fees_by_month: feesByMonth,
      overdue_fees: overdueFees.length,
      overdue_amount: overdueAmount
    }
  }
} 