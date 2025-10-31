/**
 * Performance monitoring utility
 * Tracks and reports on application performance metrics
 */

interface PerformanceMetrics {
  navigationTime: number;
  pageLoadTime: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
  timeToInteractive?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    navigationTime: 0,
    pageLoadTime: 0
  };

  constructor() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring() {
    // Monitor page load time
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (perfData) {
        this.metrics.navigationTime = perfData.responseEnd - perfData.fetchStart;
        this.metrics.pageLoadTime = perfData.loadEventEnd - perfData.fetchStart;
      }
    });

    // Monitor Core Web Vitals
    this.observeWebVitals();
  }

  private observeWebVitals() {
    // Observe First Contentful Paint (FCP)
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.firstContentfulPaint = fcpEntry.startTime;
      }
    });

    try {
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.debug('Paint observer not supported');
    }

    // Observe Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        this.metrics.largestContentfulPaint = lastEntry.startTime;
      }
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.debug('LCP observer not supported');
    }

    // Observe Cumulative Layout Shift (CLS)
    let clsScore = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsScore += (entry as any).value;
          this.metrics.cumulativeLayoutShift = clsScore;
        }
      }
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.debug('CLS observer not supported');
    }

    // Observe First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const firstInput = entries[0] as PerformanceEventTiming;
        this.metrics.firstInputDelay = firstInput.processingStart - firstInput.startTime;
      }
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.debug('FID observer not supported');
    }
  }

  /**
   * Mark a specific point in time for custom performance measurement
   */
  mark(markName: string) {
    if (performance.mark) {
      performance.mark(markName);
    }
  }

  /**
   * Measure the time between two marks
   */
  measure(measureName: string, startMark: string, endMark?: string) {
    if (performance.measure) {
      try {
        if (endMark) {
          performance.measure(measureName, startMark, endMark);
        } else {
          performance.measure(measureName, startMark);
        }
        const measures = performance.getEntriesByName(measureName);
        return measures[measures.length - 1]?.duration;
      } catch (e) {
        console.debug('Performance measurement failed:', e);
      }
    }
    return null;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Log performance metrics to console (only in development)
   */
  logMetrics() {
    if (process.env.NODE_ENV === 'development') {
      console.group('📊 Performance Metrics');
      console.table(this.metrics);
      console.groupEnd();
    }
  }

  /**
   * Send metrics to analytics service
   */
  sendMetrics(endpoint?: string) {
    // Only send in production
    if (process.env.NODE_ENV === 'production' && endpoint) {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: this.metrics,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(err => {
        console.debug('Failed to send metrics:', err);
      });
    }
  }

  /**
   * Check if performance is within acceptable thresholds
   */
  checkThresholds() {
    const warnings: string[] = [];

    if (this.metrics.largestContentfulPaint && this.metrics.largestContentfulPaint > 2500) {
      warnings.push(`Slow LCP: ${this.metrics.largestContentfulPaint.toFixed(2)}ms (should be < 2500ms)`);
    }

    if (this.metrics.firstInputDelay && this.metrics.firstInputDelay > 100) {
      warnings.push(`Slow FID: ${this.metrics.firstInputDelay.toFixed(2)}ms (should be < 100ms)`);
    }

    if (this.metrics.cumulativeLayoutShift && this.metrics.cumulativeLayoutShift > 0.1) {
      warnings.push(`High CLS: ${this.metrics.cumulativeLayoutShift.toFixed(3)} (should be < 0.1)`);
    }

    if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Performance Issues Detected:', warnings);
    }

    return warnings;
  }

  /**
   * Clear all performance marks and measures
   */
  clear() {
    if (performance.clearMarks) {
      performance.clearMarks();
    }
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility function to measure async operations
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;

  performanceMonitor.mark(startMark);

  try {
    const result = await operation();
    performanceMonitor.mark(endMark);
    const duration = performanceMonitor.measure(name, startMark, endMark);

    if (duration && duration > 1000 && process.env.NODE_ENV === 'development') {
      console.warn(`⏱️ Slow operation "${name}": ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    performanceMonitor.mark(endMark);
    performanceMonitor.measure(name, startMark, endMark);
    throw error;
  }
}

// React hook for component render performance
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const renderStartTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const renderTime = performance.now() - renderStartTime.current;

    if (renderTime > 50 && process.env.NODE_ENV === 'development') {
      console.warn(`⚡ Slow render in ${componentName}: ${renderTime.toFixed(2)}ms (render #${renderCount.current})`);
    }

    renderStartTime.current = performance.now();
  });

  return {
    renderCount: renderCount.current,
    measureRender: () => performance.now() - renderStartTime.current
  };
}

import { useRef, useEffect } from 'react';