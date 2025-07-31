import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { installmentPlanService } from '@/services/installment-plan.service'
import type { InstallmentPlanCreate, InstallmentPlanUpdate, InstallmentPlan } from '@/types/fee'
import { getDB } from '@/lib/indexeddb/client'
import { addToSyncQueue } from '@/lib/sync/sync-service'

export function useInstallmentPlans(feeId: string) {
  return useQuery({
    queryKey: ['installment-plans', feeId],
    queryFn: async () => {
      return await installmentPlanService.getInstallmentPlans(feeId)
    },
    enabled: !!feeId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
  })
}

export function useCreateInstallmentPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: InstallmentPlanCreate) => {
      return await installmentPlanService.createInstallmentPlan(data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['installment-plans', variables.fee_id] })
    },
    onError: (error) => {
      console.error('Error creating installment plan:', error)
    }
  })
}

export function useUpdateInstallmentPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InstallmentPlanUpdate }) => {
      return await installmentPlanService.updateInstallmentPlan(id, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['installment-plans'] })
    },
    onError: (error) => {
      console.error('Error updating installment plan:', error)
    }
  })
}

export function useDeleteInstallmentPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return await installmentPlanService.deleteInstallmentPlan(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installment-plans'] })
    },
    onError: (error) => {
      console.error('Error deleting installment plan:', error)
    }
  })
}

export function useCalculateInstallmentSchedule() {
  return useMutation({
    mutationFn: async ({ 
      totalAmount, 
      installmentCount, 
      startDate 
    }: { 
      totalAmount: number
      installmentCount: number
      startDate: string 
    }) => {
      return await installmentPlanService.calculateInstallmentSchedule(
        totalAmount,
        installmentCount,
        startDate
      )
    },
    onError: (error) => {
      console.error('Error calculating installment schedule:', error)
    }
  })
}

export async function createInstallmentPlanOffline(data: InstallmentPlanCreate) {
  const now = new Date().toISOString()
  
  const tempId = crypto.randomUUID()
  const newPlan: InstallmentPlan = {
    ...data,
    id: tempId,
    created_at: now,
    updated_at: now,
    sync_status: 'pending' as const
  }

  try {
    const db = await getDB()
    // Store in IndexedDB first
    await db.put('installment_plans', newPlan)
    
    // Add to sync queue with the temporary ID
    await addToSyncQueue('installment_plans', tempId, 'create', { ...newPlan, id: tempId })
    
    return newPlan
  } catch (error) {
    console.error('Error creating installment plan offline:', error)
    throw new Error('Failed to create installment plan offline')
  }
} 