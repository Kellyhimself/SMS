export interface School {
  id: string
  name: string
  address?: string
  phone?: string
  email: string
  subscription_plan: 'core' | 'premium'
  verification_status: 'pending' | 'verified' | 'rejected'
  verified_at?: Date
  verified_by?: string
  createdAt: Date
  updatedAt: Date
  payment_settings?: {
    bank_name: string
    paybill_number: string
    account_number: string
    reference_format: 'admission_number' | 'student_name'
    api_credentials?: {
      api_key: string
      api_secret: string
      is_live: boolean
    }
  }
}

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'teacher' | 'parent' | 'accountant'
  school_id: string
  createdAt: Date
  updatedAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
}

// Updated to only allow admin registration for new schools
export interface RegisterCredentials extends LoginCredentials {
  name: string
  role: 'admin' // Only admin allowed for new school registration
  school: {
    name: string
    email: string
    address?: string
    phone?: string
    subscription_plan: School['subscription_plan']
  }
}

export interface AuthResponse {
  user: User
  school: School
  session: {
    access_token: string
    refresh_token: string
  }
} 