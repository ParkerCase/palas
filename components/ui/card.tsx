import React from 'react'
import { cn } from '@/lib/utils'

// Card Components
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
}

// Button Component
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function Button({ 
  className, 
  variant = 'default', 
  size = 'default', 
  ...props 
}: ButtonProps) {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline"
  }

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10"
  }

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
}

// Badge Component
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground"
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

// Input Component
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

// Progress Component
export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
}

export function Progress({ className, value = 0, max = 100, ...props }: ProgressProps) {
  return (
    <div
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  )
}

// Metric Component
export function Metric({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("text-2xl font-bold text-foreground", className)}>
      {children}
    </div>
  )
}

// Title Component
export function Title({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn("text-lg font-medium text-foreground mb-4", className)}>
      {children}
    </h3>
  )
}

// Text Component
export function Text({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  )
}

// Grid Component
export function Grid({ 
  children, 
  numItemsSm = 1, 
  numItemsLg = 3, 
  className = '' 
}: { 
  children: React.ReactNode
  numItemsSm?: number
  numItemsLg?: number
  className?: string 
}) {
  return (
    <div className={cn(`grid grid-cols-${numItemsSm} lg:grid-cols-${numItemsLg} gap-6`, className)}>
      {children}
    </div>
  )
}

// Chart placeholders (will be replaced with real charts)
export function LineChart({ 
  data, 
  index, 
  categories, 
  colors = ['blue'],
  yAxisWidth = 48
}: {
  data: any[]
  index: string
  categories: string[]
  colors?: string[]
  yAxisWidth?: number
}) {
  return (
    <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
      <div className="text-center">
        <div className="text-4xl mb-2">📈</div>
        <p className="text-sm text-muted-foreground">Line Chart</p>
        <p className="text-xs text-muted-foreground">{data.length} data points</p>
      </div>
    </div>
  )
}

export function BarChart({ 
  data, 
  index, 
  categories, 
  colors = ['blue'],
  yAxisWidth = 48
}: {
  data: any[]
  index: string
  categories: string[]
  colors?: string[]
  yAxisWidth?: number
}) {
  return (
    <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
      <div className="text-center">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-sm text-muted-foreground">Bar Chart</p>
        <p className="text-xs text-muted-foreground">{data.length} data points</p>
      </div>
    </div>
  )
}

export function DonutChart({ 
  data, 
  index, 
  category, 
  colors = ['blue']
}: {
  data: any[]
  index: string
  category: string
  colors?: string[]
}) {
  return (
    <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
      <div className="text-center">
        <div className="text-4xl mb-2">🍩</div>
        <p className="text-sm text-muted-foreground">Donut Chart</p>
        <p className="text-xs text-muted-foreground">{data.length} segments</p>
      </div>
    </div>
  )
}
