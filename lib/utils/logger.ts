import { supabase } from '@/lib/supabaseClient'

// Conditionally import Node.js modules only on the server side
let fs: any = null
let path: any = null

if (typeof window === 'undefined') {
  // Server-side only
  try {
    // Use dynamic imports to avoid linter errors
    import('fs').then(module => { fs = module.default || module })
    import('path').then(module => { path = module.default || module })
  } catch (error) {
    console.warn('Node.js modules not available:', error)
  }
}

export interface LogEntry {
  id?: string
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
  category: 'API_CALL' | 'DATA_SOURCE' | 'MOCK_DATA' | 'OPENAI_USAGE' | 'SUPABASE' | 'AUTH' | 'PAYMENT' | 'GENERAL'
  component: string
  action: string
  message: string
  metadata?: Record<string, any>
  userId?: string
  sessionId?: string
  requestId?: string
  dataSource?: 'REAL' | 'MOCK' | 'CACHE' | 'UNKNOWN'
  apiProvider?: string
  responseTime?: number
  error?: string
  stack?: string
}

class Logger {
  private static instance: Logger
  private logs: LogEntry[] = []
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'
  private logFile: string
  private isServer = typeof window === 'undefined'

  private constructor() {
    // Only create logs directory on server side
    if (this.isServer && fs && path) {
      try {
        // Create logs directory if it doesn't exist
        const logsDir = path.join(process.cwd(), 'logs')
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true })
        }
        
