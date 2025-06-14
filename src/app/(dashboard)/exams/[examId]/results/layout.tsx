import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Exam Results',
  description: 'Enter and manage exam results',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function ExamResultsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 