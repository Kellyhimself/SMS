export interface UserInvitation {
  id: string
  email: string
  role: 'teacher' | 'parent' | 'accountant'
  school_id: string
  invited_by: string
  status: 'pending' | 'accepted' | 'expired'
  expires_at: Date
  created_at: Date
  updated_at: Date
}

export interface CreateInvitationDTO {
  email: string
  role: 'teacher' | 'parent' | 'accountant'
  school_id: string
  invited_by: string
}

export interface AcceptInvitationDTO {
  invitation_id: string
  name: string
  password: string
}

export interface InvitationFilters {
  school_id?: string
  status?: UserInvitation['status']
  role?: UserInvitation['role']
  email?: string
}

export interface InvitationStats {
  total: number
  pending: number
  accepted: number
  expired: number
} 