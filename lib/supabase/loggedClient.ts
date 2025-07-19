import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger, logSupabaseOperation } from '@/lib/utils/logger'

// Simple logging utilities for Supabase operations
export class SupabaseLogger {
  private component: string

  constructor(component: string = 'SupabaseClient') {
    this.component = component
  }

  // Determine if the data appears to be real or mock
  private determineDataSource(data: any, table: string): 'REAL' | 'MOCK' | 'CACHE' | 'UNKNOWN' {
    if (!data) return 'UNKNOWN'
    
    // Check for obvious mock data patterns
    if (Array.isArray(data)) {
      if (data.length === 0) return 'REAL' // Empty results are usually real
      
      // Check first few items for mock patterns
      const sample = data.slice(0, 3)
      for (const item of sample) {
        if (this.isMockData(item, table)) {
          return 'MOCK'
        }
      }
    } else {
      if (this.isMockData(data, table)) {
        return 'MOCK'
      }
    }

    // Check for cache indicators
    if (table === 'ai_cache' || table.includes('cache')) {
      return 'CACHE'
    }

    return 'REAL'
  }

  // Check if data appears to be mock data
  private isMockData(data: any, table: string): boolean {
    if (!data) return false

    // Check for obvious mock patterns
    const mockPatterns = [
      'mock',
      'test',
      'sample',
      'example',
      'dummy',
      'fake',
      'placeholder'
    ]

    // Check table name
    if (mockPatterns.some(pattern => table.toLowerCase().includes(pattern))) {
      return true
    }

    // Check data fields for mock indicators
    const dataStr = JSON.stringify(data).toLowerCase()
    if (mockPatterns.some(pattern => dataStr.includes(pattern))) {
      return true
    }

    // Check for unrealistic data patterns
    if (typeof data === 'object') {
      // Check for unrealistic IDs
      if (data.id && (data.id === 'mock-id' || data.id === 'test-id' || data.id === 'sample-id')) {
        return true
      }

      // Check for unrealistic timestamps (far future or past)
      if (data.created_at || data.updated_at) {
        const timestamp = new Date(data.created_at || data.updated_at)
        const now = new Date()
        const diffDays = Math.abs((timestamp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays > 365 * 10) { // More than 10 years difference
          return true
        }
      }

      // Check for unrealistic amounts
      if (data.amount && (data.amount === 0 || data.amount === 999999 || data.amount === 1000000)) {
        return true
      }
    }

    return false
  }

  // Log a Supabase operation result
  logOperation(
    action: string,
    table: string,
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    startTime: number,
    result: any,
    metadata?: Record<string, any>
  ): void {
    const responseTime = Date.now() - startTime
    const success = !result.error
    const recordCount = Array.isArray(result.data) ? result.data.length : (result.data ? 1 : 0)
    const dataSource = this.determineDataSource(result.data, table)
    
    logSupabaseOperation(
      this.component,
      action,
      table,
      operation,
      success,
      recordCount,
      {
        ...metadata,
        responseTime,
        dataSource,
        error: result.error?.message,
        hasData: !!result.data
      }
    )

    // If this appears to be mock data, log a warning
    if (dataSource === 'MOCK') {
      logger.mockData(
        this.component,
        action,
        table,
        'Detected potential mock data in Supabase response',
        {
          table,
          operation,
          dataSample: Array.isArray(result.data) ? result.data.slice(0, 2) : result.data
        }
      )
    }
  }

  // Log an error
  logError(
    action: string,
    table: string,
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    startTime: number,
    error: any,
    metadata?: Record<string, any>
  ): void {
    const responseTime = Date.now() - startTime
    
    logSupabaseOperation(
      this.component,
      action,
      table,
      operation,
      false,
      0,
      {
        ...metadata,
        responseTime,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }
    )
  }

  // Log RPC operation
  logRPC(
    action: string,
    func: string,
    startTime: number,
    result: any,
    params?: any
  ): void {
    const responseTime = Date.now() - startTime
    const success = !result.error
    
    logSupabaseOperation(
      this.component,
      action,
      'rpc',
      'SELECT',
      success,
      result.data ? 1 : 0,
      {
        function: func,
        params,
        responseTime,
        error: result.error?.message,
        dataSource: this.determineDataSource(result.data, 'rpc')
      }
    )
  }

  // Log RPC error
  logRPCError(
    action: string,
    func: string,
    startTime: number,
    error: any,
    params?: any
  ): void {
    const responseTime = Date.now() - startTime
    
    logSupabaseOperation(
      this.component,
      action,
      'rpc',
      'SELECT',
      false,
      0,
      {
        function: func,
        params,
        responseTime,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }
    )
  }
}

// Factory function to create loggers
export function createSupabaseLogger(component: string = 'SupabaseClient'): SupabaseLogger {
  return new SupabaseLogger(component)
}

// Export a default logger instance
export const supabaseLogger = createSupabaseLogger('DefaultSupabaseClient')

// Helper functions for common operations
export const logSupabaseSelect = (
  logger: SupabaseLogger,
  action: string,
  table: string,
  startTime: number,
  result: any,
  columns?: string
) => {
  logger.logOperation(action, table, 'SELECT', startTime, result, { columns })
}

export const logSupabaseInsert = (
  logger: SupabaseLogger,
  action: string,
  table: string,
  startTime: number,
  result: any,
  values: any
) => {
  logger.logOperation(action, table, 'INSERT', startTime, result, { 
    recordCount: Array.isArray(values) ? values.length : 1 
  })
}

export const logSupabaseUpdate = (
  logger: SupabaseLogger,
  action: string,
  table: string,
  startTime: number,
  result: any,
  values: any
) => {
  logger.logOperation(action, table, 'UPDATE', startTime, result, { 
    updateData: Object.keys(values) 
  })
}

export const logSupabaseDelete = (
  logger: SupabaseLogger,
  action: string,
  table: string,
  startTime: number,
  result: any
) => {
  logger.logOperation(action, table, 'DELETE', startTime, result, {})
}

export const logSupabaseUpsert = (
  logger: SupabaseLogger,
  action: string,
  table: string,
  startTime: number,
  result: any,
  values: any
) => {
  logger.logOperation(action, table, 'INSERT', startTime, result, { 
    recordCount: Array.isArray(values) ? values.length : 1 
  })
} 