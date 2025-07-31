'use client'

import { useAuthContext } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User as UserIcon, Menu, Bell, Settings } from 'lucide-react'
import type { User } from '@/types/auth'
import { School } from '@/types/school'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from './sidebar'
import { cn } from '@/lib/utils'

interface HeaderProps {
  user: User
  school: School
}

export function Header({ user, school }: HeaderProps) {
  const { logout } = useAuthContext()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-background via-background/95 to-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
          {/* Mobile Sidebar Trigger */}
          <div className="md:hidden">
            <Sidebar />
          </div>
          
          {/* Desktop School Name */}
          <div className="hidden md:flex items-center">
            <a 
              className="group relative flex items-center space-x-2" 
              href="/"
            >
              <div className="absolute -inset-2 rounded-lg bg-primary/5 opacity-0 transition-all duration-300 group-hover:opacity-100" />
              <span className="relative font-bold text-lg truncate max-w-[150px] sm:max-w-none transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:text-primary">
                {school.name}
              </span>
            </a>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-end space-x-6">
          {/* Notification Bell */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative h-9 w-9 rounded-full hover:bg-primary/10 transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
          </Button>

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <span className="text-sm text-muted-foreground hidden lg:inline-block transition-colors duration-300 hover:text-primary">
              {user.email}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-9 w-9 rounded-full border border-primary/10 hover:border-primary/20 transition-all duration-300"
                >
                  <UserIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56" 
                align="end" 
                forceMount
                sideOffset={8}
              >
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.email}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {school.name}
                    </p>
                  </div>
                </div>
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={() => logout.mutate()}
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="flex md:hidden items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative h-9 w-9 rounded-full hover:bg-primary/10 transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
          </Button>
          
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-full border border-primary/10 hover:border-primary/20 transition-all duration-300"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-[280px] sm:w-[300px] bg-gradient-to-b from-background to-background/95"
            >
              <div className="flex flex-col space-y-6 mt-6">
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-primary/5">
                  <div className="h-10 w-10 rounded-full border border-primary/10 flex items-center justify-center">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.email}</span>
                    <span className="text-xs text-muted-foreground">{school.name}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2 hover:bg-primary/10"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2 text-red-600 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      logout.mutate()
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    Log out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
} 