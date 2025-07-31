'use client'

import { useState } from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Menu, X, Home, Users, DollarSign, BookOpen, Bell, Settings, Copyright, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, description: 'Overview and analytics' },
  { name: 'Students', href: '/students', icon: Users, description: 'Manage student records' },
  { name: 'Finance', href: '/finance', icon: DollarSign, description: 'Financial management' },
  { name: 'Attendance', href: '/attendance', icon: Users, description: 'Track attendance' },
  { name: 'Parents', href: '/parents', icon: Users, description: 'Parent portal' },
  { name: 'Exams', href: '/exams', icon: BookOpen, description: 'Exam management' },
  { name: 'Communications', href: '/communications', icon: Bell, description: 'Messages & alerts' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile/Tablet Sidebar (Popover) */}
      <div className="md:hidden">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 shadow-lg bg-background/80 hover:bg-background backdrop-blur"
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="top"
            sideOffset={8}
            className="w-72 p-0 rounded-xl shadow-2xl animate-slide-in-from-top-left border-0 bg-gradient-to-b from-background to-background/95 backdrop-blur"
            style={{ minHeight: '100vh', maxHeight: '100vh' }}
            aria-labelledby="sidebar-title"
          >
            <h2 className="sr-only" id="sidebar-title">Sidebar Navigation</h2>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between h-16 border-b px-6 bg-gradient-to-r from-primary/5 to-primary/10">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-bold text-lg">SMS veylor360</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  aria-label="Close sidebar"
                  className="hover:bg-primary/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Main Navigation */}
              <nav className="flex-1 space-y-2 p-4">
                {mainNavigation.map((item) => {
                  const isActive = item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href)
                  return (
                    <div key={item.name}>
                      <Link href={item.href}>
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          className={cn(
                            'w-full justify-start transition-all duration-300 ease-in-out group',
                            'hover:scale-[1.02] hover:text-primary hover:bg-primary/5',
                            'border border-border/50 rounded-xl',
                            'text-base font-medium',
                            'py-4 px-4',
                            'relative overflow-hidden',
                            isActive && 'bg-primary/10 text-primary border-primary/20 shadow-lg',
                          )}
                          onClick={() => setOpen(false)}
                        >
                          <div className={cn(
                            'absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/0 transition-all duration-300',
                            'group-hover:from-primary/5 group-hover:to-primary/10'
                          )} />
                          <item.icon className="mr-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110 relative z-10" />
                          <span className="relative z-10">{item.name}</span>
                        </Button>
                      </Link>
                    </div>
                  )
                })}
              </nav>

              {/* Bottom Section */}
              <div className="border-t p-4 space-y-3">
                {/* Settings */}
                <Link href="/settings">
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start transition-all duration-300 ease-in-out group',
                      'hover:scale-[1.02] hover:text-primary hover:bg-primary/5',
                      'border border-border/50 rounded-xl',
                      'text-base font-medium',
                      'py-4 px-4',
                      'relative overflow-hidden',
                      pathname.startsWith('/settings') && 'bg-primary/10 text-primary border-primary/20 shadow-lg',
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/0 transition-all duration-300 group-hover:from-primary/5 group-hover:to-primary/10" />
                    <Settings className="mr-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110 relative z-10" />
                    <span className="relative z-10">Settings</span>
                  </Button>
                </Link>

                {/* Copyright */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-3">
                  <Copyright className="h-3 w-3" />
                  <span>{new Date().getFullYear()} Powered by Veylor360 </span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Desktop Sidebar (Persistent) */}
      <div className="hidden md:block fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-background via-background/95 to-background/90 backdrop-blur border-r border-border/50 z-30">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 border-b px-6 bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-lg">SMS</span>
            </div>
          </div>
          
          {/* Main Navigation */}
          <nav className="flex-1 space-y-2 p-4">
            {mainNavigation.map((item) => {
              const isActive = item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
              return (
                <div key={item.name}>
                  <Link href={item.href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start transition-all duration-300 ease-in-out group',
                        'hover:scale-[1.02] hover:text-primary hover:bg-primary/5',
                        'border border-border/50 rounded-xl',
                        'text-base font-medium',
                        'py-4 px-4',
                        'relative overflow-hidden',
                        isActive && 'bg-primary/10 text-primary border-primary/20 shadow-lg',
                      )}
                    >
                      <div className={cn(
                        'absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/0 transition-all duration-300',
                        'group-hover:from-primary/5 group-hover:to-primary/10'
                      )} />
                      <item.icon className="mr-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110 relative z-10" />
                      <span className="relative z-10">{item.name}</span>
                    </Button>
                  </Link>
                </div>
              )
            })}
          </nav>

          {/* Bottom Section */}
          <div className="border-t p-4 space-y-3">
            {/* Settings */}
            <Link href="/settings">
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start transition-all duration-300 ease-in-out group',
                  'hover:scale-[1.02] hover:text-primary hover:bg-primary/5',
                  'border border-border/50 rounded-xl',
                  'text-base font-medium',
                  'py-4 px-4',
                  'relative overflow-hidden',
                  pathname.startsWith('/settings') && 'bg-primary/10 text-primary border-primary/20 shadow-lg',
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/0 transition-all duration-300 group-hover:from-primary/5 group-hover:to-primary/10" />
                <Settings className="mr-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110 relative z-10" />
                <span className="relative z-10">Settings</span>
              </Button>
            </Link>

            {/* Copyright */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-3">
              <Copyright className="h-3 w-3" />
              <span>{new Date().getFullYear()} School Management System</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Add animation class in your global CSS:
// .animate-slide-in-from-top-left { animation: slide-in-from-top-left 0.3s cubic-bezier(.4,0,.2,1); }
// @keyframes slide-in-from-top-left { from { opacity: 0; transform: translate(-40px, -40px) scale(0.95); } to { opacity: 1; transform: none; } } 