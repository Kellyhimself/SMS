import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { feeTypeService } from '@/services/fee-type.service'
import { useAuth } from '@/hooks/use-auth'
import type { FeeTypeCreate, FeeTypeUpdate, FeeType } from '@/types/fee'
import { getDB } from '@/lib/indexeddb/client'
import { addToSyncQueue } from '@/lib/sync/sync-service'

export function useFeeTypes() {
  const { school } = useAuth()
  
  return useQuery({
    queryKey: ['fee-types', { schoolId: school?.id }],
    queryFn: async () => {
      if (!school) throw new Error('School context is required')
      return await feeTypeService.getFeeTypes(school.id)
    },
    enabled: !!school,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
  })
}

export function useCreateFeeType() {
  const queryClient = useQueryClient()
  const { school } = useAuth()

  return useMutation({
    mutationFn: async (data: FeeTypeCreate) => {
      if (!school) throw new Error('School context is required')
      return await feeTypeService.createFeeType({
        ...data,
        school_id: school.id
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-types'] })
    },
    onError: (error) => {
      console.error('Error creating fee type:', error)
    }
  })
}

export function useUpdateFeeType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FeeTypeUpdate }) => {
      return await feeTypeService.updateFeeType(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-types'] })
    },
    onError: (error) => {
      console.error('Error updating fee type:', error)
    }
  })
}

export function useDeleteFeeType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return await feeTypeService.deleteFeeType(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-types'] })
    },
    onError: (error) => {
      console.error('Error deleting fee type:', error)
    }
  })
}

export async function createFeeTypeOffline(data: FeeTypeCreate) {
  const now = new Date().toISOString()
  
  const tempId = crypto.randomUUID()
  const newFeeType: FeeType = {
    ...data,
    id: tempId,
    description: data.description || null,
    is_active: true,
    created_at: now,
    updated_at: now,
    sync_status: 'pending' as const
  }

  try {
    const db = await getDB()
    // Store in IndexedDB first
    await db.put('fee_types', newFeeType)
    
    // Add to sync queue with the temporary ID
    await addToSyncQueue('fee_types', tempId, 'create', { ...newFeeType, id: tempId })
    
    return newFeeType
  } catch (error) {
    console.error('Error creating fee type offline:', error)
    throw new Error('Failed to create fee type offline')
  }
} 