export const dynamic = 'force-dynamic'

import { getCurrentUser, getCurrentCompany } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/dashboard/DashboardNav'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log('[LAYOUT DEBUG] Dashboard layout loading')
  
  // Get actual user and company
  const user = await getCurrentUser()
  const company = await getCurrentCompany()

  console.log('[LAYOUT DEBUG] Auth result:', { hasUser: !!user, hasCompany: !!company })

  // If no user, redirect to login
  if (!user) {
    redirect('/login')
  }

  // If user exists but no company/profile, show setup-profile page instead of redirecting
  if (!company) {
    // Instead of redirecting, we'll show the setup-profile page
    // This prevents the redirect loop
    return (
      <html lang="en">
        <body>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to GovContractAI</h1>
                <p className="text-gray-600">Complete your profile to get started</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-4">
                  You're signed in as <strong>{user.email}</strong>. 
                  Please complete your profile to access the dashboard.
                </p>
                <a 
                  href="/setup-profile" 
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors block text-center"
                >
                  Complete Profile Setup
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    )
  }

  // Use the real user and company data
  const currentUser = user
  const currentCompany = company

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={currentUser} company={currentCompany} />
      <div className="flex">
        <DashboardSidebar user={currentUser} company={currentCompany} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
