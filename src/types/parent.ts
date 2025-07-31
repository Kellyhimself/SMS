export interface ParentAccount {
  id: string
  phone: string
  email?: string | null
  name: string
  school_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  sync_status: 'pending' | 'synced'
}

export interface ParentStudentLink {
  id: string
  parent_id: string
  student_id: string
  relationship: string
  is_primary: boolean
  created_at: string
  updated_at: string
  sync_status: 'pending' | 'synced'
  // Joined fields
  parent_name?: string
  parent_phone?: string
  parent_email?: string
  student_name?: string
  student_admission_number?: string
  class?: string
}

export interface ParentDashboard {
  parent_id: string
  parent_name: string
  parent_phone: string
  parent_email?: string
  student_id: string
  student_name: string
  class: string
  admission_number?: string
  relationship: string
  is_primary: boolean
  total_attendance_days: number
  present_days: number
  absent_days: number
  late_days: number
  attendance_percentage: number
  total_fees: number
  total_fee_amount: number
  total_paid_amount: number
  outstanding_amount: number
}

export interface ParentAccountCreate {
  phone: string
  email?: string
  name: string
  school_id: string
}

export interface ParentAccountUpdate {
  id: string
  phone?: string
  email?: string
  name?: string
  is_active?: boolean
}

export interface ParentStudentLinkCreate {
  parent_id: string
  student_id: string
  relationship?: string
  is_primary?: boolean
}

export interface ParentStudentLinkUpdate {
  id: string
  relationship?: string
  is_primary?: boolean
}

export interface ParentFilters {
  schoolId?: string
  phone?: string
  isActive?: boolean
}

export interface ParentStudentLinkFilters {
  parentId?: string
  studentId?: string
  isPrimary?: boolean
}

export interface ParentAuth {
  phone: string
  otp?: string
  session_token?: string
}

export interface ParentLoginResponse {
  success: boolean
  message: string
  parent?: ParentAccount
  session_token?: string
  requires_otp?: boolean
} 