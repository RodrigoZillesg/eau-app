# Performance & Cache Agent

## Especialização
Otimização de performance, gerenciamento de cache, monitoramento de métricas e resolução de problemas de desempenho.

## Responsabilidades Principais

### Cache Management
- Browser cache (localStorage, sessionStorage)
- React Query cache
- CDN cache
- Database query cache
- Service Worker cache
- Redis cache (futuro)

### Performance Optimization
- Code splitting
- Lazy loading
- Bundle size reduction
- Image optimization
- Critical CSS
- Tree shaking

### Monitoring
- Core Web Vitals
- Performance metrics
- Error tracking
- User analytics
- Resource timing
- Load time analysis

### Troubleshooting
- Memory leaks
- Slow queries
- Render performance
- Network bottlenecks
- Cache invalidation

## Arquivos Principais
- `src/utils/clearCache.ts`
- `src/hooks/useAuthHealthCheck.ts`
- `vite.config.ts`
- `src/components/ErrorBoundary.tsx`
- `tailwind.config.js`
- `postcss.config.js`

## Cache Strategy

### Browser Cache
```typescript
// Cache utility functions
export const cache = {
  // Set with expiry
  set: (key: string, value: any, ttl: number = 3600) => {
    const item = {
      value,
      expiry: Date.now() + (ttl * 1000)
    };
    localStorage.setItem(key, JSON.stringify(item));
  },
  
  // Get with expiry check
  get: (key: string) => {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const data = JSON.parse(item);
    if (Date.now() > data.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data.value;
  },
  
  // Clear specific or all
  clear: (pattern?: string) => {
    if (pattern) {
      Object.keys(localStorage)
        .filter(key => key.includes(pattern))
        .forEach(key => localStorage.removeItem(key));
    } else {
      localStorage.clear();
      sessionStorage.clear();
    }
  }
};
```

### React Query Configuration
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always'
    },
    mutations: {
      retry: 2,
      retryDelay: 1000
    }
  }
});
```

### Vite Cache Headers
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        },
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'js/[name].[hash].js',
        entryFileNames: 'js/[name].[hash].js'
      }
    }
  }
});
```

## Performance Metrics

### Core Web Vitals
```typescript
interface WebVitals {
  LCP: number;  // Largest Contentful Paint < 2.5s
  FID: number;  // First Input Delay < 100ms
  CLS: number;  // Cumulative Layout Shift < 0.1
  FCP: number;  // First Contentful Paint < 1.8s
  TTFB: number; // Time to First Byte < 600ms
}

// Monitor with web-vitals library
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const reportVitals = (metric: any) => {
  console.log(metric);
  // Send to analytics
  analytics.track('web-vital', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating
  });
};

getCLS(reportVitals);
getFID(reportVitals);
getFCP(reportVitals);
getLCP(reportVitals);
getTTFB(reportVitals);
```

## Code Splitting

### Route-based Splitting
```typescript
// Lazy load routes
const Dashboard = lazy(() => import('./features/dashboard/pages/DashboardPage'));
const Events = lazy(() => import('./features/events/pages/EventsListPage'));
const Profile = lazy(() => import('./features/profile/pages/ProfilePage'));

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/events" element={<Events />} />
    <Route path="/profile" element={<Profile />} />
  </Routes>
</Suspense>
```

### Component-based Splitting
```typescript
// Heavy components
const QuillEditor = lazy(() => import('./components/ui/QuillBulletFix'));
const MediaGallery = lazy(() => import('./components/media/MediaGalleryModal'));
const ChartComponent = lazy(() => import('./components/charts/ChartComponent'));
```

## Image Optimization

### Lazy Loading
```typescript
const LazyImage = ({ src, alt, ...props }) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const imgRef = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, [src]);
  
  return <img ref={imgRef} src={imageSrc} alt={alt} {...props} />;
};
```

### Responsive Images
```html
<picture>
  <source 
    media="(max-width: 640px)" 
    srcset="image-mobile.webp" 
    type="image/webp"
  />
  <source 
    media="(max-width: 1024px)" 
    srcset="image-tablet.webp" 
    type="image/webp"
  />
  <img 
    src="image-desktop.jpg" 
    alt="Description" 
    loading="lazy"
  />
</picture>
```

## Database Query Optimization

### Query Patterns
```typescript
// Bad: N+1 problem
const users = await supabase.from('users').select('*');
for (const user of users) {
  const posts = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id);
}

// Good: Single query with join
const users = await supabase
  .from('users')
  .select(`
    *,
    posts (*)
  `);
```

### Pagination
```typescript
const PAGE_SIZE = 20;

const fetchPage = async (page: number) => {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  
  return await supabase
    .from('events')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });
};
```

## Memory Management

### Cleanup Hooks
```typescript
useEffect(() => {
  const timer = setInterval(callback, 1000);
  const listener = window.addEventListener('resize', handler);
  
  return () => {
    clearInterval(timer);
    window.removeEventListener('resize', handler);
  };
}, []);
```

### Memoization
```typescript
// Memo for expensive components
const ExpensiveComponent = memo(({ data }) => {
  return <ComplexVisualization data={data} />;
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id;
});

// useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// useCallback for stable references
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

## Bundle Analysis

```bash
# Analyze bundle size
npm run build -- --analyze

# Check bundle size limit
npm run size-limit

# Find duplicate packages
npm run find-duplicates
```

### Size Limits
```json
{
  "size-limit": [
    {
      "path": "dist/js/index.*.js",
      "limit": "200 KB"
    },
    {
      "path": "dist/js/vendor.*.js",
      "limit": "150 KB"
    }
  ]
}
```

## Known Issues & Solutions

### Loading Screen Stuck
```typescript
// Problem: Stale auth cache
// Solution: Clear on startup
useEffect(() => {
  const checkSession = async () => {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      // Clear stale cache
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
    }
  };
  checkSession();
}, []);
```

### Port Management
```bash
# Problem: Multiple dev servers on different ports
# Solution: Always use port 5180
powershell .\scripts\restart-server.ps1
```

## Performance Checklist

### Before Deploy
- [ ] Bundle size < 500KB
- [ ] All images optimized
- [ ] Lazy loading implemented
- [ ] Code splitting configured
- [ ] Cache headers set
- [ ] Service worker updated
- [ ] Database indexes created
- [ ] API rate limiting configured

### Monitoring
- [ ] Web Vitals tracking
- [ ] Error boundary logging
- [ ] Performance budgets set
- [ ] Analytics configured
- [ ] Uptime monitoring
- [ ] APM tools integrated