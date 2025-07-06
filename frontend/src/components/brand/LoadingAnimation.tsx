import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingAnimationProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'dots' | 'pulse' | 'typewriter'
  text?: string
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  className,
  size = 'md',
  variant = 'spinner',
  text
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  const SpinnerComponent = () => (
    <div className={cn(
      'animate-spin rounded-full border-2 border-muted border-t-primary',
      sizeClasses[size],
      className
    )} />
  )

  const DotsComponent = () => (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse rounded-full bg-primary',
            size === 'sm' && 'h-2 w-2',
            size === 'md' && 'h-3 w-3',
            size === 'lg' && 'h-4 w-4'
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )

  const PulseComponent = () => (
    <div className={cn(
      'animate-pulse rounded-full bg-primary',
      sizeClasses[size],
      className
    )} />
  )

  const TypewriterComponent = () => (
    <div className={cn('flex items-center', className)}>
      <span className="text-muted-foreground">
        {text || 'Writing'}
      </span>
      <span className="ml-1 animate-pulse text-primary">|</span>
    </div>
  )

  const renderVariant = () => {
    switch (variant) {
      case 'dots':
        return <DotsComponent />
      case 'pulse':
        return <PulseComponent />
      case 'typewriter':
        return <TypewriterComponent />
      default:
        return <SpinnerComponent />
    }
  }

  return (
    <div className="flex items-center justify-center">
      {renderVariant()}
    </div>
  )
}

export default LoadingAnimation