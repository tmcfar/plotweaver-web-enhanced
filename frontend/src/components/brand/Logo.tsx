import React from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon' | 'text'
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
}

const Logo: React.FC<LogoProps> = ({ 
  className, 
  size = 'md', 
  variant = 'full' 
}) => {
  const baseClasses = cn(
    'flex items-center',
    className
  )

  const iconSizeClasses = sizeClasses[size]

  const IconComponent = () => (
    <svg 
      className={cn(iconSizeClasses, 'text-primary')} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M12 2L2 7V17L12 22L22 17V7L12 2Z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12 12L2 7L12 2L22 7L12 12Z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12 12V22" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  )

  const TextComponent = () => (
    <span className={cn(
      'font-bold text-primary',
      size === 'sm' && 'text-sm',
      size === 'md' && 'text-base',
      size === 'lg' && 'text-xl',
      size === 'xl' && 'text-2xl'
    )}>
      PlotWeaver
    </span>
  )

  return (
    <div className={baseClasses}>
      {variant === 'icon' && <IconComponent />}
      {variant === 'text' && <TextComponent />}
      {variant === 'full' && (
        <>
          <IconComponent />
          <span className="ml-2">
            <TextComponent />
          </span>
        </>
      )}
    </div>
  )
}

export default Logo