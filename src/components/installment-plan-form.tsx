'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Calendar, DollarSign } from 'lucide-react'
import { useCreateInstallmentPlan, useCalculateInstallmentSchedule } from '@/hooks/use-installment-plans'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

interface InstallmentPlanFormProps {
  feeId: string
  totalAmount: number
  onSuccess?: () => void
}

export function InstallmentPlanForm({ feeId, totalAmount, onSuccess }: InstallmentPlanFormProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [installmentCount, setInstallmentCount] = useState<number>(3)
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [schedule, setSchedule] = useState<Array<{ dueDate: string; amount: number }>>([])
  
  const createInstallmentPlan = useCreateInstallmentPlan()
  const calculateSchedule = useCalculateInstallmentSchedule()

  const handleCalculateSchedule = async () => {
    if (!startDate || installmentCount < 2) {
      toast.error('Please enter a valid start date and at least 2 installments')
      return
    }

    try {
      const result = await calculateSchedule.mutateAsync({
        totalAmount,
        installmentCount,
        startDate
      })
      setSchedule(result.schedule)
      setShowScheduleDialog(true)
    } catch (error) {
      toast.error('Failed to calculate schedule')
    }
  }

  const handleCreatePlan = async () => {
    if (schedule.length === 0) {
      toast.error('Please calculate the schedule first')
      return
    }

    try {
      await createInstallmentPlan.mutateAsync({
        fee_id: feeId,
        total_amount: totalAmount,
        installment_count: installmentCount,
        installment_amount: schedule[0].amount,
        start_date: startDate,
        end_date: schedule[schedule.length - 1].dueDate
      })
      
      toast.success('Installment plan created successfully')
      setIsDialogOpen(false)
      setShowScheduleDialog(false)
      setSchedule([])
      onSuccess?.()
    } catch (error) {
      toast.error('Failed to create installment plan')
    }
  }

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Installment Plan
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Installment Plan</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="total-amount">Total Amount</Label>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Label htmlFor="installment-count" className="whitespace-nowrap">Number of Installments</Label>
              <Select value={installmentCount.toString()} onValueChange={(value) => setInstallmentCount(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 installments</SelectItem>
                  <SelectItem value="3">3 installments</SelectItem>
                  <SelectItem value="4">4 installments</SelectItem>
                  <SelectItem value="6">6 installments</SelectItem>
                  <SelectItem value="12">12 installments</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={handleCalculateSchedule} 
              disabled={calculateSchedule.isPending}
              className="w-full"
            >
              {calculateSchedule.isPending ? 'Calculating...' : 'Calculate Schedule'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Display Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Schedule</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-medium">{formatCurrency(totalAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Installments</p>
                  <p className="font-medium">{installmentCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">{format(new Date(startDate), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount per Installment</p>
                  <p className="font-medium">{formatCurrency(schedule[0]?.amount || 0)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {schedule.map((payment, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <div className="font-medium">Installment {index + 1}</div>
                    <div className="text-xs text-muted-foreground">
                      Due: {format(new Date(payment.dueDate), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-lg">{formatCurrency(payment.amount)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowScheduleDialog(false)}
              >
                Back to Edit
              </Button>
              <Button 
                onClick={handleCreatePlan} 
                disabled={createInstallmentPlan.isPending}
              >
                {createInstallmentPlan.isPending ? 'Creating...' : 'Create Installment Plan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 