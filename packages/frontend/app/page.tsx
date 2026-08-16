import Link from 'next/link'
import { BrandOnboarding } from '@/components/BrandOnboarding'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Marketer
          </h1>
          <p className="text-xl text-gray-600">
            Automated content creation and social media management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <BrandOnboarding />
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Brands</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Content Drafts</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Scheduled Posts</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tokens Used Today</span>
                <span className="font-medium">0</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/brands" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
            <h3 className="text-lg font-semibold mb-2">Manage Brands</h3>
            <p className="text-gray-600">View and edit your brand profiles</p>
          </Link>
          <Link href="/content" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
            <h3 className="text-lg font-semibold mb-2">Content Library</h3>
            <p className="text-gray-600">Browse and approve generated content</p>
          </Link>
          <Link href="/calendar" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
            <h3 className="text-lg font-semibold mb-2">Content Calendar</h3>
            <p className="text-gray-600">Schedule and manage posts</p>
          </Link>
        </div>
      </div>
    </main>
  )
}
