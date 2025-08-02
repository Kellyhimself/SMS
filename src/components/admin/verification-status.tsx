import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

interface VerificationStatusProps {
  status: 'pending' | 'verified' | 'rejected'
  showIcon?: boolean
  className?: string
}

export default function VerificationStatus({ 
  status, 
  showIcon = true, 
  className = '' 
}: VerificationStatusProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'verified':
        return {
          label: 'Verified',
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          iconClassName: 'text-green-600'
        }
      case 'pending':
        return {
          label: 'Pending',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock,
          iconClassName: 'text-yellow-600'
        }
      case 'rejected':
        return {
          label: 'Rejected',
          className: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle,
          iconClassName: 'text-red-600'
        }
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Clock,
          iconClassName: 'text-gray-600'
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${className}`}
    >
      {showIcon && <Icon className={`w-3 h-3 mr-1 ${config.iconClassName}`} />}
      {config.label}
    </Badge>
  )
} 