        this.logFile = path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`)
      } catch (error) {
        console.warn('Failed to create logs directory:', error)
        this.logFile = ''
      }
    } else {
      this.logFile = ''
    }
    
    // Initialize logger
    this.log('INFO', 'GENERAL', 'Logger', 'Logger initialized', 'Logger system initialized', {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      logFile: this.logFile,
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      isServer: this.isServer
    })
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private async persistLog(entry: LogEntry): Promise<void> {
    try {
      // Store in Supabase for production
      if (this.isProduction) {
        await supabase.from('application_logs').insert({
          timestamp: entry.timestamp,
          level: entry.level,
          category: entry.category,
          component: entry.component,
          action: entry.action,
          message: entry.message,
          metadata: entry.metadata,
          user_id: entry.userId,
          session_id: entry.sessionId,
          request_id: entry.requestId,
          data_source: entry.dataSource,
          api_provider: entry.apiProvider,
          response_time: entry.responseTime,
          error: entry.error,
          stack: entry.stack
        })
      }

      // Also store in memory for development
      this.logs.push(entry)
      
      // Keep only last 1000 logs in memory
      if (this.logs.length > 1000) {
        this.logs = this.logs.slice(-1000)
      }

      // Write to file only on server side
      if (this.isServer && fs && this.logFile) {
        const logLine = JSON.stringify({
          ...entry,
          timestamp: new Date().toISOString(),
          pid: process.pid
        }) + '\n'
        
        fs.appendFileSync(this.logFile, logLine)
      }
    } catch (error) {
      console.error('Failed to persist log:', error)
    }
  }

  private log(
    level: LogEntry['level'],
    category: LogEntry['category'],
    component: string,
    action: string,
    message: string,
    metadata?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      component,
      action,
      message,
      metadata,
      dataSource: metadata?.dataSource || 'UNKNOWN',
      apiProvider: metadata?.apiProvider,
      responseTime: metadata?.responseTime,
      error: metadata?.error,
      stack: metadata?.stack
    }

    // Console output for development
    if (this.isDevelopment) {
      const timestamp = new Date().toISOString()
      const logMessage = `[${timestamp}] ${level} [${category}] ${component}:${action} - ${message}`
      
      if (metadata) {
        console.log(logMessage, JSON.stringify(metadata, null, 2))
      } else {
        console.log(logMessage)
      }
    }

    // Persist log
    this.persistLog(entry)
  }

  // API Call Logging
  apiCall(
    component: string,
    action: string,
    provider: string,
    endpoint: string,
    method: string,
    responseTime: number,
    success: boolean,
    dataSource: 'REAL' | 'MOCK' | 'CACHE',
    metadata?: Record<string, any>
  ): void {
    this.log(
      success ? 'INFO' : 'ERROR',
      'API_CALL',
      component,
      action,
      `${method} ${endpoint} - ${success ? 'SUCCESS' : 'FAILED'} (${responseTime}ms)`,
      {
        ...metadata,
        provider,
        endpoint,
        method,
        responseTime,
        success,
        dataSource,
        apiProvider: provider
      }
    )
  }

  // Data Source Logging
  dataSource(
    component: string,
    action: string,
    dataSource: 'REAL' | 'MOCK' | 'CACHE',
    source: string,
    recordCount: number,
    metadata?: Record<string, any>
  ): void {
    this.log(
      'INFO',
      'DATA_SOURCE',
      component,
      action,
      `Data from ${source}: ${recordCount} records (${dataSource})`,
      {
        ...metadata,
        dataSource,
        source,
        recordCount
      }
    )
  }

  // Mock Data Detection
  mockData(
    component: string,
    action: string,
    dataType: string,
    reason: string,
    metadata?: Record<string, any>
  ): void {
    this.log(
      'WARN',
      'MOCK_DATA',
      component,
      action,
      `Mock data detected for ${dataType}: ${reason}`,
      {
        ...metadata,
        dataType,
        reason,
        dataSource: 'MOCK'
      }
    )
  }

  // OpenAI Usage Logging
  openaiUsage(
    component: string,
    action: string,
    model: string,
    tokens: number,
    cost: number,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    this.log(
      success ? 'INFO' : 'ERROR',
      'OPENAI_USAGE',
      component,
      action,
      `OpenAI ${model}: ${tokens} tokens, $${cost.toFixed(4)} cost - ${success ? 'SUCCESS' : 'FAILED'}`,
      {
        ...metadata,
        model,
        tokens,
        cost,
        success,
        apiProvider: 'OpenAI'
      }
    )
  }

  // Supabase Operations
  supabaseOperation(
    component: string,
    action: string,
    table: string,
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    success: boolean,
    recordCount: number,
    metadata?: Record<string, any>
  ): void {
    this.log(
      success ? 'INFO' : 'ERROR',
      'SUPABASE',
      component,
      action,
      `${operation} on ${table}: ${recordCount} records - ${success ? 'SUCCESS' : 'FAILED'}`,
      {
        ...metadata,
        table,
        operation,
        success,
        recordCount,
        apiProvider: 'Supabase'
      }
    )
  }

  // Authentication Events
  authEvent(
    component: string,
    action: string,
    event: string,
    success: boolean,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    this.log(
      success ? 'INFO' : 'ERROR',
      'AUTH',
      component,
      action,
      `Auth ${event} - ${success ? 'SUCCESS' : 'FAILED'}`,
      {
        ...metadata,
        event,
        userId,
        success
      }
    )
  }

  // Payment Events
  paymentEvent(
    component: string,
    action: string,
    provider: string,
    amount: number,
    currency: string,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    this.log(
      success ? 'INFO' : 'ERROR',
      'PAYMENT',
      component,
      action,
      `${provider} payment: ${currency}${amount} - ${success ? 'SUCCESS' : 'FAILED'}`,
      {
        ...metadata,
        provider,
        amount,
        currency,
        success,
        apiProvider: provider
      }
    )
  }

  // Page Navigation Logging
  pageNavigation(
    component: string,
    action: string,
    page: string,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    this.log(
      'INFO',
      'GENERAL',
      component,
      action,
      `Page navigation: ${page}`,
      {
        ...metadata,
        page,
        userId,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server'
      }
    )
  }

  // Component Rendering Logging
  componentRender(
    component: string,
    action: string,
    props?: Record<string, any>,
    metadata?: Record<string, any>
  ): void {
    this.log(
      'DEBUG',
      'GENERAL',
      component,
      action,
      `Component rendered`,
      {
        ...metadata,
        props: props ? Object.keys(props) : [],
        propsCount: props ? Object.keys(props).length : 0
      }
    )
  }

  // Button Click Logging
  buttonClick(
    component: string,
    action: string,
    buttonText: string,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    this.log(
      'INFO',
      'GENERAL',
      component,
      action,
      `Button clicked: ${buttonText}`,
      {
        ...metadata,
        buttonText,
        userId,
        timestamp: new Date().toISOString()
      }
    )
  }

  // Form Submission Logging
  formSubmission(
    component: string,
    action: string,
    formName: string,
    success: boolean,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    this.log(
      success ? 'INFO' : 'ERROR',
      'GENERAL',
      component,
      action,
      `Form submission: ${formName} - ${success ? 'SUCCESS' : 'FAILED'}`,
      {
        ...metadata,
        formName,
        success,
        userId
      }
    )
  }

  // Data Loading Logging
  dataLoading(
    component: string,
    action: string,
    dataType: string,
    success: boolean,
    recordCount: number,
    metadata?: Record<string, any>
  ): void {
    this.log(
      success ? 'INFO' : 'ERROR',
      'DATA_SOURCE',
      component,
      action,
      `Data loading: ${dataType} - ${success ? 'SUCCESS' : 'FAILED'} (${recordCount} records)`,
      {
        ...metadata,
        dataType,
        success,
        recordCount
      }
    )
  }

  // General Info
  info(component: string, action: string, message: string, metadata?: Record<string, any>): void {
    this.log('INFO', 'GENERAL', component, action, message, metadata)
  }

  // Warnings
  warn(component: string, action: string, message: string, metadata?: Record<string, any>): void {
    this.log('WARN', 'GENERAL', component, action, message, metadata)
  }

  // Errors
  error(component: string, action: string, message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log('ERROR', 'GENERAL', component, action, message, {
      ...metadata,
      error: error?.message,
      stack: error?.stack
    })
  }

  // Debug (only in development)
  debug(component: string, action: string, message: string, metadata?: Record<string, any>): void {
    if (this.isDevelopment) {
      this.log('DEBUG', 'GENERAL', component, action, message, metadata)
    }
  }

  // Get all logs (for debugging)
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  // Get logs by category
  getLogsByCategory(category: LogEntry['category']): LogEntry[] {
    return this.logs.filter(log => log.category === category)
  }

  // Get logs by component
  getLogsByComponent(component: string): LogEntry[] {
    return this.logs.filter(log => log.component === component)
  }

  // Get mock data logs
  getMockDataLogs(): LogEntry[] {
    return this.logs.filter(log => log.dataSource === 'MOCK')
  }

  // Get API call logs
  getApiCallLogs(): LogEntry[] {
    return this.logs.filter(log => log.category === 'API_CALL')
  }

  // Get OpenAI usage logs
  getOpenAILogs(): LogEntry[] {
    return this.logs.filter(log => log.category === 'OPENAI_USAGE')
  }

  // Get logs from file
  getLogsFromFile(): string[] {
    if (!this.isServer || !fs || !this.logFile) {
      return []
    }
    try {
      if (fs.existsSync(this.logFile)) {
        return fs.readFileSync(this.logFile, 'utf8').split('\n').filter((line: string) => line.trim())
      }
      return []
    } catch (error) {
      console.error('Failed to read log file:', error)
      return []
    }
  }

  // Export logs to JSON file
  exportLogsToFile(filename?: string): void {
    if (!this.isServer || !fs) {
      console.warn('Cannot export logs: Node.js modules not available.')
      return
    }
    try {
      const exportFile = filename || `logs-export-${new Date().toISOString().split('T')[0]}.json`
      const exportPath = path.join(process.cwd(), 'logs', exportFile)
      
      const exportData = {
        exportTimestamp: new Date().toISOString(),
        totalLogs: this.logs.length,
        logs: this.logs
      }
      
      fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2))
      console.log(`Logs exported to: ${exportPath}`)
    } catch (error) {
      console.error('Failed to export logs:', error)
    }
  }

  // Clear logs (for testing)
  clearLogs(): void {
    this.logs = []
  }
}

// Export singleton instance
export const logger = Logger.getInstance()

// Helper functions for common logging patterns
export const logApiCall = (
  component: string,
  action: string,
  provider: string,
  endpoint: string,
  method: string,
  startTime: number,
  success: boolean,
  dataSource: 'REAL' | 'MOCK' | 'CACHE',
  metadata?: Record<string, any>
) => {
  const responseTime = Date.now() - startTime
  logger.apiCall(component, action, provider, endpoint, method, responseTime, success, dataSource, metadata)
}

export const logDataSource = (
  component: string,
  action: string,
  dataSource: 'REAL' | 'MOCK' | 'CACHE',
  source: string,
  recordCount: number,
  metadata?: Record<string, any>
) => {
  logger.dataSource(component, action, dataSource, source, recordCount, metadata)
}

export const logMockData = (
  component: string,
  action: string,
  dataType: string,
  reason: string,
  metadata?: Record<string, any>
) => {
  logger.mockData(component, action, dataType, reason, metadata)
}

export const logOpenAIUsage = (
  component: string,
  action: string,
  model: string,
  tokens: number,
  cost: number,
  success: boolean,
  metadata?: Record<string, any>
) => {
  logger.openaiUsage(component, action, model, tokens, cost, success, metadata)
}

export const logSupabaseOperation = (
  component: string,
  action: string,
  table: string,
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
  success: boolean,
  recordCount: number,
  metadata?: Record<string, any>
) => {
  logger.supabaseOperation(component, action, table, operation, success, recordCount, metadata)
}

export const logPageNavigation = (
  component: string,
  action: string,
  page: string,
  userId?: string,
  metadata?: Record<string, any>
) => {
  logger.pageNavigation(component, action, page, userId, metadata)
}

export const logComponentRender = (
  component: string,
  action: string,
  props?: Record<string, any>,
  metadata?: Record<string, any>
) => {
  logger.componentRender(component, action, props, metadata)
}

export const logButtonClick = (
  component: string,
  action: string,
  buttonText: string,
  userId?: string,
  metadata?: Record<string, any>
) => {
  logger.buttonClick(component, action, buttonText, userId, metadata)
}

export const logFormSubmission = (
  component: string,
  action: string,
  formName: string,
  success: boolean,
  userId?: string,
  metadata?: Record<string, any>
) => {
  logger.formSubmission(component, action, formName, success, userId, metadata)
}

export const logDataLoading = (
  component: string,
  action: string,
  dataType: string,
  success: boolean,
  recordCount: number,
  metadata?: Record<string, any>
) => {
  logger.dataLoading(component, action, dataType, success, recordCount, metadata)
} 