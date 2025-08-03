'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, School, Bell, Shield, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const settingsSections = [
  {
    title: 'Fee Types',
    description: 'Manage fee categories and types for your school',
    icon: CreditCard,
    href: '/settings/fee-types'
  },
  {
    title: 'Bank API Settings',
    description: 'Configure bank integration settings for payment processing',
    icon: CreditCard,
    href: '/settings/bank-settings'
  },
  {
    title: 'School Profile',
    description: 'Manage your school information and settings',
    icon: School,
    href: '/admin/settings/school-profile'
  },
  {
    title: 'Notification Settings',
    description: 'Configure email and SMS notification preferences',
    icon: Bell,
    href: '/admin/settings/notifications'
  },
  {
    title: 'Security Settings',
    description: 'Manage security preferences and access controls',
    icon: Shield,
    href: '/admin/settings/security'
  }
];

export default function SettingsPage() {
  const { user } = useAuth();
  const isAuthorized = user?.role === 'admin';

  const clearCache = async () => {
    try {
      const response = await fetch('/api/auth/clear-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear cache');
      }

      const data = await response.json();
      toast.success(data.message || 'Cache cleared successfully');
      
      // Reload the page to force fresh authentication
      window.location.reload();
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Failed to clear cache');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section) => (
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
        
        {/* Cache Clear Section */}
        <Card className="border-destructive/20">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Trash2 className="h-6 w-6 text-destructive" />
              <CardTitle className="text-destructive">Clear Authentication Cache</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Clear all cached authentication data. This will log you out and force a fresh login.
              Use this if you're experiencing authentication issues after school or user deletions.
            </p>
            <Button
              onClick={clearCache}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear Cache
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 