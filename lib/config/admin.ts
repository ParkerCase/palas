/**
 * Admin Access Configuration
 * 
 * Centralized list of admin email addresses.
 * Only these emails can access admin pages and endpoints.
 */

export const ADMIN_EMAILS = [
  'veteransccsd@gmail.com',
  'parker@stroomai.com'
] as const

/**
 * Check if an email has admin access
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase() as any)
}

/**
 * Admin notification email (for receiving alerts)
 */
export const ADMIN_NOTIFICATION_EMAIL = 'parker@stroomai.com'

