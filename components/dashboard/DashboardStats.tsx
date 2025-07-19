import { Target, FileText, TrendingUp, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardStatsProps {
  stats: {
    totalApplications: number
    activeApplications: number
    availableOpportunities: number
    totalMatches: number
    // Month-over-month changes
    totalApplicationsChange?: number
    activeApplicationsChange?: number
    availableOpportunitiesChange?: number
    totalMatchesChange?: number
  }
}

function formatChange(change: number | undefined): { text: string; color: string } {
  if (change === undefined || change === 0) {
    return { text: 'No change', color: 'text-gray-500' }
  }
  
  const sign = change > 0 ? '+' : ''
  const color = change > 0 ? 'text-green-600' : 'text-red-600'
  
  return {
    text: `${sign}${change.toFixed(1)}%`,
    color
  }
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const statItems = [
    {
      name: 'Total Applications',
      value: stats.totalApplications,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: formatChange(stats.totalApplicationsChange)
    },
    {
      name: 'Active Applications',
      value: stats.activeApplications,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: formatChange(stats.activeApplicationsChange)
    },
    {
      name: 'Available Opportunities',
      value: stats.availableOpportunities,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: formatChange(stats.availableOpportunitiesChange)
    },
    {
      name: 'AI Matches Found',
      value: stats.totalMatches,
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: formatChange(stats.totalMatchesChange)
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item) => (
        <Card key={item.name} className="border-0 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{item.name}</p>
                <p className="text-3xl font-bold text-gray-900">{item.value}</p>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${item.change.color}`}>{item.change.text}</span>
                  <span className="text-sm text-gray-500 ml-1">from last month</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${item.bgColor}`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
