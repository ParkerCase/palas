'use client'

import { useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { logger, logPageNavigation, logButtonClick, logComponentRender, logFormSubmission } from '@/lib/utils/logger'
import React from 'react'

export function useLogging(userId?: string) {
  const router = useRouter()
  const pathname = usePathname()

  // Log page navigation
  useEffect(() => {
    if (pathname) {
      logPageNavigation(
        'PageNavigation',
        'navigate',
        pathname,
        userId,
        {
          timestamp: new Date().toISOString(),
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
          referrer: typeof window !== 'undefined' ? document.referrer : 'server'
        }
      )
    }
  }, [pathname, userId])

  // Log component render
  const logRender = useCallback((componentName: string, props?: Record<string, any>) => {
    logComponentRender(
      componentName,
      'render',
      props,
      {
        userId,
        pathname,
        timestamp: new Date().toISOString()
      }
    )
  }, [userId, pathname])

  // Log button click
  const logClick = useCallback((buttonText: string, componentName: string, metadata?: Record<string, any>) => {
    logButtonClick(
      componentName,
      'click',
      buttonText,
      userId,
      {
        ...metadata,
        pathname,
        timestamp: new Date().toISOString()
      }
    )
  }, [userId, pathname])

  // Log form submission
  const logForm = useCallback((formName: string, success: boolean, componentName: string, metadata?: Record<string, any>) => {
    logFormSubmission(
      componentName,
      'submit',
      formName,
      success,
      userId,
      {
        ...metadata,
        pathname,
        timestamp: new Date().toISOString()
      }
    )
  }, [userId, pathname])

  // Log data loading
  const logDataLoad = useCallback((dataType: string, success: boolean, recordCount: number, componentName: string, metadata?: Record<string, any>) => {
    logger.dataLoading(
      componentName,
      'load',
      dataType,
      success,
      recordCount,
      {
        ...metadata,
        userId,
        pathname,
        timestamp: new Date().toISOString()
      }
    )
  }, [userId, pathname])

  // Log API call
  const logApi = useCallback((
    provider: string,
    endpoint: string,
    method: string,
    startTime: number,
    success: boolean,
    dataSource: 'REAL' | 'MOCK' | 'CACHE',
    componentName: string,
    metadata?: Record<string, any>
  ) => {
    logger.apiCall(
      componentName,
      'api_call',
      provider,
      endpoint,
      method,
      Date.now() - startTime,
      success,
      dataSource,
      {
        ...metadata,
        userId,
        pathname,
        timestamp: new Date().toISOString()
      }
    )
  }, [userId, pathname])

  // Log error
  const logError = useCallback((error: Error, componentName: string, action: string, metadata?: Record<string, any>) => {
    logger.error(
      componentName,
      action,
      error.message,
      error,
      {
        ...metadata,
        userId,
        pathname,
        timestamp: new Date().toISOString()
      }
    )
  }, [userId, pathname])

  // Log info
  const logInfo = useCallback((message: string, componentName: string, action: string, metadata?: Record<string, any>) => {
    logger.info(
      componentName,
      action,
      message,
      {
        ...metadata,
        userId,
        pathname,
        timestamp: new Date().toISOString()
      }
    )
  }, [userId, pathname])

  // Log warning
  const logWarning = useCallback((message: string, componentName: string, action: string, metadata?: Record<string, any>) => {
    logger.warn(
      componentName,
      action,
      message,
      {
        ...metadata,
        userId,
        pathname,
        timestamp: new Date().toISOString()
      }
    )
  }, [userId, pathname])

  // Log mock data detection
  const logMock = useCallback((dataType: string, reason: string, componentName: string, metadata?: Record<string, any>) => {
    logger.mockData(
      componentName,
      'detect',
      dataType,
      reason,
      {
        ...metadata,
        userId,
        pathname,
        timestamp: new Date().toISOString()
      }
    )
  }, [userId, pathname])

  return {
    logRender,
    logClick,
    logForm,
    logDataLoad,
    logApi,
    logError,
    logInfo,
    logWarning,
    logMock
  }
}

// Higher-order component for automatic component logging
export function withLogging<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return function LoggedComponent(props: P) {
    const { logRender } = useLogging()
    
    useEffect(() => {
      logRender(componentName, props)
    }, [logRender])

    return React.createElement(Component, props)
  }
}

