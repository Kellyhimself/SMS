'use client'

import { useState } from 'react'
import { useFees } from '@/hooks/use-fees'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, DollarSign, Calendar, BarChart3, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

export default function RevenueAnalysisPage() {
  const { school, user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const { data: fees, isLoading } = useFees()

  // Filter fees based on date range
  const filteredFees = fees?.filter(fee => {
    if (!startDate && !endDate) return true
    
    const feeDate = new Date(fee.date)
    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null
    
    if (start && feeDate < start) return false
    if (end && feeDate > end) return false
    return true
  })

  // Calculate revenue metrics
  const totalRevenue = filteredFees?.reduce((sum, fee) => sum + (fee.amount_paid || 0), 0) || 0
  const totalPendingFees = filteredFees?.reduce((sum, fee) => {
    const pending = fee.amount - (fee.amount_paid || 0)
    return pending > 0 ? sum + pending : sum
  }, 0) || 0
  const totalFees = filteredFees?.reduce((sum, fee) => sum + fee.amount, 0) || 0
  const collectionRate = totalFees > 0 ? (totalRevenue / totalFees) * 100 : 0

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to view revenue analysis.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/finance">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold mb-2">Revenue Analysis</h1>
            <p className="text-muted-foreground">Analyze revenue trends and payment patterns</p>
          </div>
        </div>

        {/* Filters */}
        <Collapsible
          open={isFiltersOpen}
          onOpenChange={setIsFiltersOpen}
          className="w-full"
        >
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full flex items-center justify-between px-4 py-2">
              <span>Filters</span>
              {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <Card>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="period">Analysis Period</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Revenue Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Collected payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalPendingFees)}</div>
              <p className="text-xs text-muted-foreground">
                Outstanding balances
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{collectionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Payment success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalFees)}</div>
              <p className="text-xs text-muted-foreground">
                All fees issued
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Revenue chart will be implemented here</p>
                <p className="text-sm">Monthly/weekly revenue trends</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredFees?.filter(fee => fee.status === 'paid').length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Paid Fees</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {filteredFees?.filter(fee => fee.status === 'pending').length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending Fees</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {filteredFees?.filter(fee => fee.status === 'overdue').length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Overdue Fees</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 