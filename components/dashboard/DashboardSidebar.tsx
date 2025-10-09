'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Target, 
  FileText, 
  Building2, 
  BarChart3, 
  Settings,
  CreditCard,
  Users,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Book,
  GraduationCap,
  Heart,
  HardHat,
  Factory,
  Sparkles,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface DashboardSidebarProps {
  user: {
    id: string
    role: string
    email?: string
  }
  company: {
    id: string
    name: string
  }
}

interface NavigationItem {
  name: string
  href: string
  icon: any
  current: boolean
  featured?: boolean
  disabled?: boolean
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    current: false},
  {
    name: 'My Bid Opportunities',
    href: '/opportunities',
    icon: Target,
    current: false},
  {
    name: 'Bidded Opportunities',
    href: '/applications',
    icon: FileText,
    current: false},
  {
    name: 'Company Profile',
    href: '/company',
    icon: Building2,
    current: false},
  // {
  //   name: 'Analytics',
  //   href: '/analytics',
  //   icon: BarChart3,
  //   current: false,
  // },
  {
    name: 'Courses',
    href: '/courses',
    icon: Book,
    current: false},
]

const sectorNavigation = [
  {
    name: 'Education',
    href: '/education',
    icon: GraduationCap,
    current: false,
    disabled: true},
  {
    name: 'Healthcare',
    href: '/healthcare',
    icon: Heart,
    current: false,
    disabled: true},
  {
    name: 'Construction',
    href: '/construction',
    icon: HardHat,
    current: false,
    disabled: true},
  {
    name: 'Manufacturing',
    href: '/manufacturing',
    icon: Factory,
    current: false,
    disabled: true},
  {
    name: 'Government',
    href: '/government',
    icon: Building2,
    current: false,
    disabled: true},
]

const adminNavigation = [
  {
    name: 'Subscription',
    href: '/company/subscription',
    icon: CreditCard,
    current: false},
  // {
  //   name: 'Team',
  //   href: '/company/team',
  //   icon: Users,
  //   current: false,
  // },
  // {
  //   name: 'Settings',
  //   href: '/company/settings',
  //   icon: Settings,
  //   current: false,
  // },
]

const stroomaiAdminNavigation = [
  {
    name: 'Opportunity Requests',
    href: '/admin/opportunity-requests',
    icon: Eye,
    current: false},
]

const supportNavigation = [
  {
    name: 'Support',
    href: '/support',
    icon: HelpCircle,
    current: false},
]

export default function DashboardSidebar({ user, company }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const isOwnerOrAdmin = user.role === 'company_owner' || user.role === 'admin'

  return (
    <div className={cn(
      "bg-white shadow-sm border-r transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {company.name}
          </h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-2 pb-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors relative",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  item.featured && "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200"
                )}
              >
                <item.icon
                  className={cn(
                    "flex-shrink-0 h-5 w-5",
                    collapsed ? "mr-0" : "mr-3",
                    isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                    item.featured && "text-blue-600"
                  )}
                />
                {item.featured && !collapsed && (
                  <Sparkles className="absolute right-2 h-3 w-3 text-purple-500" />
                )}
                {!collapsed && item.name}
              </Link>
            )
          })}
        </div>

        {/* Sector Intelligence Section */}
        {/* <div className="pt-4">
          {!collapsed && (
            <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Sectors
            </p>
          )}
          <div className="mt-2 space-y-1">
            {sectorNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <div key={item.name} className="relative">
                  {item.disabled ? (
                    <div
                      className={cn(
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-not-allowed opacity-50",
                        "text-gray-400"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "flex-shrink-0 h-5 w-5",
                          collapsed ? "mr-0" : "mr-3",
                          "text-gray-400"
                        )}
                      />
                      {!collapsed && (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400">{item.name}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                            Coming Soon
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "flex-shrink-0 h-5 w-5",
                          collapsed ? "mr-0" : "mr-3",
                          isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                        )}
                      />
                      {!collapsed && item.name}
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div> */}

        {isOwnerOrAdmin && (
          <>
            <div className="pt-4">
              {!collapsed && (
                <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Management
                </p>
              )}
              <div className="mt-2 space-y-1">
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "flex-shrink-0 h-5 w-5",
                          collapsed ? "mr-0" : "mr-3",
                          isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                        )}
                      />
                      {!collapsed && item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* StroomAI Admin Section - Only visible to stroomai.com users */}
        {user.email?.toLowerCase().includes('stroomai.com') && (
          <div className="pt-4">
            {!collapsed && (
              <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                StroomAI Admin
              </p>
            )}
            <div className="mt-2 space-y-1">
              {stroomaiAdminNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-purple-50 text-purple-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "flex-shrink-0 h-5 w-5",
                        collapsed ? "mr-0" : "mr-3",
                        isActive ? "text-purple-500" : "text-gray-400 group-hover:text-gray-500"
                      )}
                    />
                    {!collapsed && item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        <div className="pt-4">
          {!collapsed && (
            <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Help
            </p>
          )}
          <div className="mt-2 space-y-1">
            {supportNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "flex-shrink-0 h-5 w-5",
                      collapsed ? "mr-0" : "mr-3",
                      isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                    )}
                  />
                  {!collapsed && item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}
