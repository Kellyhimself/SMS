'use client'

import { useState } from 'react'
import { useFees } from '@/hooks/use-fees'
import { useInstallmentPlans } from '@/hooks/use-installment-plans'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { Calendar, DollarSign, Users, Search } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { InstallmentPlanForm } from '@/components/installment-plan-form'
import { useQueryClient } from '@tanstack/react-query'

export default function InstallmentsPage() {
  const { school } = useAuth()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  
  const { data: fees, isLoading: isLoadingFees } = useFees({
    schoolId: school?.id,
    status: selectedStatus === 'all' ? undefined : selectedStatus
  })

  // Filter fees that have pending amounts
  const feesWithPending = fees?.filter(fee => {
    const pending = fee.amount - (fee.amount_paid || 0)
    const matchesSearch = !searchQuery || 
      fee.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fee.student_admission_number?.toLowerCase().includes(searchQuery.toLowerCase())
    return pending > 0 && matchesSearch
  }) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Installment Plans</h1>
          <p className="text-muted-foreground">
            Manage payment plans for outstanding fees
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by student name or admission number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fees</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="partially_paid">Partially Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feesWithPending.length}</div>
            <p className="text-xs text-muted-foreground">
              Fees requiring payment plans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(feesWithPending.reduce((sum, fee) => {
                return sum + (fee.amount - (fee.amount_paid || 0))
              }, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Total outstanding balance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Installment plans created
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fees List */}
      <Card>
        <CardHeader>
          <CardTitle>Fees Eligible for Installment Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingFees ? (
            <div className="text-center py-8">Loading fees...</div>
          ) : feesWithPending.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No fees found matching your search.' : 'No pending fees found.'}
            </div>
          ) : (
            <div className="space-y-4">
              {feesWithPending.map((fee) => {
                const pendingAmount = fee.amount - (fee.amount_paid || 0)
                return (
                  <div key={fee.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{fee.student_name}</h3>
                          <Badge variant="outline">{fee.student_admission_number}</Badge>
                          {fee.fee_type && (
                            <Badge variant="secondary">{fee.fee_type}</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total Amount:</span>
                            <div className="font-medium">{formatCurrency(fee.amount)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Amount Paid:</span>
                            <div className="font-medium">{formatCurrency(fee.amount_paid || 0)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Pending Amount:</span>
                            <div className="font-medium text-primary">{formatCurrency(pendingAmount)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Due Date:</span>
                            <div className="font-medium">
                              {fee.due_date ? format(new Date(fee.due_date), 'MMM dd, yyyy') : 'Not set'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <InstallmentPlanForm 
                          feeId={fee.id} 
                          totalAmount={pendingAmount}
                          onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ['fees'] })
                            queryClient.invalidateQueries({ queryKey: ['installment-plans'] })
                          }}
                        />
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/fees/${fee.id}`}>View Details</a>
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 