// Hook for logging form interactions
export function useFormLogging(formName: string, componentName: string, userId?: string) {
  const { logForm, logError, logInfo } = useLogging(userId)

  const handleSubmit = useCallback(async (
    submitFn: () => Promise<any>,
    metadata?: Record<string, any>
  ) => {
    const startTime = Date.now()
    
    try {
      logInfo('Form submission started', componentName, 'submit_start', {
        formName,
        startTime,
        ...metadata
      })

      const result = await submitFn()
      
      const success = true
      logForm(formName, success, componentName, {
        ...metadata,
        responseTime: Date.now() - startTime,
        result: typeof result === 'object' ? Object.keys(result) : typeof result
      })

      return result
    } catch (error) {
      const success = false
      logForm(formName, success, componentName, {
        ...metadata,
        responseTime: Date.now() - startTime
      })

      logError(error instanceof Error ? error : new Error(String(error)), componentName, 'submit_error', {
        formName,
        ...metadata
      })

      throw error
    }
  }, [formName, componentName, logForm, logError, logInfo])

  return { handleSubmit }
}

// Hook for logging API calls
export function useApiLogging(componentName: string, userId?: string) {
  const { logApi, logError, logMock } = useLogging(userId)

  const callApi = useCallback(async <T>(
    apiCall: () => Promise<T>,
    provider: string,
    endpoint: string,
    method: string = 'GET',
    metadata?: Record<string, any>
  ): Promise<T> => {
    const startTime = Date.now()
    
    try {
      const result = await apiCall()
      
      // Determine if this is real data or mock data
      const dataSource = determineDataSource(result)
      
      logApi(provider, endpoint, method, startTime, true, dataSource, componentName, {
        ...metadata,
        resultType: typeof result,
        resultKeys: typeof result === 'object' && result !== null ? Object.keys(result) : undefined
      })

      // If this appears to be mock data, log a warning
      if (dataSource === 'MOCK') {
        logMock('API Response', 'Detected potential mock data in API response', componentName, {
          provider,
          endpoint,
          resultSample: typeof result === 'object' && result !== null ? 
            Object.keys(result).slice(0, 3) : typeof result
        })
      }

      return result
    } catch (error) {
      logApi(provider, endpoint, method, startTime, false, 'MOCK', componentName, {
        ...metadata,
        error: error instanceof Error ? error.message : String(error)
      })

      logError(error instanceof Error ? error : new Error(String(error)), componentName, 'api_error', {
        provider,
        endpoint,
        method,
        ...metadata
      })

      throw error
    }
  }, [componentName, logApi, logError, logMock])

  return { callApi }
}

// Helper function to determine if data appears to be mock data
function determineDataSource(data: any): 'REAL' | 'MOCK' | 'CACHE' {
  if (!data) return 'REAL' // Empty/null data is usually real

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

  const dataStr = JSON.stringify(data).toLowerCase()
  if (mockPatterns.some(pattern => dataStr.includes(pattern))) {
    return 'MOCK'
  }

  // Check for unrealistic data patterns
  if (typeof data === 'object') {
    // Check for unrealistic IDs
    if (data.id && (data.id === 'mock-id' || data.id === 'test-id' || data.id === 'sample-id')) {
      return 'MOCK'
    }

    // Check for unrealistic timestamps (far future or past)
    if (data.created_at || data.updated_at) {
      const timestamp = new Date(data.created_at || data.updated_at)
      const now = new Date()
      const diffDays = Math.abs((timestamp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays > 365 * 10) { // More than 10 years difference
        return 'MOCK'
      }
    }

    // Check for unrealistic amounts
    if (data.amount && (data.amount === 0 || data.amount === 999999 || data.amount === 1000000)) {
      return 'MOCK'
    }
  }

  return 'REAL'
} 