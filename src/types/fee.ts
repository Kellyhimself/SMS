export interface Fee {
  id: string
  student_id: string
  school_id: string
  amount: number
  amount_paid: number | null
  date: string
  due_date: string | null
  status: string
  description: string | null
  payment_method: string | null
  payment_reference: string | null
  payment_date: string | null
  receipt_url: string | null
  payment_details: any | null
  created_at: string
  updated_at: string
  sync_status: 'pending' | 'synced'
  fee_type: string | null
  student_admission_number: string | null
  student_name: string | null
  term: string | null
  academic_year: string | null
}

export interface FeeType {
  id: string
  school_id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  sync_status: 'pending' | 'synced'
}

export interface InstallmentPlan {
  id: string
  fee_id: string
  total_amount: number
  installment_count: number
  installment_amount: number
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
  sync_status: 'pending' | 'synced'
}

export interface FeeCreate {
  student_id: string
  school_id: string
  amount: number
  date: string
  due_date?: string | null
  description?: string | null
  fee_type?: string | null
  student_admission_number?: string | null
  term?: string | null
  academic_year?: string | null
}

export interface FeeTypeCreate {
  school_id: string
  name: string
  description?: string | null
}

export interface FeeTypeUpdate {
  name?: string
  description?: string | null
  is_active?: boolean
}

export interface InstallmentPlanCreate {
  fee_id: string
  total_amount: number
  installment_count: number
  installment_amount: number
  start_date: string
  end_date: string
}

export interface FeeUpdate {
  amount?: number
  amount_paid?: number | null
  date?: string
  due_date?: string | null
  status?: string
  description?: string | null
  payment_method?: string | null
  payment_reference?: string | null
  payment_date?: string | null
  receipt_url?: string | null
  payment_details?: any | null
  fee_type?: string | null
  student_admission_number?: string | null
  term?: string | null
  academic_year?: string | null
}

export interface FeeFilters {
  schoolId?: string
  studentId?: string
  status?: string
  feeType?: string
  startDate?: Date
  endDate?: Date
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaymentDetails {
  amount: number
  paymentMethod: 'mpesa' | 'bank' | 'cash'
  paymentDetails?: {
    bank_slip_number?: string
    account_number?: string
    paybill_number?: string
    phone_number?: string
    transaction_id?: string
  }
}

export interface FeeWithStudent extends Fee {
  students: {
    name: string
    admission_number: string | null
  }[] | null
}

export interface FeeAnalytics {
  total_fees: number
  total_collected: number
  total_pending: number
  collection_rate: number
  fees_by_type: Record<string, number>
  fees_by_month: Record<string, number>
  overdue_fees: number
  overdue_amount: number
} 