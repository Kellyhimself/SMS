import { supabase } from '@/lib/supabase/client'
import { getDB } from '@/lib/indexeddb/client'
import type { 
  InstallmentPlan, 
  InstallmentPlanCreate, 
  InstallmentPlanUpdate 
} from '@/types/fee'
import { addToSyncQueue } from '@/lib/sync/sync-service'

function transformInstallmentPlan(plan: any): InstallmentPlan {
  return {
    id: plan.id,
    fee_id: plan.fee_id,
    total_amount: plan.total_amount,
    installment_count: plan.installment_count,
    installment_amount: plan.installment_amount,
    start_date: plan.start_date,
    end_date: plan.end_date,
    created_at: plan.created_at,
    updated_at: plan.updated_at,
    sync_status: plan.sync_status || 'pending'
  }
}

export const installmentPlanService = {
  async getInstallmentPlans(feeId: string): Promise<InstallmentPlan[]> {
    const db = await getDB()
    
    // Always get from IndexedDB first
    let plans: any[] = []
    
    try {
      plans = await db.getAllFromIndex('installment_plans', 'by-fee', feeId)
    } catch (error) {
      console.error('Error fetching installment plans from IndexedDB:', error)
    }
    
    // If online, fetch from Supabase and update IndexedDB
    if (navigator.onLine) {
      try {
        const { data: supabasePlans, error } = await supabase
          .from('installment_plans')
          .select('*')
          .eq('fee_id', feeId)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Update IndexedDB with Supabase data
        for (const plan of supabasePlans) {
          await db.put('installment_plans', {
            ...plan,
            sync_status: 'synced' as const
          })
        }

        return supabasePlans.map(transformInstallmentPlan)
      } catch (error) {
        console.error('Error fetching installment plans from Supabase:', error)
        // Return IndexedDB data if Supabase fetch fails
        return plans.map(transformInstallmentPlan)
      }
    }

    return plans.map(transformInstallmentPlan)
  },

  async createInstallmentPlan(plan: InstallmentPlanCreate): Promise<InstallmentPlan> {
    const db = await getDB()
    const now = new Date().toISOString()
    
    const newPlan = {
      id: crypto.randomUUID(),
      ...plan,
      created_at: now,
      updated_at: now,
      sync_status: 'pending' as const
    }

    // Add to IndexedDB
    await db.put('installment_plans', newPlan)

    // Add to sync queue
    await addToSyncQueue('installment_plans', newPlan.id, 'create', newPlan)

    // If online, try to sync immediately
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('installment_plans')
          .insert(plan)
          .select()
          .single()

        if (error) throw error

        // Update IndexedDB with synced data
        const syncedRecord = {
          ...data,
          sync_status: 'synced' as const
        }
        await db.put('installment_plans', syncedRecord)

        return transformInstallmentPlan(syncedRecord)
      } catch (error) {
        console.error('Error creating installment plan in Supabase:', error)
        // Return local data if sync fails
        return transformInstallmentPlan(newPlan)
      }
    }

    return transformInstallmentPlan(newPlan)
  },

  async updateInstallmentPlan(id: string, plan: InstallmentPlanUpdate): Promise<InstallmentPlan> {
    const db = await getDB()
    const now = new Date().toISOString()
    
    // Get existing record
    const existing = await db.get('installment_plans', id)
    if (!existing) {
      throw new Error('Installment plan not found')
    }

    const updatedPlan = {
      ...existing,
      ...plan,
      updated_at: now,
      sync_status: 'pending' as const
    }

    // Update IndexedDB
    await db.put('installment_plans', updatedPlan)

    // Add to sync queue
    await addToSyncQueue('installment_plans', id, 'update', { ...plan, id })

    // If online, try to sync immediately
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('installment_plans')
          .update(plan)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        // Update IndexedDB with synced data
        const syncedRecord = {
          ...data,
          sync_status: 'synced' as const
        }
        await db.put('installment_plans', syncedRecord)

        return transformInstallmentPlan(syncedRecord)
      } catch (error) {
        console.error('Error updating installment plan in Supabase:', error)
        // Return local data if sync fails
        return transformInstallmentPlan(updatedPlan)
      }
    }

    return transformInstallmentPlan(updatedPlan)
  },

  async deleteInstallmentPlan(id: string): Promise<void> {
    const db = await getDB()
    
    // Delete from IndexedDB
    await db.delete('installment_plans', id)

    // Add to sync queue
    await addToSyncQueue('installment_plans', id, 'delete', null)

    // If online, try to sync immediately
    if (navigator.onLine) {
      try {
        const { error } = await supabase
          .from('installment_plans')
          .delete()
          .eq('id', id)

        if (error) throw error
      } catch (error) {
        console.error('Error deleting installment plan from Supabase:', error)
        // Data will be synced later via sync queue
      }
    }
  },

  async calculateInstallmentSchedule(
    totalAmount: number, 
    installmentCount: number, 
    startDate: string
  ): Promise<{
    installmentAmount: number
    schedule: Array<{ dueDate: string; amount: number }>
  }> {
    const installmentAmount = Math.ceil(totalAmount / installmentCount)
    const schedule = []
    const start = new Date(startDate)
    
    for (let i = 0; i < installmentCount; i++) {
      const dueDate = new Date(start)
      dueDate.setMonth(dueDate.getMonth() + i)
      
      // Adjust the last installment to account for rounding
      const amount = i === installmentCount - 1 
        ? totalAmount - (installmentAmount * (installmentCount - 1))
        : installmentAmount
      
      schedule.push({
        dueDate: dueDate.toISOString().split('T')[0],
        amount
      })
    }
    
    return {
      installmentAmount,
      schedule
    }
  }
} 