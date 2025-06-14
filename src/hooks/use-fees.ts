import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { feeService } from '@/services/fee.service'
import { useAuth } from '@/hooks/use-auth'
import type { FeeCreate, FeeUpdate, FeeFilters, Fee } from '@/types/fee'
import { getDB } from '@/lib/indexeddb/client'
import { addToSyncQueue } from '@/lib/sync/sync-service'
import { generateReceipt } from '@/lib/receipt'
import { NotificationService } from '@/services/notification.service'
import { studentService } from '@/services/student.service'
import { toast } from 'sonner'

type FeeWithStudents = Fee & {
  students: {
    name: string
    admission_number: string | null
  }[] | null
}

interface PaymentDetails {
  amount: number
  paymentMethod: 'mpesa' | 'bank' | 'cash'
  transactionId: string
  paymentDetails?: {
    paybill_number?: string
    account_number?: string
    bank_name?: string
    bank_account?: string
    bank_slip_number?: string
  }
}

const addStudentsToFee = async (fee: Fee): Promise<FeeWithStudents> => {
  const db = await getDB()
  const student = await db.get('students', fee.student_id)
  return {
    ...fee,
    students: student ? [{ name: student.name, admission_number: student.admission_number }] : null
  }
}

export function useFees(filters?: FeeFilters) {
  const { school } = useAuth()
  
  return useQuery({
    queryKey: ['fees', { schoolId: school?.id, ...filters }],
    queryFn: async () => {
      if (!school) throw new Error('School context is required')
      
      try {
        // Get fees from service (which now handles offline/online logic)
        const fees = await feeService.getFees(school.id)
        
        // Get student data for each fee
          const feesWithStudents = await Promise.all(
          fees.map(addStudentsToFee)
        )
        
          return feesWithStudents.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
      } catch (error) {
        console.error('Error fetching fees:', error)
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

export async function createFeeOffline(data: FeeCreate) {
  const now = new Date().toISOString()
  
  // Get student data
  const db = await getDB()
  const student = await db.get('students', data.student_id)
  
  const tempId = crypto.randomUUID()
  const newFee: Fee = {
    ...data,
    id: tempId,
    created_at: now,
    updated_at: now,
    sync_status: 'pending' as const,
    amount_paid: 0,
    status: 'pending',
    payment_method: null,
    payment_reference: null,
    payment_date: null,
    receipt_url: null,
    payment_details: null,
    due_date: data.due_date || null,
    description: data.description || null,
    fee_type: data.fee_type || null,
    student_admission_number: student?.admission_number || data.student_admission_number || null,
    student_name: student?.name || null,
    term: data.term || null,
    academic_year: data.academic_year || null
  }

  try {
    // Store in IndexedDB first
    await db.put('fees', newFee)
    
    // Add to sync queue with the temporary ID
    await addToSyncQueue('fees', tempId, 'create', newFee)
    
    return newFee
  } catch (error) {
    console.error('Error creating fee offline:', error)
    throw new Error('Failed to create fee offline')
  }
}

export async function updateFeeOffline(id: string, data: FeeUpdate) {
  const now = new Date().toISOString()
  const db = await getDB()
  
  // Get existing fee
  const existingFee = await db.get('fees', id)
  if (!existingFee) throw new Error('Fee not found')

  const updatedFee = {
    ...existingFee,
    ...data,
    updated_at: now,
    sync_status: 'pending' as const
  }

  await db.put('fees', updatedFee)
  // Add to sync queue
  await addToSyncQueue('fees', id, 'update', updatedFee)
  return updatedFee
}

export function useFee(id: string) {
  const { user, school } = useAuth()

  return useQuery({
    queryKey: ['fees', id, school?.id],
    queryFn: async () => {
      if (!user || !school) {
        console.error('Auth context missing:', { user, school })
        throw new Error('User must be authenticated and have a school to fetch fee')
      }

      console.log('Fetching fee with context:', { feeId: id, schoolId: school.id })

      try {
        // Get fee from service (which now handles offline/online logic)
        const fee = await feeService.getFee(id)
        return addStudentsToFee(fee)
      } catch (error) {
        console.error('Error in fee fetch process:', error)
        throw error
      }
    },
    enabled: !!school && !!id,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
  })
}

export function useCreateFee() {
  const queryClient = useQueryClient()
  const { user, school } = useAuth()

  return useMutation({
    mutationFn: async (data: FeeCreate) => {
      if (!user || !school) {
        console.error('Auth context missing in createFee:', { user, school })
        throw new Error('User must be authenticated and have a school to create a fee')
      }

      console.log('Creating fee with data:', data)
      const newFee = await feeService.createFee(data)
      return addStudentsToFee(newFee)
    },
    onSuccess: async (data) => {
      console.log('Fee created successfully:', data)
      
      // Update the cache with the new fee
      queryClient.setQueryData<FeeWithStudents[]>(
          ['fees', { schoolId: school?.id }],
        (oldData) => {
          if (!oldData) return [data]
          return [data, ...oldData]
        }
        )
    }
  })
}

export function useUpdateFee() {
  const queryClient = useQueryClient()
  const { user, school } = useAuth()

  return useMutation({
    mutationFn: async (data: FeeUpdate & { id: string }) => {
      if (!user || !school) {
        throw new Error('User must be authenticated and have a school to update a fee')
      }

      const updatedFee = await feeService.updateFee(data.id, data)
      return addStudentsToFee(updatedFee)
    },
    onSuccess: (data, variables) => {
      // Update the cache with the updated fee
      queryClient.setQueryData<FeeWithStudents[]>(
        ['fees', { schoolId: school?.id }],
        (oldData) => {
          if (!oldData) return [data]
          return oldData.map((fee) => 
            fee.id === variables.id ? data : fee
          )
        }
      )
      
      // Update individual fee cache
      queryClient.setQueryData<FeeWithStudents>(
        ['fees', variables.id, school?.id],
        data
      )
    }
  })
}

export function useDeleteFee() {
  const queryClient = useQueryClient()
  const { user, school } = useAuth()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user || !school) {
        throw new Error('User must be authenticated and have a school to delete a fee')
      }

      return feeService.deleteFee(id)
    },
    onSuccess: (_, id) => {
      // Remove the fee from the cache
      queryClient.setQueryData<FeeWithStudents[]>(
        ['fees', { schoolId: school?.id }],
        (oldData) => {
          if (!oldData) return []
          return oldData.filter((fee) => fee.id !== id)
        }
      )
      
      // Remove individual fee cache
      queryClient.removeQueries({ queryKey: ['fees', id, school?.id] })
    }
  })
}

export function useProcessPayment() {
  const queryClient = useQueryClient()
  const { user, school } = useAuth()

  const processPayment = async (feeId: string, paymentDetails: PaymentDetails) => {
    if (!user || !school) {
      throw new Error('User must be authenticated and have a school to process payment')
    }

    console.log('Starting payment process...');
    try {
      // Get the fee first to get the student ID
      const fee = await feeService.getFee(feeId);
      if (!fee) {
        throw new Error('Fee not found');
      }

      // Get student data using the student service
      const student = await studentService.getStudent(fee.student_id);
      if (!student) {
        throw new Error('Student not found');
      }

      // Process payment
      const updatedFee = await feeService.processPayment(feeId, paymentDetails);
      console.log('Payment processed successfully');

      // Generate receipt for display immediately
      console.log('Generating receipt...');
      const { receiptBlob, receiptData } = await generateReceipt(
        feeId,
        paymentDetails.transactionId,
        paymentDetails.amount,
        {
          name: school.name,
          address: school.address || undefined
        }
      );
      console.log('Receipt generated successfully');

      // Return updated fee with receipt data immediately
      const result = {
        ...updatedFee,
        receiptBlob
      };

      // Handle online functionalities asynchronously
      if (navigator.onLine) {
        // Send notifications in the background
        const notificationService = NotificationService.getInstance();
        notificationService.setSchoolId(school.id);
        
        // Send SMS
        if (student.parent_phone) {
          const message = `Payment of KES ${paymentDetails.amount} received for ${student.name}. Receipt No: ${paymentDetails.transactionId}`;
          notificationService.sendSMS(student.parent_phone, message).catch(console.error);
        }

        // Send email
        if (student.parent_email) {
          const subject = `Payment Receipt - ${student.name}`;
          const message = `Dear Parent/Guardian,\n\nPayment of KES ${paymentDetails.amount} has been received for ${student.name}.\nReceipt No: ${paymentDetails.transactionId}\n\nThank you.`;
          notificationService.sendEmail(student.parent_email, subject, message).catch(console.error);
        }

        // Send WhatsApp
        if (student.parent_phone) {
          notificationService.sendWhatsApp(student.parent_phone, {
            studentName: student.name,
            admissionNumber: student.admission_number || '',
            amount: paymentDetails.amount,
            schoolName: receiptData.schoolName
          }).catch(console.error);
        }
      }

      return result;
    } catch (error) {
      console.error('Payment error:', error);
      throw error;
    }
  };

  return useMutation({
    mutationFn: async ({ 
      feeId, 
      amount,
      paymentMethod,
      paymentDetails
    }: { 
      feeId: string
      amount: number
      paymentMethod: 'mpesa' | 'bank' | 'cash'
      paymentDetails?: {
        paybill_number?: string
        account_number?: string
        bank_name?: string
        bank_account?: string
        bank_slip_number?: string
      }
    }) => {
      if (!user || !school) {
        throw new Error('User must be authenticated and have a school to process payment')
      }

      console.log('Processing payment...')
      const result = await processPayment(feeId, {
        amount,
        paymentMethod,
        transactionId: `TXN-${feeId}-${Date.now()}`,
        paymentDetails
      })
      console.log('Payment processed successfully')

      const updatedFee = await addStudentsToFee(result)
      console.log('Returning updated fee with receipt data')
      return {
        ...updatedFee,
        receiptBlob: result.receiptBlob
      }
    },
    onSuccess: (data, variables) => {
      console.log('Payment mutation succeeded, updating cache')
      // Update the cache with the updated fee
      queryClient.setQueryData<FeeWithStudents[]>(
        ['fees', { schoolId: school?.id }],
        (oldData) => {
          if (!oldData) return [data]
          return oldData.map((fee) => 
            fee.id === variables.feeId ? data : fee
          )
        }
      )
      
      // Update individual fee cache
      queryClient.setQueryData<FeeWithStudents>(
        ['fees', variables.feeId, school?.id],
        data
      )
    }
  })
} 