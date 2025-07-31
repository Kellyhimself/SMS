import { supabase } from '@/lib/supabase/client'
import { getDB } from '@/lib/indexeddb/client'
import type { 
  ParentAccount, 
  ParentAccountCreate, 
  ParentAccountUpdate,
  ParentStudentLink,
  ParentStudentLinkCreate,
  ParentStudentLinkUpdate,
  ParentDashboard,
  ParentFilters,
  ParentStudentLinkFilters
} from '@/types/parent'
import { addToSyncQueue } from '@/lib/sync/sync-service'

function transformParentAccount(parentAccount: any): ParentAccount {
  return {
    id: parentAccount.id,
    phone: parentAccount.phone,
    email: parentAccount.email,
    name: parentAccount.name,
    school_id: parentAccount.school_id,
    is_active: parentAccount.is_active,
    created_at: parentAccount.created_at,
    updated_at: parentAccount.updated_at,
    sync_status: parentAccount.sync_status || 'pending'
  }
}

function transformParentStudentLink(link: any): ParentStudentLink {
  return {
    id: link.id,
    parent_id: link.parent_id,
    student_id: link.student_id,
    relationship: link.relationship,
    is_primary: link.is_primary,
    created_at: link.created_at,
    updated_at: link.updated_at,
    sync_status: link.sync_status || 'pending',
    parent_name: link.parent_name,
    parent_phone: link.parent_phone,
    parent_email: link.parent_email,
    student_name: link.student_name,
    student_admission_number: link.student_admission_number,
    class: link.class
  }
}

