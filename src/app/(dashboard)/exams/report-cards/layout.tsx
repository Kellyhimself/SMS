import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Report Cards',
  description: 'Generate and manage student report cards',
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function ReportCardsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 