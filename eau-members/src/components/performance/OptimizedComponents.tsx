import React, { memo, Suspense, lazy, useMemo, useCallback } from 'react';
import { useLazyLoad } from '../../hooks/usePerformance';

/**
 * Loading fallback component for lazy loaded components
 */
export const LoadingFallback: React.FC<{ height?: string }> = ({ height = '200px' }) => (
  <div className="flex items-center justify-center" style={{ minHeight: height }}>
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-32"></div>
    </div>
  </div>
);

/**
 * Spinner component for loading states
 */
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = memo(({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin`}>
      <svg
        className="text-indigo-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
  );
});

Spinner.displayName = 'Spinner';

/**
 * Lazy image component with loading state
 */
export const LazyImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}> = memo(({ src, alt, className = '', width, height }) => {
  const { ref, isVisible } = useLazyLoad<HTMLDivElement>({
    rootMargin: '50px'
  });

  return (
    <div ref={ref} className={className} style={{ width, height }}>
      {isVisible ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gray-200 animate-pulse" />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

/**
 * Optimized list item component
 */
interface ListItemProps {
  id: string;
  title: string;
  subtitle?: string;
  onClick?: (id: string) => void;
  actions?: React.ReactNode;
}

export const OptimizedListItem = memo<ListItemProps>(
  ({ id, title, subtitle, onClick, actions }) => {
    const handleClick = useCallback(() => {
      onClick?.(id);
    }, [id, onClick]);

    return (
      <div
        className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="ml-4 flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for memo
    return (
      prevProps.id === nextProps.id &&
      prevProps.title === nextProps.title &&
      prevProps.subtitle === nextProps.subtitle &&
      prevProps.onClick === nextProps.onClick
    );
  }
);

OptimizedListItem.displayName = 'OptimizedListItem';

/**
 * Heavy component wrapper with lazy loading
 */
export function withLazyLoad<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback || <LoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Performance monitoring component
 */
export const PerformanceMonitor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const startTime = useMemo(() => performance.now(), []);

  React.useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    if (renderTime > 100) {
      console.warn(`Slow render detected: ${renderTime.toFixed(2)}ms`);
    }
  }, [startTime]);

  return <>{children}</>;
};

/**
 * Error boundary for performance monitoring
 */
export class PerformanceErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Performance Error:', error, errorInfo);
    // You could send this to a monitoring service
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-800 font-medium">Performance Error</h3>
            <p className="text-red-600 text-sm mt-1">
              {this.state.error?.message || 'Something went wrong'}
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}