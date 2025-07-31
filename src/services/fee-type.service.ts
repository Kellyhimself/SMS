import { supabase } from '@/lib/supabase/client'
import { getDB } from '@/lib/indexeddb/client'
import type { 
  FeeType, 
  FeeTypeCreate, 
  FeeTypeUpdate 
} from '@/types/fee'
import { addToSyncQueue } from '@/lib/sync/sync-service'

function transformFeeType(feeType: any): FeeType {
  return {
    id: feeType.id,
    school_id: feeType.school_id,
    name: feeType.name,
    description: feeType.description,
    is_active: feeType.is_active,
    created_at: feeType.created_at,
    updated_at: feeType.updated_at,
    sync_status: feeType.sync_status || 'pending'
  }
}

export const feeTypeService = {
  async getFeeTypes(schoolId: string): Promise<FeeType[]> {
    const db = await getDB()
    
    // Always get from IndexedDB first
    let feeTypes: any[] = []
    
    try {
      feeTypes = await db.getAllFromIndex('fee_types', 'by-school', schoolId)
    } catch (error) {
      console.error('Error fetching fee types from IndexedDB:', error)
    }
    
    // If online, fetch from Supabase and update IndexedDB
    if (navigator.onLine) {
      try {
        const { data: supabaseFeeTypes, error } = await supabase
          .from('fee_types')
          .select('*')
          .eq('school_id', schoolId)
          .eq('is_active', true)
          .order('name', { ascending: true })

        if (error) throw error

        // Update IndexedDB with Supabase data
        for (const feeType of supabaseFeeTypes) {
          await db.put('fee_types', {
            ...feeType,
            sync_status: 'synced' as const
          })
        }

        return supabaseFeeTypes.map(transformFeeType)
      } catch (error) {
        console.error('Error fetching fee types from Supabase:', error)
        // Return IndexedDB data if Supabase fetch fails
        return feeTypes.map(transformFeeType)
      }
    }

    return feeTypes.map(transformFeeType)
  },

  async createFeeType(feeType: FeeTypeCreate): Promise<FeeType> {
    const db = await getDB()
    const now = new Date().toISOString()
    
    const newFeeType = {
      id: crypto.randomUUID(),
      ...feeType,
      description: feeType.description || null,
      is_active: true,
      created_at: now,
      updated_at: now,
      sync_status: 'pending' as const
    }

    // Add to IndexedDB
    await db.put('fee_types', newFeeType)

    // Add to sync queue
    await addToSyncQueue('fee_types', newFeeType.id, 'create', newFeeType)

    // If online, try to sync immediately
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('fee_types')
          .insert(feeType)
          .select()
          .single()

        if (error) throw error

        // Update IndexedDB with synced data
        const syncedRecord = {
          ...data,
          sync_status: 'synced' as const
        }
        await db.put('fee_types', syncedRecord)

        return transformFeeType(syncedRecord)
      } catch (error) {
        console.error('Error creating fee type in Supabase:', error)
        // Return local data if sync fails
        return transformFeeType(newFeeType)
      }
    }

    return transformFeeType(newFeeType)
  },

  async updateFeeType(id: string, feeType: FeeTypeUpdate): Promise<FeeType> {
    const db = await getDB()
    const now = new Date().toISOString()
    
    // Get existing record
    const existing = await db.get('fee_types', id)
    if (!existing) {
      throw new Error('Fee type not found')
    }

    const updatedFeeType = {
      ...existing,
      ...feeType,
      updated_at: now,
      sync_status: 'pending' as const
    }

    // Update IndexedDB
    await db.put('fee_types', updatedFeeType)

    // Add to sync queue
    await addToSyncQueue('fee_types', id, 'update', { ...feeType, id })

    // If online, try to sync immediately
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('fee_types')
          .update(feeType)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        // Update IndexedDB with synced data
        const syncedRecord = {
          ...data,
          sync_status: 'synced' as const
        }
        await db.put('fee_types', syncedRecord)

        return transformFeeType(syncedRecord)
      } catch (error) {
        console.error('Error updating fee type in Supabase:', error)
        // Return local data if sync fails
        return transformFeeType(updatedFeeType)
      }
    }

    return transformFeeType(updatedFeeType)
  },

  async deleteFeeType(id: string): Promise<void> {
    const db = await getDB()
    
    // Delete from IndexedDB
    await db.delete('fee_types', id)

    // Add to sync queue
    await addToSyncQueue('fee_types', id, 'delete', null)

    // If online, try to sync immediately
    if (navigator.onLine) {
      try {
        const { error } = await supabase
          .from('fee_types')
          .delete()
          .eq('id', id)

        if (error) throw error
      } catch (error) {
        console.error('Error deleting fee type from Supabase:', error)
        // Data will be synced later via sync queue
      }
    }
  }
} 