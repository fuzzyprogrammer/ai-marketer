import { useState } from 'react'
import { api } from '@/lib/api'

interface BrandOnboardingProps {
  onSuccess?: () => void
}

export function BrandOnboarding({ onSuccess }: BrandOnboardingProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleImport = async () => {
    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await api.brands.import({ sourceUrl: url })
      setSuccess(`Import job created: ${response.data.jobId}`)
      setUrl('')
      onSuccess?.()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to import brand')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-4">Import Brand</h2>
      <p className="text-gray-600 mb-4">
        Enter a website URL to automatically import brand information.
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            Website URL
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleImport}
          disabled={loading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Importing...' : 'Import Brand'}
        </button>

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        {success && (
          <p className="text-green-600 text-sm">{success}</p>
        )}
      </div>
    </div>
  )
}
