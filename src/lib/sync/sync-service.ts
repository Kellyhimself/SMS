import { getDB } from '@/lib/indexeddb/client'
import { supabase } from '@/lib/supabase/client'
import type { Student } from '@/types/student'
import type { Fee } from '@/types/fee'
import type { Database } from '@/types/supabase'
import type { SchoolDB } from '@/lib/indexeddb/client'

type SupabaseStudent = Database['public']['Tables']['students']['Row']

interface SyncQueueItem {
  id: string
  table_name: string
  record_id: string
  operation: 'create' | 'update' | 'delete'
  data: string
  created_at: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

type SyncData = Student | Fee | Omit<SupabaseStudent, 'id'> | { 
  id?: string;
  record_id?: string;
  [key: string]: unknown;
}

type TableName = keyof SchoolDB

// Global sync lock to prevent multiple sync processes
let globalSyncLock = false

export async function addToSyncQueue(
  tableName: TableName,
  recordId: string,
  operation: 'create' | 'update' | 'delete',
  data: SyncData | null
) {
  const db = await getDB()
  const now = new Date().toISOString()

  await db.put('sync_queue', {
    id: crypto.randomUUID(),
    table_name: tableName,
    record_id: recordId,
    operation,
    data: JSON.stringify(data),
    created_at: now,
    status: 'pending'
  })
}

export class SyncService {
  private static instance: SyncService | null = null
  private syncInterval: NodeJS.Timeout | null = null
  private isSyncing: boolean = false
  private syncPromise: Promise<void> | null = null
  private processedItems: Set<string> = new Set()
  private isOnline: boolean = navigator.onLine

  private constructor() {
    // Only add event listeners in browser environment
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
      window.addEventListener('online', () => {
        this.isOnline = true
        this.syncData()
      })
      window.addEventListener('offline', () => {
        this.isOnline = false
      })
    }
  }

  public static getInstance(): SyncService {
    if (typeof window === 'undefined') {
      throw new Error('SyncService can only be used in browser environment')
    }
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }

  public startSync(interval: number = 5 * 60 * 1000) { // Default 5 minutes
    console.log('Starting sync service')
    if (this.syncInterval) {
      console.log('Clearing existing sync interval')
      clearInterval(this.syncInterval)
    }
    this.syncInterval = setInterval(() => {
      this.syncData()
    }, interval)
  }

  public stopSync() {
    console.log('Stopping sync service')
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  private async syncData() {
    // Check global lock first
    if (globalSyncLock) {
      console.log('Global sync lock active, skipping')
      return
    }

    // If already syncing, return the existing promise
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping')
      return this.syncPromise
    }

    this.isSyncing = true
    globalSyncLock = true
    this.syncPromise = this.performSync()
    
    try {
      await this.syncPromise
    } finally {
      this.isSyncing = false
      globalSyncLock = false
      this.syncPromise = null
    }
  }

  private async performSync() {
    try {
      console.log('Starting sync process...')
      // Get all pending sync operations
      const db = await getDB()
      const queue = await db.getAll('sync_queue')
      const pendingItems = queue.filter((item: SyncQueueItem) => 
        item.status === 'pending' && !this.processedItems.has(item.id)
      )
      console.log('Pending sync items:', pendingItems)

      // Process items in sequence to avoid race conditions
      for (const item of pendingItems) {
        try {
          // Check if item is still pending (might have been processed by another sync)
          const currentItem = await db.get('sync_queue', item.id)
          if (!currentItem || currentItem.status !== 'pending') {
            console.log('Skipping already processed item:', item.id)
            continue
          }

          // Mark as processing to prevent duplicate processing
          await db.put('sync_queue', {
            ...item,
            status: 'processing'
          })

          // Add to processed items set
          this.processedItems.add(item.id)

          console.log('Processing sync item:', {
            table: item.table_name,
            operation: item.operation,
            recordId: item.record_id
          })
          
          const syncData = JSON.parse(item.data) as SyncData
          console.log('Parsed sync data:', syncData)
          
          switch (item.operation) {
            case 'create':
              await this.handleCreate(item.table_name as TableName, {
                ...syncData,
                record_id: item.record_id
              })
              break
            case 'update':
              await this.handleUpdate(item.table_name as TableName, item.record_id, syncData)
              break
            case 'delete':
              await this.handleDelete(item.table_name as TableName, item.record_id)
              break
          }

          // Mark sync as completed but keep the record in IndexedDB
          await db.put('sync_queue', {
            ...item,
            status: 'completed'
          })
          console.log('Successfully completed sync for item:', item.record_id)

        } catch (error) {
          console.error(`Failed to sync ${item.operation} operation:`, error)
          // Mark sync as failed but keep the record in IndexedDB
          await db.put('sync_queue', {
            ...item,
            status: 'failed'
          })
          // Remove from processed items set on failure
          this.processedItems.delete(item.id)
        }
      }
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }

  private async handleCreate(table: TableName, data: SyncData) {
    try {
      console.log('handleCreate - Initial data:', data)
      
      // Extract record_id and remove it from the data
      const { record_id, ...syncData } = data as { record_id: string } & SyncData
      console.log('handleCreate - After removing record_id:', {
        record_id,
        syncData
      })

      // Get the record from IndexedDB first to ensure it exists
      const db = await getDB()
      const record = await db.get(table, record_id)
      console.log('Retrieved record from IndexedDB:', record)
      
      if (!record) {
        console.error(`Record not found in IndexedDB with ID: ${record_id}`)
        throw new Error(`Record not found in IndexedDB with ID: ${record_id}`)
      }

      // For create operations, we should let Supabase generate the ID
      console.log('Sending to Supabase:', {
        table,
        data: {
          ...syncData,
          id: undefined
        }
      })

      const { data: newRecord, error } = await supabase
        .from(table)
        .insert({
          ...syncData,
          id: undefined // Let Supabase generate the ID
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error)
        throw error;
      }

      console.log('Supabase insert successful:', newRecord)

      // Update the record in IndexedDB with the Supabase ID but keep the original record
      const updatedRecord = {
        ...record,
        id: newRecord.id,
        sync_status: 'synced' as const
      };
      console.log('Updating IndexedDB with new record:', updatedRecord)
      
      // Update the record in IndexedDB
      await db.put(table, updatedRecord);
      console.log('Successfully updated IndexedDB')
    } catch (error) {
      console.error('Failed to sync create operation:', error);
      throw error;
    }
  }

  private async handleUpdate(table: TableName, id: string, data: SyncData) {
    const db = await getDB()
    
    // First update the local record
    const localRecord = await db.get(table, id)
    if (!localRecord) {
      throw new Error(`Record not found in IndexedDB with ID: ${id}`)
    }

    const updatedLocalRecord = {
      ...localRecord,
      ...data,
      sync_status: 'synced' as const
    }
    await db.put(table, updatedLocalRecord)

    // Then sync to Supabase
    const { error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)

    if (error) throw error
  }

  private async handleDelete(table: TableName, id: string) {
    const db = await getDB()
    
    // First delete from Supabase
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) throw error

    // Then delete from IndexedDB
    await db.delete(table, id)
  }

  public queueSync(table: TableName, operation: 'create' | 'update' | 'delete', recordId: string, data: SyncData) {
    addToSyncQueue(table, recordId, operation, data)

    // If online, trigger sync immediately
    if (this.isOnline) {
      this.syncData()
    }
  }

  // Clean up method to be called when the app is unmounted
  public cleanup() {
    this.stopSync()
    SyncService.instance = null
  }
}

// Export a single instance only in browser environment
export const syncService = typeof window !== 'undefined' ? SyncService.getInstance() : null 
