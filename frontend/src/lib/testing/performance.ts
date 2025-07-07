// Performance testing utilities
import { render, screen } from '@testing-library/react'
import { act } from 'react'

// Performance metrics interface
interface PerformanceMetrics {
  renderTime: number
  componentCount: number
  memoryUsage: number
  bundleSize?: number
  firstContentfulPaint?: number
  largestContentfulPaint?: number
  cumulativeLayoutShift?: number
  firstInputDelay?: number
  totalBlockingTime?: number
}

// Performance test configuration
interface PerformanceTestConfig {
  maxRenderTime?: number
  maxMemoryUsage?: number
  maxBundleSize?: number
  iterations?: number
  warmupIterations?: number
  gcBetweenTests?: boolean
}

const defaultConfig: PerformanceTestConfig = {
  maxRenderTime: 16, // 16ms for 60fps
  maxMemoryUsage: 50 * 1024 * 1024, // 50MB
  maxBundleSize: 1024 * 1024, // 1MB
  iterations: 10,
  warmupIterations: 3,
  gcBetweenTests: true
}

// Test component render performance
export async function testRenderPerformance(
  component: React.ReactElement,
  config: PerformanceTestConfig = {}
): Promise<PerformanceMetrics> {
  const testConfig = { ...defaultConfig, ...config }
  const metrics: PerformanceMetrics[] = []
  
  // Warmup iterations
  for (let i = 0; i < testConfig.warmupIterations!; i++) {
    const { unmount } = render(component)
    unmount()
    if (testConfig.gcBetweenTests && (window as any).gc) {
      (window as any).gc()
    }
  }
  
  // Actual test iterations
  for (let i = 0; i < testConfig.iterations!; i++) {
    const startTime = performance.now()
    const startMemory = getMemoryUsage()
    
    let componentCount = 0
    const originalCreateElement = React.createElement
    React.createElement = (...args) => {
      componentCount++
      return originalCreateElement(...args)
    }
    
    const { unmount } = render(component)
    
    const endTime = performance.now()
    const endMemory = getMemoryUsage()
    
    React.createElement = originalCreateElement
    
    metrics.push({
      renderTime: endTime - startTime,
      componentCount,
      memoryUsage: endMemory - startMemory
    })
    
    unmount()
    
    if (testConfig.gcBetweenTests && (window as any).gc) {
      (window as any).gc()
    }
  }
  
  // Calculate average metrics
  const avgMetrics = metrics.reduce((acc, metric) => ({
    renderTime: acc.renderTime + metric.renderTime,
    componentCount: acc.componentCount + metric.componentCount,
    memoryUsage: acc.memoryUsage + metric.memoryUsage
  }), { renderTime: 0, componentCount: 0, memoryUsage: 0 })
  
  const finalMetrics: PerformanceMetrics = {
    renderTime: avgMetrics.renderTime / metrics.length,
    componentCount: avgMetrics.componentCount / metrics.length,
    memoryUsage: avgMetrics.memoryUsage / metrics.length
  }
  
  // Assertions
  if (testConfig.maxRenderTime) {
    expect(finalMetrics.renderTime).toBeLessThanOrEqual(testConfig.maxRenderTime)
  }
  
  if (testConfig.maxMemoryUsage) {
    expect(finalMetrics.memoryUsage).toBeLessThanOrEqual(testConfig.maxMemoryUsage)
  }
  
  return finalMetrics
}

// Test component re-render performance
export async function testReRenderPerformance(
  ComponentWithProps: React.ComponentType<any>,
  propSets: any[],
  config: PerformanceTestConfig = {}
): Promise<PerformanceMetrics> {
  const testConfig = { ...defaultConfig, ...config }
  const metrics: number[] = []
  
  const { rerender } = render(<ComponentWithProps {...propSets[0]} />)
  
  // Warmup
  for (let i = 0; i < testConfig.warmupIterations!; i++) {
    rerender(<ComponentWithProps {...propSets[i % propSets.length]} />)
  }
  
  // Actual tests
  for (let i = 0; i < testConfig.iterations!; i++) {
    const startTime = performance.now()
    
    await act(async () => {
      rerender(<ComponentWithProps {...propSets[i % propSets.length]} />)
    })
    
    const endTime = performance.now()
    metrics.push(endTime - startTime)
  }
  
  const avgRenderTime = metrics.reduce((a, b) => a + b, 0) / metrics.length
  
  return {
    renderTime: avgRenderTime,
    componentCount: 0,
    memoryUsage: 0
  }
}

// Test virtualization performance
export async function testVirtualizationPerformance(
  VirtualizedComponent: React.ComponentType<any>,
  itemCount: number,
  config: PerformanceTestConfig = {}
): Promise<PerformanceMetrics> {
  const items = Array.from({ length: itemCount }, (_, i) => ({ id: i, data: `Item ${i}` }))
  
  const startTime = performance.now()
  const startMemory = getMemoryUsage()
  
  const { container } = render(
    <VirtualizedComponent items={items} itemHeight={50} containerHeight={400} />
  )
  
  const endTime = performance.now()
  const endMemory = getMemoryUsage()
  
  // Count rendered items (should be much less than total items)
  const renderedItems = container.querySelectorAll('[data-testid="virtualized-item"]')
  
  const metrics: PerformanceMetrics = {
    renderTime: endTime - startTime,
    componentCount: renderedItems.length,
    memoryUsage: endMemory - startMemory
  }
  
  // Virtualization should render only visible items
  expect(renderedItems.length).toBeLessThan(itemCount)
  expect(renderedItems.length).toBeGreaterThan(0)
  
  return metrics
}

