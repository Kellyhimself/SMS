'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { UserInvitation } from '@/types/invitation'

interface InvitationListProps {
  schoolId: string
  onRefresh?: () => void
}

export function InvitationList({ schoolId, onRefresh }: InvitationListProps) {
  const [invitations, setInvitations] = useState<UserInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      setError(null)

      // Add multiple cache-busting parameters
      const timestamp = Date.now()
      const random = Math.random()
      const response = await fetch(`/api/invitations?t=${timestamp}&r=${random}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Requested-With': 'XMLHttpRequest'
        },
        cache: 'no-store'
      })
      const data = await response.json()

      console.log('Fetched invitations:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invitations')
      }

      console.log('Setting invitations state:', data)
      setInvitations(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch invitations'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [schoolId, refreshKey])

  // Debug effect to log state changes
  useEffect(() => {
    console.log('Invitations state changed:', invitations)
  }, [invitations])

  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleResend = async (invitationId: string) => {
    setActionLoading(invitationId)
    
    // Optimistic update - update the invitation's timestamp
    const originalInvitations = [...invitations]
    setInvitations(prev => prev.map(inv => 
      inv.id === invitationId 
        ? { ...inv, updated_at: new Date() }
        : inv
    ))
    
    try {
      const response = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend invitation')
      }

      toast.success('Invitation resent successfully!')
      forceRefresh()
      onRefresh?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend invitation'
      toast.error(errorMessage)
      
      // Restore the original invitations if the API call failed
      setInvitations(originalInvitations)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRevoke = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) {
      return
    }

    setActionLoading(invitationId)
    
    // Optimistic update - remove the invitation from UI immediately
    const originalInvitations = [...invitations]
    setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
    
    try {
      console.log('Revoking invitation:', invitationId)
      
      const response = await fetch(`/api/invitations/${invitationId}/revoke`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      const data = await response.json()
      console.log('Revoke response:', { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke invitation')
      }

      toast.success('Invitation revoked successfully!')
      console.log('Refreshing invitations after revoke')
      
      // Add a small delay to ensure database transaction is committed
      await new Promise(resolve => setTimeout(resolve, 500))
      
      forceRefresh()
      onRefresh?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke invitation'
      console.error('Revoke error:', error)
      toast.error(errorMessage)
      
      // Restore the invitation to UI if the API call failed
      setInvitations(originalInvitations)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string, expiresAt: Date) => {
    const isExpired = new Date() > new Date(expiresAt)
    
    if (status === 'accepted') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Accepted</Badge>
    } else if (status === 'expired' || isExpired) {
      return <Badge variant="destructive">Expired</Badge>
    } else {
      return <Badge variant="secondary">Pending</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      teacher: 'bg-blue-100 text-blue-800',
      parent: 'bg-purple-100 text-purple-800',
      accountant: 'bg-orange-100 text-orange-800'
    }
    
    return (
      <Badge variant="outline" className={colors[role as keyof typeof colors]}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysUntilExpiry = (expiresAt: Date) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>Manage user invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading invitations...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>Manage user invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending')
  
  console.log('All invitations:', invitations)
  console.log('Pending invitations:', pendingInvitations)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
            <CardDescription>
              {pendingInvitations.length} invitation{pendingInvitations.length !== 1 ? 's' : ''} awaiting response
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={forceRefresh}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const response = await fetch('/api/invitations/debug')
                const data = await response.json()
                console.log('Debug data:', data)
                toast.success(`Debug: ${data.total_invitations} total invitations`)
              } catch (error) {
                console.error('Debug error:', error)
                toast.error('Debug failed')
              }
            }}
            disabled={loading}
          >
            Debug
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (pendingInvitations.length > 0) {
                const firstInvitation = pendingInvitations[0]
                try {
                  const response = await fetch('/api/invitations/debug', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ invitationId: firstInvitation.id })
                  })
                  const data = await response.json()
                  console.log('Debug specific invitation:', data)
                  toast.success(`Debug: ${data.found ? 'Found' : 'Not found'} invitation ${firstInvitation.id}`)
                } catch (error) {
                  console.error('Debug specific invitation error:', error)
                  toast.error('Debug failed')
                }
              } else {
                toast.error('No invitations to debug')
              }
            }}
            disabled={loading || pendingInvitations.length === 0}
          >
            Debug First
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {pendingInvitations.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No pending invitations</h3>
            <p className="text-muted-foreground">
              All invitations have been accepted or expired.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingInvitations.map((invitation) => {
              const daysUntilExpiry = getDaysUntilExpiry(invitation.expires_at)
              const isExpiringSoon = daysUntilExpiry <= 2
              
              return (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{invitation.email}</span>
                      {getRoleBadge(invitation.role)}
                      {getStatusBadge(invitation.status, invitation.expires_at)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Sent: {formatDate(invitation.created_at)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expires: {formatDate(invitation.expires_at)}
                      </span>
                      {isExpiringSoon && daysUntilExpiry > 0 && (
                        <span className="text-orange-600 font-medium">
                          Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResend(invitation.id)}
                      disabled={actionLoading === invitation.id}
                    >
                      {actionLoading === invitation.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevoke(invitation.id)}
                      disabled={actionLoading === invitation.id}
                    >
                      {actionLoading === invitation.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 