'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, CreditCard, Calendar, TrendingUp, Receipt, Users } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

const financeSections = [
  {
    title: 'Student Fees',
    description: 'Manage student fees, payments, and outstanding balances',
    icon: DollarSign,
    href: '/fees'
  },
  {
    title: 'Installment Plans',
    description: 'Create and manage payment plans for outstanding fees',
    icon: CreditCard,
    href: '/fees/installments'
  },
  {
    title: 'Revenue Analysis',
    description: 'Analyze revenue trends and payment patterns',
    icon: TrendingUp,
    href: '/finance/revenue'
  },
  {
    title: 'Expenditure Management',
    description: 'Track and manage school expenses',
    icon: Receipt,
    href: '/finance/expenditure'
  },
  {
    title: 'Financial Reports',
    description: 'Generate and view financial reports and analytics',
    icon: TrendingUp,
    href: '/finance/reports'
  },
  {
    title: 'Fee Types',
    description: 'Manage fee categories and types for your school',
    icon: Receipt,
    href: '/settings/fee-types'
  },
  {
    title: 'Bank Settings',
    description: 'Configure bank integration settings for payment processing',
    icon: CreditCard,
    href: '/settings/bank-settings'
  }
];

export default function FinancePage() {
  const { user } = useAuth();
  const isAuthorized = user?.role === 'admin' || user?.role === 'accountant';

  if (!isAuthorized) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access finance management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Finance Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {financeSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="hover:border-2 hover:border-yellow-400 hover:bg-transparent transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <section.icon className="h-6 w-6" />
                  <CardTitle>{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
} 