// Test lazy loading performance
export async function testLazyLoadingPerformance(
  LazyComponent: React.ComponentType<any>,
  config: PerformanceTestConfig = {}
): Promise<PerformanceMetrics> {
  const startTime = performance.now()
  const startMemory = getMemoryUsage()
  
  // Mock intersection observer
  const mockIntersectionObserver = jest.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  })
  
  window.IntersectionObserver = mockIntersectionObserver
  
  const { container } = render(<LazyComponent />)
  
  // Component should render placeholder initially
  expect(container.querySelector('[data-testid="loading-placeholder"]')).toBeInTheDocument()
  
  // Simulate intersection
  const [{ callback }] = mockIntersectionObserver.mock.calls
  callback([{ isIntersecting: true }])
  
  // Wait for lazy component to load
  await screen.findByTestId('lazy-content')
  
  const endTime = performance.now()
  const endMemory = getMemoryUsage()
  
  return {
    renderTime: endTime - startTime,
    componentCount: 1,
    memoryUsage: endMemory - startMemory
  }
}

// Test memory leaks
export async function testMemoryLeaks(
  component: React.ReactElement,
  iterations: number = 100
): Promise<boolean> {
  const initialMemory = getMemoryUsage()
  const memoryReadings: number[] = []
  
  for (let i = 0; i < iterations; i++) {
    const { unmount } = render(component)
    unmount()
    
    if (i % 10 === 0) {
      if ((window as any).gc) {
        (window as any).gc()
      }
      memoryReadings.push(getMemoryUsage())
    }
  }
  
  const finalMemory = getMemoryUsage()
  const memoryIncrease = finalMemory - initialMemory
  
  // Check for significant memory increase (potential leak)
  const threshold = 10 * 1024 * 1024 // 10MB
  const hasMemoryLeak = memoryIncrease > threshold
  
  if (hasMemoryLeak) {
    console.warn(`Potential memory leak detected: ${memoryIncrease} bytes`)
  }
  
  return !hasMemoryLeak
}

// Bundle size analysis
export async function analyzeBundleSize(
  componentPath: string
): Promise<number> {
  // This would typically use webpack-bundle-analyzer or similar
  // For now, return a mock size
  return 1024 * 50 // 50KB
}

// Core Web Vitals testing
export async function testCoreWebVitals(
  component: React.ReactElement
): Promise<Partial<PerformanceMetrics>> {
  const metrics: Partial<PerformanceMetrics> = {}
  
  // Mock performance observer
  const mockPerformanceObserver = jest.fn()
  mockPerformanceObserver.mockImplementation((callback) => ({
    observe: () => {
      // Mock LCP entry
      callback({
        getEntries: () => [
          { name: 'largest-contentful-paint', startTime: 1500 }
        ]
      })
    },
    disconnect: () => null
  }))
  
  window.PerformanceObserver = mockPerformanceObserver
  
  const startTime = performance.now()
  render(component)
  
  // Mock FCP
  metrics.firstContentfulPaint = performance.now() - startTime
  
  // Mock LCP (from performance observer)
  metrics.largestContentfulPaint = 1500
  
  // Mock CLS (cumulative layout shift)
  metrics.cumulativeLayoutShift = 0.1
  
  return metrics
}

// Performance test suite
export class PerformanceTestSuite {
  private component: React.ReactElement
  private config: PerformanceTestConfig
  
  constructor(component: React.ReactElement, config: PerformanceTestConfig = {}) {
    this.component = component
    this.config = { ...defaultConfig, ...config }
  }
  
  async runAll(): Promise<{
    render: PerformanceMetrics
    memory: boolean
    webVitals: Partial<PerformanceMetrics>
  }> {
    const results = {
      render: await this.testRender(),
      memory: await this.testMemory(),
      webVitals: await this.testWebVitals()
    }
    
    return results
  }
  
  private async testRender(): Promise<PerformanceMetrics> {
    return testRenderPerformance(this.component, this.config)
  }
  
  private async testMemory(): Promise<boolean> {
    return testMemoryLeaks(this.component)
  }
  
  private async testWebVitals(): Promise<Partial<PerformanceMetrics>> {
    return testCoreWebVitals(this.component)
  }
}

// Utility functions
function getMemoryUsage(): number {
  if ((performance as any).memory) {
    return (performance as any).memory.usedJSHeapSize
  }
  return 0
}

// Performance monitoring hook
export function usePerformanceMonitoring(componentName: string) {
  React.useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      if (renderTime > 16) {
        console.warn(`${componentName} took ${renderTime}ms to render (>16ms threshold)`)
      }
    }
  }, [componentName])
}

// Performance assertions
export const performanceMatchers = {
  toRenderWithin: (received: () => React.ReactElement, maxTime: number) => {
    const startTime = performance.now()
    render(received())
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    return {
      pass: renderTime <= maxTime,
      message: () => `Expected component to render within ${maxTime}ms but took ${renderTime}ms`
    }
  },
  
  toUseMemoryWithin: (received: () => React.ReactElement, maxMemory: number) => {
    const startMemory = getMemoryUsage()
    const { unmount } = render(received())
    const endMemory = getMemoryUsage()
    const memoryUsed = endMemory - startMemory
    
    unmount()
    
    return {
      pass: memoryUsed <= maxMemory,
      message: () => `Expected component to use less than ${maxMemory} bytes but used ${memoryUsed} bytes`
    }
  }
}

// Export performance test utilities
export {
  testRenderPerformance,
  testReRenderPerformance,
  testVirtualizationPerformance,
  testLazyLoadingPerformance,
  testMemoryLeaks,
  testCoreWebVitals,
  analyzeBundleSize,
  PerformanceTestSuite
}