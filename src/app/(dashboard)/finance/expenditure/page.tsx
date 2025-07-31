'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { Receipt, Plus, Search, Filter, Calendar, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

export default function ExpenditurePage() {
  const { school, user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // Mock expenditure data - in a real app, this would come from a database
  const mockExpenditures = [
    { id: 1, description: 'Teacher Salaries', amount: 500000, category: 'Personnel', date: '2024-01-15', status: 'paid' },
    { id: 2, description: 'School Supplies', amount: 25000, category: 'Supplies', date: '2024-01-10', status: 'paid' },
    { id: 3, description: 'Maintenance', amount: 15000, category: 'Maintenance', date: '2024-01-05', status: 'pending' },
    { id: 4, description: 'Utilities', amount: 30000, category: 'Utilities', date: '2024-01-01', status: 'paid' },
  ]

  const categories = ['Personnel', 'Supplies', 'Maintenance', 'Utilities', 'Technology', 'Other']

  const filteredExpenditures = mockExpenditures.filter(expense => {
    const matchesSearch = !searchQuery || 
      expense.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory
    const expenseDate = new Date(expense.date)
    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null
    
    if (start && expenseDate < start) return false
    if (end && expenseDate > end) return false
    return matchesSearch && matchesCategory
  })

  const totalExpenditure = filteredExpenditures.reduce((sum, expense) => sum + expense.amount, 0)

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to view expenditure management.</p>
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
              <h1 className="text-2xl font-bold mb-2">Expenditure Management</h1>
              <p className="text-muted-foreground">Track and manage school expenses</p>
            </div>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenditure</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalExpenditure)}</div>
              <p className="text-xs text-muted-foreground">
                This period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(filteredExpenditures.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0))}
              </div>
              <p className="text-xs text-muted-foreground">
                Completed payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(filteredExpenditures.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0))}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting payment
              </p>
            </CardContent>
          </Card>
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
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search expenses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
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

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredExpenditures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No expenses found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExpenditures.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{expense.description}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          expense.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {expense.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{expense.category}</span>
                        <span>{new Date(expense.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(expense.amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 