export const parentService = {
  async getParentAccounts(filters?: ParentFilters): Promise<ParentAccount[]> {
    const db = await getDB()
    
    // Always get from IndexedDB first
    let parentAccounts: any[] = []
    
    if (filters?.schoolId) {
      parentAccounts = await db.getAllFromIndex('parent_accounts', 'by-school', filters.schoolId)
    } else {
      parentAccounts = await db.getAll('parent_accounts')
    }
    
    // Apply additional filters to offline data
    if (filters?.phone) {
      parentAccounts = parentAccounts.filter(pa => pa.phone.includes(filters.phone))
    }
    if (filters?.isActive !== undefined) {
      parentAccounts = parentAccounts.filter(pa => pa.is_active === filters.isActive)
    }
    
    // If online, fetch from Supabase and update IndexedDB
    if (navigator.onLine) {
      try {
        let query = supabase
          .from('parent_accounts')
          .select('*')

        if (filters?.schoolId) {
          query = query.eq('school_id', filters.schoolId)
        }
        if (filters?.phone) {
          query = query.ilike('phone', `%${filters.phone}%`)
        }
        if (filters?.isActive !== undefined) {
          query = query.eq('is_active', filters.isActive)
        }

        const { data: supabaseParentAccounts, error } = await query

        if (error) throw error

        // Update IndexedDB with Supabase data
        for (const record of supabaseParentAccounts) {
          await db.put('parent_accounts', {
            ...record,
            sync_status: 'synced' as const
          })
        }

        return supabaseParentAccounts.map(transformParentAccount)
      } catch (error) {
        console.error('Error fetching parent accounts from Supabase:', error)
        // Return IndexedDB data if Supabase fetch fails
        return parentAccounts.map(transformParentAccount)
      }
    }

    return parentAccounts.map(transformParentAccount)
  },

  async getParentAccountsByPhone(phone: string): Promise<ParentAccount[]> {
    try {
      const { data: parentAccounts, error } = await supabase
        .from('parent_accounts')
        .select('*')
        .eq('phone', phone)
        .eq('is_active', true)

      if (error) throw error

      return parentAccounts.map(transformParentAccount)
    } catch (error) {
      console.error('Error fetching parent accounts by phone:', error)
      throw error
    }
  },

  async getCrossSchoolParentInfo(phone: string): Promise<{
    phone: string
    school_ids: string[]
    parent_account_ids: string[]
    parent_names: string[]
    school_count: number
  } | null> {
    try {
      const { data, error } = await supabase
        .from('parent_cross_school_lookup')
        .select('*')
        .eq('phone', phone)
        .single()

      if (error) {
        if (error.message.includes('No rows found')) {
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching cross-school parent info:', error)
      throw error
    }
  },

  async linkParentToStudentCrossSchool(
    phone: string, 
    studentId: string, 
    relationship: string = 'parent', 
    isPrimary: boolean = false
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('link_parent_to_student_cross_school', {
          p_phone: phone,
          p_student_id: studentId,
          p_relationship: relationship,
          p_is_primary: isPrimary
        })

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error linking parent to student cross-school:', error)
      throw error
    }
  },

  async extractParentsFromStudents(schoolId: string): Promise<ParentAccount[]> {
    try {
      console.log(`Starting parent extraction for school: ${schoolId}`)
      
      // Get all students with parent phone numbers
      const { data: students, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId)
        .not('parent_phone', 'is', null)

      if (error) {
        console.error('Error fetching students:', error)
        throw new Error(`Failed to fetch students: ${error.message}`)
      }

      console.log(`Found ${students?.length || 0} students with parent phone numbers`)

      if (!students || students.length === 0) {
        console.log('No students found with parent phone numbers')
        return []
      }

      // Group students by parent phone number
      const parentGroups = new Map<string, any[]>()
      
      students.forEach(student => {
        if (student.parent_phone) {
          if (!parentGroups.has(student.parent_phone)) {
            parentGroups.set(student.parent_phone, [])
          }
          parentGroups.get(student.parent_phone)!.push(student)
        }
      })

      console.log(`Grouped students into ${parentGroups.size} unique parent phone numbers`)

      const extractedParents: ParentAccount[] = []

      // Create parent accounts for each unique phone number
      for (const [phone, students] of parentGroups) {
        console.log(`Processing phone: ${phone} with ${students.length} students`)
        
        const firstStudent = students[0]
        const parentName = `Parent of ${firstStudent.name}`
        
        // Check if parent account already exists
        const { data: existingParents, error: checkError } = await supabase
          .from('parent_accounts')
          .select('*')
          .eq('phone', phone)
          .eq('school_id', schoolId)

        if (checkError) {
          console.error(`Error checking existing parent for ${phone}:`, checkError)
          throw new Error(`Failed to check existing parent: ${checkError.message}`)
        }

        // If multiple parent accounts exist, use the first one
        const existingParent = existingParents && existingParents.length > 0 ? existingParents[0] : null

        if (!existingParent) {
          console.log(`Creating new parent account for ${phone}`)
          
          // Create new parent account
          const { data: newParent, error: createError } = await supabase
            .from('parent_accounts')
            .insert({
              phone: phone,
              name: parentName,
              email: firstStudent.parent_email || null,
              school_id: schoolId,
              is_active: true
            })
            .select()
            .single()

          if (createError) {
            console.error(`Error creating parent account for ${phone}:`, createError)
            throw new Error(`Failed to create parent account for ${phone}: ${createError.message}`)
          }

          console.log(`Created parent account: ${newParent.id}`)

          // Create parent-student links
          for (const student of students) {
            console.log(`Creating link for student: ${student.id}`)
            
            const { error: linkError } = await supabase
              .from('parent_student_links')
              .insert({
                parent_id: newParent.id,
                student_id: student.id,
                relationship: 'parent',
                is_primary: students.indexOf(student) === 0
              })

            if (linkError) {
              console.error(`Error creating parent-student link for ${student.id}:`, linkError)
              // Don't throw here, continue with other links
            }
          }

          extractedParents.push(transformParentAccount(newParent))
        } else {
          console.log(`Parent account already exists for ${phone}`)
          extractedParents.push(transformParentAccount(existingParent))
        }
      }

      console.log(`Successfully extracted ${extractedParents.length} parent accounts`)
      return extractedParents
    } catch (error) {
      console.error('Error extracting parents from students:', error)
      throw error
    }
  },

  async createParentAccount(parentAccount: ParentAccountCreate): Promise<ParentAccount> {
    const db = await getDB()
    const now = new Date().toISOString()
    
    const newParentAccount = {
      id: crypto.randomUUID(),
      ...parentAccount,
      email: parentAccount.email || null, // Ensure email is null instead of undefined
      is_active: true,
      created_at: now,
      updated_at: now,
      sync_status: 'pending' as const
    }

    // Add to IndexedDB
    await db.put('parent_accounts', newParentAccount)

    // Add to sync queue
    await addToSyncQueue('parent_accounts', newParentAccount.id, 'create', newParentAccount)

    // If online, try to sync immediately
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('parent_accounts')
          .insert(parentAccount)
          .select()
          .single()

        if (error) throw error

        // Update IndexedDB with synced data
        const syncedRecord = {
          ...data,
          sync_status: 'synced' as const
        }
        await db.put('parent_accounts', syncedRecord)

        return transformParentAccount(syncedRecord)
      } catch (error) {
        console.error('Error creating parent account in Supabase:', error)
        // Return local data if sync fails
        return transformParentAccount(newParentAccount)
      }
    }

    return transformParentAccount(newParentAccount)
  },

  async updateParentAccount(id: string, parentAccount: ParentAccountUpdate): Promise<ParentAccount> {
    const db = await getDB()
    const now = new Date().toISOString()
    
    // Get existing record
    const existing = await db.get('parent_accounts', id)
    if (!existing) {
      throw new Error('Parent account not found')
    }

    const updatedParentAccount = {
      ...existing,
      ...parentAccount,
      updated_at: now,
      sync_status: 'pending' as const
    }

    // Update IndexedDB
    await db.put('parent_accounts', updatedParentAccount)

    // Add to sync queue
    await addToSyncQueue('parent_accounts', id, 'update', { ...parentAccount, id })

    // If online, try to sync immediately
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('parent_accounts')
          .update(parentAccount)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        // Update IndexedDB with synced data
        const syncedRecord = {
          ...data,
          sync_status: 'synced' as const
        }
        await db.put('parent_accounts', syncedRecord)

        return transformParentAccount(syncedRecord)
      } catch (error) {
        console.error('Error updating parent account in Supabase:', error)
        // Return local data if sync fails
        return transformParentAccount(updatedParentAccount)
      }
    }

    return transformParentAccount(updatedParentAccount)
  },

  async deleteParentAccount(id: string): Promise<void> {
    const db = await getDB()

    // Remove from IndexedDB
    await db.delete('parent_accounts', id)

    // Add to sync queue
    await addToSyncQueue('parent_accounts', id, 'delete', { id })

    // If online, try to sync immediately
    if (navigator.onLine) {
      try {
        const { error } = await supabase
          .from('parent_accounts')
          .delete()
          .eq('id', id)

        if (error) throw error
      } catch (error) {
        console.error('Error deleting parent account in Supabase:', error)
        // Data will be synced later via sync queue
      }
    }
  },

  async getParentStudentLinks(filters?: ParentStudentLinkFilters): Promise<ParentStudentLink[]> {
    const db = await getDB()
    
    // Always get from IndexedDB first
    let links: any[] = []
    
    if (filters?.parentId) {
      links = await db.getAllFromIndex('parent_student_links', 'by-parent', filters.parentId)
    } else if (filters?.studentId) {
      links = await db.getAllFromIndex('parent_student_links', 'by-student', filters.studentId)
    } else {
      links = await db.getAll('parent_student_links')
    }
    
    // Apply additional filters to offline data
    if (filters?.isPrimary !== undefined) {
      links = links.filter(link => link.is_primary === filters.isPrimary)
    }
    
    // If online and we have a parentId filter, use the API endpoint to bypass RLS
    if (navigator.onLine && filters?.parentId) {
      try {
        // Get session token from IndexedDB
        const sessions = await db.getAll('parent_sessions')
        const session = sessions.find(s => s.parent_id === filters.parentId)
        
        if (session) {
          // Use the API endpoint that bypasses RLS
          const response = await fetch('/api/parent-dashboard', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionToken: session.id })
          })

          const result = await response.json()
          
          if (result.success && result.data) {
            // Transform the data to match ParentStudentLink interface
            const transformedLinks = result.data.map((link: any) => ({
              id: link.id,
              parent_id: link.parent_id,
              student_id: link.student_id,
              relationship: link.relationship || 'parent',
              is_primary: link.is_primary || false,
              created_at: link.created_at || new Date().toISOString(),
              updated_at: link.updated_at || new Date().toISOString(),
              sync_status: 'synced' as const,
              parent_name: link.parent_name || '',
              parent_phone: link.parent_phone || '',
              parent_email: link.parent_email,
              student_name: link.students?.name || '',
              student_admission_number: link.students?.admission_number,
              class: link.students?.class || ''
            })) as ParentStudentLink[]

            // Update IndexedDB with the fetched data
            for (const record of transformedLinks) {
              await db.put('parent_student_links', record)
            }

            return transformedLinks
          }
        }
      } catch (error) {
        console.error('Error fetching parent student links from API:', error)
        // Return IndexedDB data if API fetch fails
        return links.map(transformParentStudentLink)
      }
    }

    // If online but no parentId filter, use direct Supabase query (for admin/school users)
    if (navigator.onLine && !filters?.parentId) {
      try {
        let query = supabase
          .from('parent_student_links')
          .select(`
            *,
            parent_accounts!inner(name, phone, email),
            students!inner(name, admission_number, class)
          `)

        if (filters?.studentId) {
          query = query.eq('student_id', filters.studentId)
        }
        if (filters?.isPrimary !== undefined) {
          query = query.eq('is_primary', filters.isPrimary)
        }

        const { data: supabaseLinks, error } = await query

        if (error) throw error

        // Update IndexedDB with Supabase data
        for (const record of supabaseLinks) {
          const linkRecord = {
            ...record,
            parent_name: record.parent_accounts?.name,
            parent_phone: record.parent_accounts?.phone,
            parent_email: record.parent_accounts?.email,
            student_name: record.students?.name,
            student_admission_number: record.students?.admission_number,
            class: record.students?.class,
            sync_status: 'synced' as const
          }
          await db.put('parent_student_links', linkRecord)
        }

        return supabaseLinks.map(record => ({
          ...record,
          parent_name: record.parent_accounts?.name,
          parent_phone: record.parent_accounts?.phone,
          parent_email: record.parent_accounts?.email,
          student_name: record.students?.name,
          student_admission_number: record.students?.admission_number,
          class: record.students?.class,
          sync_status: 'synced' as const
        })) as ParentStudentLink[]
      } catch (error) {
        console.error('Error fetching parent student links from Supabase:', error)
        // Return IndexedDB data if Supabase fetch fails
        return links.map(transformParentStudentLink)
      }
    }

    return links.map(transformParentStudentLink)
  },

  async createParentStudentLink(link: ParentStudentLinkCreate): Promise<ParentStudentLink> {
    const db = await getDB()
    const now = new Date().toISOString()
    
    const newLink = {
      id: crypto.randomUUID(),
      ...link,
      relationship: link.relationship || 'parent',
      is_primary: link.is_primary || false,
      created_at: now,
      updated_at: now,
      sync_status: 'pending' as const
    }

    // Add to IndexedDB
    await db.put('parent_student_links', newLink)

    // Add to sync queue
    await addToSyncQueue('parent_student_links', newLink.id, 'create', newLink)

    // If online, try to sync immediately
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('parent_student_links')
          .insert(link)
          .select(`
            *,
            parent_accounts!inner(name, phone, email),
            students!inner(name, admission_number, class)
          `)
          .single()

        if (error) throw error

        // Update IndexedDB with synced data
        const syncedRecord = {
          ...data,
          parent_name: data.parent_accounts?.name,
          parent_phone: data.parent_accounts?.phone,
          parent_email: data.parent_accounts?.email,
          student_name: data.students?.name,
          student_admission_number: data.students?.admission_number,
          class: data.students?.class,
          sync_status: 'synced' as const
        }
        await db.put('parent_student_links', syncedRecord)

        return transformParentStudentLink(syncedRecord)
      } catch (error) {
        console.error('Error creating parent student link in Supabase:', error)
        // Return local data if sync fails
        return transformParentStudentLink(newLink)
      }
    }

    return transformParentStudentLink(newLink)
  },

  async updateParentStudentLink(id: string, link: ParentStudentLinkUpdate): Promise<ParentStudentLink> {
    const db = await getDB()
    const now = new Date().toISOString()
    
    // Get existing record
    const existing = await db.get('parent_student_links', id)
    if (!existing) {
      throw new Error('Parent student link not found')
    }

    const updatedLink = {
      ...existing,
      ...link,
      updated_at: now,
      sync_status: 'pending' as const
    }

    // Update IndexedDB
    await db.put('parent_student_links', updatedLink)

    // Add to sync queue
    await addToSyncQueue('parent_student_links', id, 'update', { ...link, id })

    // If online, try to sync immediately
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('parent_student_links')
          .update(link)
          .eq('id', id)
          .select(`
            *,
            parent_accounts!inner(name, phone, email),
            students!inner(name, admission_number, class)
          `)
          .single()

        if (error) throw error

        // Update IndexedDB with synced data
        const syncedRecord = {
          ...data,
          parent_name: data.parent_accounts?.name,
          parent_phone: data.parent_accounts?.phone,
          parent_email: data.parent_accounts?.email,
          student_name: data.students?.name,
          student_admission_number: data.students?.admission_number,
          class: data.students?.class,
          sync_status: 'synced' as const
        }
        await db.put('parent_student_links', syncedRecord)

        return transformParentStudentLink(syncedRecord)
      } catch (error) {
        console.error('Error updating parent student link in Supabase:', error)
        // Return local data if sync fails
        return transformParentStudentLink(updatedLink)
      }
    }

    return transformParentStudentLink(updatedLink)
  },

  async deleteParentStudentLink(id: string): Promise<void> {
    const db = await getDB()

    // Remove from IndexedDB
    await db.delete('parent_student_links', id)

    // Add to sync queue
    await addToSyncQueue('parent_student_links', id, 'delete', { id })

    // If online, try to sync immediately
    if (navigator.onLine) {
      try {
        const { error } = await supabase
          .from('parent_student_links')
          .delete()
          .eq('id', id)

        if (error) throw error
      } catch (error) {
        console.error('Error deleting parent student link in Supabase:', error)
        // Data will be synced later via sync queue
      }
    }
  },

  async getParentDashboard(parentId: string): Promise<ParentDashboard[]> {
    try {
      // Get session token from IndexedDB
      const db = await getDB()
      const sessions = await db.getAll('parent_sessions')
      const session = sessions.find(s => s.parent_id === parentId)
      
      if (!session) {
        console.error('No session found for parent:', parentId)
        return []
      }

      // Use the new API endpoint that bypasses RLS
      const response = await fetch('/api/parent-dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionToken: session.id })
      })

      const result = await response.json()
      
      if (!result.success) {
        console.error('Failed to fetch dashboard data:', result.message)
        return []
      }

      // Transform the data to match ParentDashboard interface
      const dashboardData: ParentDashboard[] = []
      
      for (const link of result.data) {
        // Get attendance data for this student
        const { attendanceService } = await import('@/services/attendance.service')
        const attendance = await attendanceService.getAttendance({
          studentId: link.student_id
        })

        // Get fees data for this student
        const { feeService } = await import('@/services/fee.service')
        const fees = await feeService.getFees(link.student_id)

        // Calculate attendance stats
        const totalAttendanceDays = attendance.length
        const presentDays = attendance.filter(a => a.status === 'present').length
        const absentDays = attendance.filter(a => a.status === 'absent').length
        const lateDays = attendance.filter(a => a.status === 'late').length
        const attendancePercentage = totalAttendanceDays > 0 
          ? (presentDays / totalAttendanceDays) * 100 
          : 0

        // Calculate fees stats
        const totalFees = fees.length
        const totalFeeAmount = fees.reduce((sum, fee) => sum + fee.amount, 0)
        const totalPaidAmount = fees.reduce((sum, fee) => sum + (fee.amount_paid || 0), 0)
        const outstandingAmount = totalFeeAmount - totalPaidAmount

        dashboardData.push({
          parent_id: link.parent_id,
          parent_name: link.parent_name || '',
          parent_phone: link.parent_phone || '',
          parent_email: link.parent_email,
          student_id: link.student_id,
          student_name: link.students?.name || '',
          class: link.students?.class || '',
          admission_number: link.students?.admission_number,
          relationship: link.relationship,
          is_primary: link.is_primary,
          total_attendance_days: totalAttendanceDays,
          present_days: presentDays,
          absent_days: absentDays,
          late_days: lateDays,
          attendance_percentage: attendancePercentage,
          total_fees: totalFees,
          total_fee_amount: totalFeeAmount,
          total_paid_amount: totalPaidAmount,
          outstanding_amount: outstandingAmount
        })
      }

      return dashboardData
    } catch (error) {
      console.error('Error in getParentDashboard:', error)
      return []
    }
  }
} 