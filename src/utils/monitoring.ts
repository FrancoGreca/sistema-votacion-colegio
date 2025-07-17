// src/utils/monitoring.ts - Sistema de Monitoreo y Analytics
export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: number
  userId?: string
  sessionId?: string
}

export interface SystemMetrics {
  performance: {
    pageLoadTime: number
    apiResponseTime: number
    renderTime: number
  }
  usage: {
    pageViews: number
    uniqueUsers: number
    votes: number
    errors: number
  }
  errors: Array<{
    message: string
    stack?: string
    timestamp: number
    userId?: string
  }>
}

/**
 * Analytics y monitoreo de eventos
 */
export class Analytics {
  private sessionId: string
  private userId?: string
  private events: AnalyticsEvent[] = []
  private metrics: Partial<SystemMetrics> = {}
  private isEnabled: boolean

  constructor() {
    this.sessionId = this.generateSessionId()
    this.isEnabled = process.env.NODE_ENV === 'production'
    this.init()
  }

  private init() {
    // Track page views
    this.trackPageView()
    
    // Track performance metrics
    this.trackPerformance()
    
    // Track errors
    this.trackErrors()
    
    // Send batched events periodically
    setInterval(() => this.flush(), 30000) // Every 30 seconds
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  setUserId(userId: string) {
    this.userId = userId
    this.track('user_identified', { userId })
  }

  track(eventName: string, properties?: Record<string, any>) {
    if (!this.isEnabled) {
      console.log('📊 Analytics (dev):', eventName, properties)
      return
    }

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    }

    this.events.push(event)
    console.log('📊 Event tracked:', event)

    // Auto-flush if buffer is full
    if (this.events.length >= 20) {
      this.flush()
    }
  }

  // Eventos específicos del dominio
  trackVote(candidateId: string, studentId?: string) {
    this.track('vote_cast', {
      candidateId,
      studentId,
      month: new Date().toLocaleString('es', { month: 'long' }),
      year: new Date().getFullYear()
    })
  }

  trackLogin(studentId: string, method: 'username' | 'demo' = 'username') {
    this.setUserId(studentId)
    this.track('user_login', { method, studentId })
  }

  trackPageView(path?: string) {
    this.track('page_view', {
      path: path || window.location.pathname,
      title: document.title,
      referrer: document.referrer
    })
  }

  trackError(error: Error, context?: Record<string, any>) {
    this.track('error_occurred', {
      message: error.message,
      stack: error.stack,
      context,
      url: window.location.href
    })

    // Also store in metrics
    if (!this.metrics.errors) this.metrics.errors = []
    this.metrics.errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      userId: this.userId
    })
  }

  trackAPICall(endpoint: string, method: string, duration: number, success: boolean) {
    this.track('api_call', {
      endpoint,
      method,
      duration,
      success,
      timestamp: Date.now()
    })

    // Update metrics
    if (!this.metrics.performance) {
      this.metrics.performance = {
        pageLoadTime: 0,
        apiResponseTime: 0,
        renderTime: 0
      }
    }
    this.metrics.performance.apiResponseTime = duration
  }

  private trackPerformance() {
    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.navigationStart
          
          this.track('page_performance', {
            loadTime,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint()
          })

          if (!this.metrics.performance) {
            this.metrics.performance = {
              pageLoadTime: 0,
              apiResponseTime: 0,
              renderTime: 0
            }
          }
          this.metrics.performance.pageLoadTime = loadTime
        }
      }, 1000)
    })
  }

  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint')
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
    return firstPaint ? firstPaint.startTime : 0
  }

  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint')
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    return fcp ? fcp.startTime : 0
  }

  private trackErrors() {
    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), {
        type: 'unhandled_promise_rejection'
      })
    })
  }

  async flush() {
    if (this.events.length === 0) return

    try {
      // In production, send to analytics service
      if (this.isEnabled) {
        await this.sendToAnalyticsService([...this.events])
      }
      
      this.events = []
      console.log('📊 Analytics events flushed')
    } catch (error) {
      console.error('📊 Failed to flush analytics:', error)
    }
  }

  private async sendToAnalyticsService(events: AnalyticsEvent[]) {
    // Here you would send to your analytics service
    // For now, we'll just log and store locally
    console.log('📊 Sending analytics events:', events)
    
    // Store in localStorage for debugging
    const stored = JSON.parse(localStorage.getItem('analytics-events') || '[]')
    stored.push(...events)
    localStorage.setItem('analytics-events', JSON.stringify(stored.slice(-100))) // Keep last 100
  }

  getMetrics(): SystemMetrics {
    return {
      performance: this.metrics.performance || {
        pageLoadTime: 0,
        apiResponseTime: 0,
        renderTime: 0
      },
      usage: {
        pageViews: this.events.filter(e => e.name === 'page_view').length,
        uniqueUsers: new Set(this.events.map(e => e.userId).filter(Boolean)).size,
        votes: this.events.filter(e => e.name === 'vote_cast').length,
        errors: this.metrics.errors?.length || 0
      },
      errors: this.metrics.errors || []
    }
  }

  // React integration
  trackComponentMount(componentName: string) {
    this.track('component_mounted', { componentName })
  }

  trackComponentUnmount(componentName: string) {
    this.track('component_unmounted', { componentName })
  }
}

// Singleton instance
export const analytics = new Analytics()

/**
 * React hook para analytics
 */
