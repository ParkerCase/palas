'use client'

import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart, Pie, Cell } from 'recharts'

// Real chart implementations using Recharts
export function LineChart({ 
  data, 
  index, 
  categories, 
  colors = ['#3b82f6', '#10b981', '#8b5cf6'],
  yAxisWidth = 48
}: {
  data: any[]
  index: string
  categories: string[]
  colors?: string[]
  yAxisWidth?: number
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-2">📈</div>
          <p className="text-sm text-muted-foreground">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis 
          dataKey={index} 
          stroke="#64748b"
          fontSize={12}
        />
        <YAxis 
          stroke="#64748b"
          fontSize={12}
          width={yAxisWidth}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        {categories.map((category, i) => (
          <Line
            key={category}
            type="monotone"
            dataKey={category}
            stroke={colors[i % colors.length]}
            strokeWidth={2}
            dot={{ fill: colors[i % colors.length], strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: colors[i % colors.length], strokeWidth: 2 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

export function BarChart({ 
  data, 
  index, 
  categories, 
  colors = ['#3b82f6', '#10b981', '#8b5cf6'],
  yAxisWidth = 48
}: {
  data: any[]
  index: string
  categories: string[]
  colors?: string[]
  yAxisWidth?: number
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm text-muted-foreground">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: yAxisWidth, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis 
          dataKey={index} 
          stroke="#64748b"
          fontSize={12}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          stroke="#64748b"
          fontSize={12}
          width={yAxisWidth}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        {categories.map((category, i) => (
          <Bar
            key={category}
            dataKey={category}
            fill={colors[i % colors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

export function DonutChart({ 
  data, 
  index, 
  category, 
  colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']
}: {
  data: any[]
  index: string
  category: string
  colors?: string[]
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-2">🍩</div>
          <p className="text-sm text-muted-foreground">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey={category}
          nameKey={index}
        >
          {data.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
} 