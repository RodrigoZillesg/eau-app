import React from 'react'

interface SkeletonLoaderProps {
  className?: string
  variant?: 'text' | 'rectangle' | 'circle' | 'card' | 'table-row'
  lines?: number
  width?: string
  height?: string
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  variant = 'text',
  lines = 1,
  width,
  height
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded'
  
  const variants = {
    text: 'h-4',
    rectangle: 'h-6',
    circle: 'rounded-full',
    card: 'h-32',
    'table-row': 'h-12'
  }
  
  const variantClasses = variants[variant]
  
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${variantClasses}`}
            style={{
              width: index === lines - 1 ? '75%' : width || '100%',
              height
            }}
          />
        ))}
      </div>
    )
  }
  
  return (
    <div
      className={`${baseClasses} ${variantClasses} ${className}`}
      style={{
        width: width || '100%',
        height: height || undefined
      }}
    />
  )
}

// Skeleton específico para cards de estatísticas
export const StatsCardSkeleton: React.FC = () => (
  <div className="p-6 border rounded-lg bg-white">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonLoader variant="text" width="80px" />
        <SkeletonLoader variant="text" width="40px" height="32px" />
      </div>
      <SkeletonLoader variant="circle" width="32px" height="32px" />
    </div>
  </div>
)

// Skeleton para lista de memberships
export const MembershipTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
        <div className="flex-1 space-y-2">
          <SkeletonLoader variant="text" width="200px" />
          <SkeletonLoader variant="text" width="150px" />
        </div>
        <SkeletonLoader variant="text" width="100px" />
        <SkeletonLoader variant="text" width="80px" />
        <SkeletonLoader variant="text" width="60px" />
        <SkeletonLoader variant="text" width="80px" />
        <div className="flex space-x-2">
          <SkeletonLoader variant="circle" width="16px" height="16px" />
          <SkeletonLoader variant="circle" width="16px" height="16px" />
        </div>
      </div>
    ))}
  </div>
)

// Skeleton para cards de distribuição
export const DistributionCardSkeleton: React.FC = () => (
  <div className="p-6 border rounded-lg bg-white">
    <SkeletonLoader variant="text" width="150px" className="mb-4" />
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between">
          <SkeletonLoader variant="text" width="120px" />
          <div className="flex items-center gap-2">
            <SkeletonLoader variant="text" width="30px" />
            <SkeletonLoader variant="text" width="40px" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Skeleton para tabela de instituições
export const InstitutionTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50 border-b">
        <tr>
          <th className="px-4 py-3 text-left">
            <SkeletonLoader variant="text" width="100px" height="12px" />
          </th>
          <th className="px-4 py-3 text-left">
            <SkeletonLoader variant="text" width="80px" height="12px" />
          </th>
          <th className="px-4 py-3 text-left">
            <SkeletonLoader variant="text" width="80px" height="12px" />
          </th>
          <th className="px-4 py-3 text-left">
            <SkeletonLoader variant="text" width="60px" height="12px" />
          </th>
          <th className="px-4 py-3 text-left">
            <SkeletonLoader variant="text" width="70px" height="12px" />
          </th>
          <th className="px-4 py-3 text-left">
            <SkeletonLoader variant="text" width="60px" height="12px" />
          </th>
          <th className="px-4 py-3 text-left">
            <SkeletonLoader variant="text" width="60px" height="12px" />
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, index) => (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-4 py-3">
              <div className="space-y-1">
                <SkeletonLoader variant="text" width="180px" />
                <SkeletonLoader variant="text" width="120px" height="14px" />
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="space-y-1">
                <SkeletonLoader variant="text" width="150px" height="14px" />
                <SkeletonLoader variant="text" width="100px" height="14px" />
              </div>
            </td>
            <td className="px-4 py-3">
              <SkeletonLoader variant="text" width="120px" height="14px" />
            </td>
            <td className="px-4 py-3">
              <SkeletonLoader variant="text" width="80px" height="14px" />
            </td>
            <td className="px-4 py-3">
              <div className="space-y-1">
                <SkeletonLoader variant="text" width="70px" height="14px" />
                <SkeletonLoader variant="text" width="90px" height="14px" />
              </div>
            </td>
            <td className="px-4 py-3">
              <SkeletonLoader variant="rectangle" width="60px" height="22px" />
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <SkeletonLoader variant="circle" width="20px" height="20px" />
                <SkeletonLoader variant="circle" width="20px" height="20px" />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)