import { useEffect, useRef } from 'react'

export function useAnalytics(componentName?: string) {
  const hasTrackedMount = useRef(false)

  useEffect(() => {
    if (componentName && !hasTrackedMount.current) {
      analytics.trackComponentMount(componentName)
      hasTrackedMount.current = true

      return () => {
        analytics.trackComponentUnmount(componentName)
      }
    }
  }, [componentName])

  return {
    track: analytics.track.bind(analytics),
    trackVote: analytics.trackVote.bind(analytics),
    trackLogin: analytics.trackLogin.bind(analytics),
    trackError: analytics.trackError.bind(analytics)
  }
}

/**
 * Sistema de Health Check
 */
export class HealthChecker {
  private checks: Map<string, () => Promise<boolean>> = new Map()
  private results: Map<string, { status: boolean; timestamp: number; error?: string }> = new Map()

  constructor() {
    this.registerDefaultChecks()
  }

  private registerDefaultChecks() {
    // API Health
    this.registerCheck('api_candidates', async () => {
      try {
        const response = await fetch('/api/candidates', { 
          method: 'HEAD',
          cache: 'no-cache' 
        })
        return response.ok
      } catch {
        return false
      }
    })

    this.registerCheck('api_votes', async () => {
      try {
        const response = await fetch('/api/votes?mes=enero&ano=2025', {
          method: 'HEAD',
          cache: 'no-cache'
        })
        return response.ok
      } catch {
        return false
      }
    })

    // Database connectivity
    this.registerCheck('database_connection', async () => {
      try {
        const response = await fetch('/api/v2/diagnostics?type=status')
        const data = await response.json()
        return data.success && data.systemInfo
      } catch {
        return false
      }
    })

    // Performance check
    this.registerCheck('performance', async () => {
      const start = performance.now()
      await new Promise(resolve => setTimeout(resolve, 10))
      const duration = performance.now() - start
      return duration < 100 // Should complete in less than 100ms
    })

    // Memory usage
    this.registerCheck('memory_usage', async () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const usagePercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit
        return usagePercent < 0.9 // Less than 90% memory usage
      }
      return true // Skip if not supported
    })
  }

  registerCheck(name: string, checkFn: () => Promise<boolean>) {
    this.checks.set(name, checkFn)
  }

  async runCheck(name: string): Promise<{ status: boolean; error?: string }> {
    const checkFn = this.checks.get(name)
    if (!checkFn) {
      return { status: false, error: 'Check not found' }
    }

    try {
      const status = await checkFn()
      const result = { status, timestamp: Date.now() }
      this.results.set(name, result)
      return { status }
    } catch (error) {
      const result = { 
        status: false, 
        timestamp: Date.now(), 
        error: error instanceof Error ? error.message : String(error)
      }
      this.results.set(name, result)
      return { status: false, error: result.error }
    }
  }

  async runAllChecks(): Promise<Map<string, { status: boolean; error?: string }>> {
    const results = new Map()
    
    const checkPromises = Array.from(this.checks.keys()).map(async (name) => {
      const result = await this.runCheck(name)
      results.set(name, result)
    })

    await Promise.all(checkPromises)
    return results
  }

  getLastResults(): Map<string, { status: boolean; timestamp: number; error?: string }> {
    return new Map(this.results)
  }

  getSystemHealth(): {
    overall: 'healthy' | 'degraded' | 'unhealthy'
    score: number
    details: Record<string, any>
  } {
    const results = Array.from(this.results.values())
    const healthyCount = results.filter(r => r.status).length
    const totalCount = results.length
    
    const score = totalCount > 0 ? (healthyCount / totalCount) * 100 : 0
    
    let overall: 'healthy' | 'degraded' | 'unhealthy'
    if (score >= 90) overall = 'healthy'
    else if (score >= 70) overall = 'degraded'
    else overall = 'unhealthy'

    return {
      overall,
      score,
      details: Object.fromEntries(this.results)
    }
  }
}

// Singleton instance
export const healthChecker = new HealthChecker()

/**
 * Error Boundary mejorado con analytics
 */
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class AnalyticsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Track error in analytics
    analytics.trackError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    })

    console.error('🚨 Error Boundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-800 mb-4">
              ¡Oops! Algo salió mal
            </h1>
            <p className="text-red-600 mb-4">
              Ha ocurrido un error inesperado. Por favor, recarga la página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Recargar Página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * HOC para tracking automático de componentes
 */
export function withAnalytics<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name
  
  const WithAnalyticsComponent = (props: P) => {
    useAnalytics(displayName)
    return <WrappedComponent {...props} />
  }
  
  WithAnalyticsComponent.displayName = `withAnalytics(${displayName})`
  return WithAnalyticsComponent
}

/**
 * Hook para métricas de performance de componentes
 */
export function usePerformanceMetrics(componentName: string) {
  const renderStart = useRef<number>()
  const renderCount = useRef(0)

  useEffect(() => {
    renderStart.current = performance.now()
    renderCount.current++
  })

  useEffect(() => {
    if (renderStart.current) {
      const renderTime = performance.now() - renderStart.current
      analytics.track('component_render', {
        componentName,
        renderTime,
        renderCount: renderCount.current
      })
    }
  })

  return {
    markInteraction: (interactionName: string) => {
      analytics.track('component_interaction', {
        componentName,
        interactionName,
        timestamp: Date.now()
      })
    }
  }
}