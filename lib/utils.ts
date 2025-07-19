import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password validation with proper return type
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Generate slug from string
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Generate application ID
export function generateApplicationId(): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `app_${timestamp}_${randomStr}`
}

// Format relative time
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInMs = now.getTime() - targetDate.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return `${Math.floor(diffInDays / 30)} months ago`
}

// Get user initials - supports both single string and two separate params
export function getInitials(firstNameOrFullName: string, lastName?: string): string {
  if (lastName) {
    // Two parameter format: getInitials(firstName, lastName)
    return (firstNameOrFullName[0] + lastName[0]).toUpperCase()
  } else {
    // Single parameter format: getInitials(fullName)
    return firstNameOrFullName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
}

// Format deadline - returns object with formatted string, urgency flag, and days left
export function formatDeadline(date: string | Date): { formatted: string; isUrgent: boolean; daysLeft: number } {
  const targetDate = new Date(date)
  const now = new Date()
  const diffInMs = targetDate.getTime() - now.getTime()
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays < 0) {
    return { formatted: 'Expired', isUrgent: true, daysLeft: diffInDays }
  }
  if (diffInDays === 0) {
    return { formatted: 'Due today', isUrgent: true, daysLeft: 0 }
  }
  if (diffInDays === 1) {
    return { formatted: 'Due tomorrow', isUrgent: true, daysLeft: 1 }
  }
  if (diffInDays < 7) {
    return { formatted: `Due in ${diffInDays} days`, isUrgent: diffInDays <= 3, daysLeft: diffInDays }
  }
  
  return { 
    formatted: targetDate.toLocaleDateString(),
    isUrgent: false,
    daysLeft: diffInDays
  }
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
