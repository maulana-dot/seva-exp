import { cn } from '@/lib/utils'
import { Loader2, Package, Users, Shield } from 'lucide-react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  variant?: 'spinner' | 'dots' | 'pulse'
  className?: string
}

export function Loading({ size = 'md', text, variant = 'spinner', className }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  if (variant === 'spinner') {
    return (
      <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
        <Loader2 className={cn('animate-spin text-blue-600', sizeClasses[size])} />
        {text && <p className="text-sm text-gray-600">{text}</p>}
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
        </div>
        {text && <p className="text-sm text-gray-600">{text}</p>}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
        <div className={cn('bg-blue-600 rounded-full animate-pulse', sizeClasses[size])}></div>
        {text && <p className="text-sm text-gray-600">{text}</p>}
      </div>
    )
  }

  return null
}

export function PageLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loading size="lg" text={text} />
    </div>
  )
}

export function AssetLoading() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
        <Loading text="Loading assets..." />
      </div>
    </div>
  )
}

export function UserLoading() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center">
        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
        <Loading text="Loading users..." />
      </div>
    </div>
  )
}

export function AuthLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
        <Loading text="Authenticating..." />
      </div>
    </div>
  )
}

// Skeleton loaders for tables and forms
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header skeleton */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>

      {/* Rows skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-8 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Form field skeletons */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
        </div>
      ))}

      {/* Button skeleton */}
      <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
      </div>
    </div>
  )
}

// Inline loading states
export function InlineLoading({ text }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  )
}

export function ButtonLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{text}</span>
    </div>
  )
}