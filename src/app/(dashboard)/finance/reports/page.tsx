'use client'

import { useState } from 'react'
import { useFees } from '@/hooks/use-fees'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { FileText, Download, Calendar, TrendingUp, DollarSign, BarChart3, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

export default function FinancialReportsPage() {
  const { school, user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [selectedReport, setSelectedReport] = useState<string>('revenue')
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

  // Calculate metrics
  const totalRevenue = filteredFees?.reduce((sum, fee) => sum + (fee.amount_paid || 0), 0) || 0
  const totalPendingFees = filteredFees?.reduce((sum, fee) => {
    const pending = fee.amount - (fee.amount_paid || 0)
    return pending > 0 ? sum + pending : sum
  }, 0) || 0
  const totalFees = filteredFees?.reduce((sum, fee) => sum + fee.amount, 0) || 0

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to view financial reports.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/finance">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold mb-2">Financial Reports</h1>
              <p className="text-muted-foreground">Generate and view financial reports and analytics</p>
            </div>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Report Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="report">Report Type</Label>
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue Report</SelectItem>
                    <SelectItem value="expenditure">Expenditure Report</SelectItem>
                    <SelectItem value="profit-loss">Profit & Loss Statement</SelectItem>
                    <SelectItem value="cash-flow">Cash Flow Statement</SelectItem>
                    <SelectItem value="balance-sheet">Balance Sheet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Report Period</Label>
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
            </div>

            <Collapsible
              open={isFiltersOpen}
              onOpenChange={setIsFiltersOpen}
              className="w-full"
            >
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full flex items-center justify-between px-4 py-2">
                  <span>Date Range</span>
                  {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Report Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalFees)}</div>
              <p className="text-xs text-muted-foreground">
                All fees issued
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Report Content */}
        <Card>
          <CardHeader>
            <CardTitle>{selectedReport === 'revenue' ? 'Revenue Report' : 
                       selectedReport === 'expenditure' ? 'Expenditure Report' :
                       selectedReport === 'profit-loss' ? 'Profit & Loss Statement' :
                       selectedReport === 'cash-flow' ? 'Cash Flow Statement' :
                       'Balance Sheet'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Report content will be generated here</p>
                <p className="text-sm">Based on selected parameters and data</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Reports */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Monthly Revenue Summary
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Payment Trends
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                Outstanding Fees Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                Fee Type Analysis
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export as PDF
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export as Excel
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export as CSV
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Print Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 