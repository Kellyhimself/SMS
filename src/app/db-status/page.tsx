'use client'

/**
 * Database Status Dashboard
 *
 * Visual interface to see database connection status and tables.
 * Access at: http://localhost:3000/db-status
 */

import { useEffect, useState } from 'react'

interface DbStatus {
  status: string
  provider: string
  healthy: boolean
  connection: {
    host: string
    database: string
    user: string
    ssl: string
  }
  tables: {
    count: number
    list: string[]
    details: Array<{
      table_name: string
      column_count: number
      size: string
    }>
    rowCounts: Record<string, number>
  }
  timestamp: string
}

export default function DatabaseStatusPage() {
  const [status, setStatus] = useState<DbStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/db/status')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch database status')
      }

      setStatus(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to database...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-red-600 text-center mb-4">
            <svg className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold">Connection Failed</h2>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={fetchStatus}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  if (!status) return null

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Database Status Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time connection and table information
          </p>
        </div>

        {/* Connection Status Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Connection Status
            </h2>
            <div className="flex items-center">
              {status.healthy ? (
                <span className="flex items-center text-green-600">
                  <span className="h-3 w-3 bg-green-600 rounded-full mr-2 animate-pulse"></span>
                  Connected
                </span>
              ) : (
                <span className="flex items-center text-red-600">
                  <span className="h-3 w-3 bg-red-600 rounded-full mr-2"></span>
                  Disconnected
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Provider</p>
              <p className="font-semibold text-gray-900 uppercase">
                {status.provider}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Host</p>
              <p className="font-semibold text-gray-900 text-sm truncate">
                {status.connection.host}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Database</p>
              <p className="font-semibold text-gray-900">
                {status.connection.database}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">SSL</p>
              <p className="font-semibold text-gray-900">
                {status.connection.ssl ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500">
              Last Updated: {new Date(status.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tables Overview Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Tables Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 mb-1">Total Tables</p>
              <p className="text-3xl font-bold text-blue-900">
                {status.tables.count}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 mb-1">Total Rows</p>
              <p className="text-3xl font-bold text-green-900">
                {Object.values(status.tables.rowCounts).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0)}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 mb-1">Provider</p>
              <p className="text-3xl font-bold text-purple-900 uppercase">
                {status.provider}
              </p>
            </div>
          </div>
        </div>

        {/* Tables List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Database Tables
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Columns
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rows
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {status.tables.details.map((table) => (
                  <tr key={table.table_name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">
                        {table.table_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {table.column_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {status.tables.rowCounts[table.table_name] || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {table.size}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={fetchStatus}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  )
}
