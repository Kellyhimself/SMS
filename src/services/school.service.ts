import { supabase } from '@/lib/supabase/client'
import { createServerSupabaseClient } from '@/lib/supabase/config'
import type { School } from '@/types/auth'

export const schoolService = {
  async create(data: {
    name: string
    email: string
    address?: string
    phone?: string
    subscription_plan: School['subscription_plan']
    verification_status?: 'pending' | 'verified' | 'rejected'
  }): Promise<School> {
    // Use service role for this query since it's called during registration
    const supabaseAdmin = createServerSupabaseClient()

    const { data: school, error } = await supabaseAdmin
      .from('schools')
      .insert({
        ...data,
        verification_status: data.verification_status || 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return {
      ...school,
      verification_status: school.verification_status as 'pending' | 'verified' | 'rejected',
      createdAt: new Date(school.created_at),
      updatedAt: new Date(school.updated_at),
      verified_at: school.verified_at ? new Date(school.verified_at) : undefined
    } as School
  },

  async getById(id: string): Promise<School> {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return {
      ...data,
      verification_status: data.verification_status as 'pending' | 'verified' | 'rejected',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      verified_at: data.verified_at ? new Date(data.verified_at) : undefined
    } as School
  },

  async getByEmail(email: string): Promise<School | null> {
    // Use service role for this query since it's called during registration
    const supabaseAdmin = createServerSupabaseClient()

    const { data, error } = await supabaseAdmin
      .from('schools')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      throw error
    }
    return {
      ...data,
      verification_status: data.verification_status as 'pending' | 'verified' | 'rejected',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      verified_at: data.verified_at ? new Date(data.verified_at) : undefined
    } as School
  },

  async update(id: string, data: Partial<School>): Promise<School> {
    const { data: school, error } = await supabase
      .from('schools')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return school as School
  },

  async verifySchool(id: string, verifiedBy: string): Promise<School> {
    const { data: school, error } = await supabase
      .from('schools')
      .update({
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: verifiedBy
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return school as School
  },

  async rejectSchool(id: string, reason?: string): Promise<School> {
    const { data: school, error } = await supabase
      .from('schools')
      .update({
        verification_status: 'rejected',
        verified_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return school as School
  },
} 