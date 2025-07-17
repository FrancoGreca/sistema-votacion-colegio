// src/utils/performance.ts - Performance Optimizations
import { useCallback, useMemo, useRef, useEffect } from 'react'

/**
 * Hook para lazy loading de imágenes
 */
export function useLazyImage(src: string, placeholder: string = '') {
  const [imageSrc, setImageSrc] = useState(placeholder)
  const [isLoading, setIsLoading] = useState(true)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image()
          img.onload = () => {
            setImageSrc(src)
            setIsLoading(false)
          }
          img.src = src
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [src])

  return { imageSrc, isLoading, imgRef }
}

/**
 * Hook para virtual scrolling en listas grandes
 */
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  )

  const visibleItems = useMemo(
    () => items.slice(visibleStart, visibleEnd),
    [items, visibleStart, visibleEnd]
  )

  const totalHeight = items.length * itemHeight
  const offsetY = visibleStart * itemHeight

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop)
    }
  }
}

/**
 * Hook para debounce optimizado
 */
export function useOptimizedDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook para memoización inteligente de resultados
 */
export function useSmartMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  isEqual?: (a: T, b: T) => boolean
): T {
  const memoRef = useRef<{ deps: React.DependencyList; value: T }>()

  return useMemo(() => {
    if (!memoRef.current) {
      const value = factory()
      memoRef.current = { deps, value }
      return value
    }

    const hasChanged = deps.some((dep, index) => 
      !Object.is(dep, memoRef.current!.deps[index])
    )

    if (hasChanged) {
      const newValue = factory()
      
      if (isEqual && isEqual(newValue, memoRef.current.value)) {
        memoRef.current.deps = deps
        return memoRef.current.value
      }

      memoRef.current = { deps, value: newValue }
      return newValue
    }

    return memoRef.current.value
  }, deps)
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  private observers: PerformanceObserver[] = []

  constructor() {
    this.initObservers()
  }

  private initObservers() {
    // Monitor navigation timing
    if ('PerformanceObserver' in window) {
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.recordMetric('navigation', entry.duration)
          }
        })
      })
      
      navObserver.observe({ entryTypes: ['navigation'] })
      this.observers.push(navObserver)

      // Monitor largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric('lcp', entry.startTime)
        })
      })
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(lcpObserver)

      // Monitor first input delay
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          this.recordMetric('fid', entry.processingStart - entry.startTime)
        })
      })
      
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.push(fidObserver)
    }
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)
  }

  getMetrics() {
    const results: Record<string, any> = {}
    
    this.metrics.forEach((values, name) => {
      results[name] = {
        count: values.length,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        latest: values[values.length - 1]
      }
    })

    return results
  }

  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    
    return fn().finally(() => {
      const duration = performance.now() - start
      this.recordMetric(name, duration)
    })
  }

  measureSync<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start
    this.recordMetric(name, duration)
    return result
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.metrics.clear()
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Image optimization utilities
 */
export class ImageOptimizer {
  static async compressImage(
    file: File, 
    maxWidth: number = 800,
    quality: number = 0.8
  ): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        canvas.toBlob(resolve, 'image/jpeg', quality)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  static generatePlaceholder(width: number, height: number): string {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(0, 0, width, height)
    
    return canvas.toDataURL()
  }
}

/**
 * Memory optimization utilities
 */
export class MemoryOptimizer {
  private static cache = new Map<string, WeakRef<any>>()
  private static cleanupInterval: NodeJS.Timeout

  static init() {
    // Cleanup expired weak references every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 30000)
  }

  static store<T extends object>(key: string, value: T): T {
    this.cache.set(key, new WeakRef(value))
    return value
  }

  static get<T>(key: string): T | undefined {
    const ref = this.cache.get(key)
    if (ref) {
      const value = ref.deref()
      if (value) {
        return value
      } else {
        this.cache.delete(key)
      }
    }
    return undefined
  }

  private static cleanup() {
    for (const [key, ref] of this.cache.entries()) {
      if (!ref.deref()) {
        this.cache.delete(key)
      }
    }
  }

  static destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
  }
}

/**
 * Bundle optimization utilities
 */
export class BundleOptimizer {
  static async loadComponent<T>(
    importFn: () => Promise<{ default: T }>
  ): Promise<T> {
    const start = performance.now()
    
    try {
      const { default: Component } = await importFn()
      const loadTime = performance.now() - start
      
      performanceMonitor.recordMetric('component-load', loadTime)
      console.log(`📦 Component loaded in ${loadTime.toFixed(2)}ms`)
      
      return Component
    } catch (error) {
      console.error('❌ Failed to load component:', error)
      throw error
    }
  }

  static preloadRoute(route: string) {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = route
    document.head.appendChild(link)
  }

  static preloadImages(urls: string[]) {
    urls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url
      document.head.appendChild(link)
    })
  }
}

// Initialize memory optimizer
if (typeof window !== 'undefined') {
  MemoryOptimizer.init()
}

// src/components/optimized/VirtualizedCandidateList.tsx
import React from 'react'
import { useVirtualList } from '../../utils/performance'
import { CandidateCard } from '../voting/VotingComponents'
import { Candidate } from '../../contexts/VotingContext'

interface VirtualizedCandidateListProps {
  candidates: Candidate[]
  onCandidateSelect?: (candidateId: string) => void
  selectedCandidateId?: string
  containerHeight?: number
  itemHeight?: number
}

export function VirtualizedCandidateList({
  candidates,
  onCandidateSelect,
  selectedCandidateId,
  containerHeight = 600,
  itemHeight = 180
}: VirtualizedCandidateListProps) {
  const {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll
  } = useVirtualList(candidates, itemHeight, containerHeight)

  return (
    <div 
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={onScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div 
          style={{ 
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            width: '100%'
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleItems.map((candidate, index) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                isSelected={selectedCandidateId === candidate.id}
                onSelect={onCandidateSelect}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}