'use client'

import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

export function DebugCacheClear() {
  const clearCache = async () => {
    try {
      const response = await fetch('/api/auth/clear-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to clear cache')
      }

      const data = await response.json()
      toast.success(data.message || 'Cache cleared successfully')
      
      // Reload the page to force fresh authentication
      window.location.reload()
    } catch (error) {
      console.error('Error clearing cache:', error)
      toast.error('Failed to clear cache')
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={clearCache}
        variant="destructive"
        size="sm"
        className="flex items-center gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Clear Auth Cache
      </Button>
    </div>
  )
} 