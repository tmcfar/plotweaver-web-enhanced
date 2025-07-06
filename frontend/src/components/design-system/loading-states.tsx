import React from 'react'
import { cn } from '@/lib/utils'
import LoadingAnimation from '@/components/brand/LoadingAnimation'

interface LoadingStateProps {
  className?: string
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export const PageLoading: React.FC<LoadingStateProps> = ({ 
  className, 
  message = 'Loading...', 
  size = 'lg' 
}) => (
  <div className={cn(
    'flex flex-col items-center justify-center min-h-64 space-y-4',
    className
  )}>
    <LoadingAnimation size={size} variant="spinner" />
    <p className="text-muted-foreground text-sm">{message}</p>
  </div>
)

export const InlineLoading: React.FC<LoadingStateProps> = ({ 
  className, 
  message,
  size = 'sm' 
}) => (
  <div className={cn(
    'flex items-center space-x-2',
    className
  )}>
    <LoadingAnimation size={size} variant="spinner" />
    {message && (
      <span className="text-muted-foreground text-sm">{message}</span>
    )}
  </div>
)

export const ButtonLoading: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingAnimation 
    size="sm" 
    variant="spinner" 
    className={cn('h-4 w-4', className)} 
  />
)

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('rounded-lg border p-6', className)}>
    <div className="animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
      <div className="h-3 bg-muted rounded w-full mb-2"></div>
      <div className="h-3 bg-muted rounded w-full mb-2"></div>
      <div className="h-3 bg-muted rounded w-2/3"></div>
    </div>
  </div>
)

export const SkeletonText: React.FC<{ 
  lines?: number
  className?: string 
}> = ({ lines = 3, className }) => (
  <div className={cn('animate-pulse space-y-2', className)}>
    {Array.from({ length: lines }, (_, i) => (
      <div 
        key={i} 
        className={cn(
          'h-3 bg-muted rounded',
          i === lines - 1 ? 'w-2/3' : 'w-full'
        )}
      />
    ))}
  </div>
)

interface WritingLoadingProps {
  className?: string
  message?: string
}

export const WritingLoading: React.FC<WritingLoadingProps> = ({ 
  className, 
  message = 'AI is writing...' 
}) => (
  <div className={cn(
    'flex items-center space-x-3 p-4 border border-dashed rounded-lg bg-muted/50',
    className
  )}>
    <LoadingAnimation variant="typewriter" text={message} />
  </div>
)

export const ProcessingLoading: React.FC<{ 
  steps: string[]
  currentStep: number
  className?: string
}> = ({ steps, currentStep, className }) => (
  <div className={cn('space-y-3', className)}>
    {steps.map((step, index) => (
      <div key={index} className="flex items-center space-x-3">
        <div className={cn(
          'w-4 h-4 rounded-full border-2 flex items-center justify-center',
          index < currentStep && 'bg-primary border-primary',
          index === currentStep && 'border-primary',
          index > currentStep && 'border-muted-foreground'
        )}>
          {index < currentStep && (
            <div className="w-2 h-2 bg-white rounded-full" />
          )}
          {index === currentStep && (
            <LoadingAnimation size="sm" variant="spinner" className="w-3 h-3" />
          )}
        </div>
        <span className={cn(
          'text-sm',
          index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {step}
        </span>
      </div>
    ))}
  </div>
)