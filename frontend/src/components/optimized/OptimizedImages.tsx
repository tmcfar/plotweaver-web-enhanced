'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  fill?: boolean
  style?: React.CSSProperties
  onLoad?: () => void
  onError?: () => void
  eager?: boolean
  webpFallback?: boolean
  responsive?: boolean
  aspectRatio?: number
}

// Base optimized image component with Next.js Image
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  fill = false,
  style,
  onLoad,
  onError,
  eager = false,
  webpFallback = true,
  responsive = true,
  aspectRatio,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)

  // Generate blur placeholder if not provided
  const generatedBlurDataURL = useMemo(() => {
    if (blurDataURL) return blurDataURL
    
    // Generate a simple blur placeholder
    const canvas = document.createElement('canvas')
    canvas.width = 40
    canvas.height = 40
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 40, 40)
      gradient.addColorStop(0, '#f3f4f6')
      gradient.addColorStop(1, '#e5e7eb')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 40, 40)
    }
    
    return canvas.toDataURL('image/jpeg', 0.1)
  }, [blurDataURL])

  // WebP support detection
  const [supportsWebP, setSupportsWebP] = useState<boolean | null>(null)

  useEffect(() => {
    const checkWebPSupport = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        const dataURL = canvas.toDataURL('image/webp')
        setSupportsWebP(dataURL.indexOf('data:image/webp') === 0)
      } else {
        setSupportsWebP(false)
      }
    }

    checkWebPSupport()
  }, [])

  // Optimize source URL based on format support
  const optimizedSrc = useMemo(() => {
    if (!webpFallback || supportsWebP === null) return currentSrc
    
    // If WebP is supported and source is not already WebP
    if (supportsWebP && !currentSrc.includes('.webp')) {
      // Check if we can convert to WebP (this would typically be handled by your image service)
      return currentSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    }
    
    return currentSrc
  }, [currentSrc, supportsWebP, webpFallback])

  // Responsive sizes
  const responsiveSizes = useMemo(() => {
    if (sizes) return sizes
    if (!responsive) return undefined
    
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
  }, [sizes, responsive])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    
    // Fallback to original format if WebP fails
    if (webpFallback && optimizedSrc !== src) {
      setCurrentSrc(src)
      setHasError(false)
      return
    }
    
    onError?.()
  }

  // Error state
  if (hasError) {
    return (
      <div 
        className={cn(
          'bg-muted flex items-center justify-center text-muted-foreground',
          className
        )}
        style={{ 
          width: fill ? '100%' : width, 
          height: fill ? '100%' : height,
          aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
          ...style 
        }}
      >
        <span className="text-sm">Failed to load image</span>
      </div>
    )
  }

  const imageProps = {
    src: optimizedSrc,
    alt,
    className: cn(
      'transition-opacity duration-300',
      isLoaded ? 'opacity-100' : 'opacity-0',
      className
    ),
    onLoad: handleLoad,
    onError: handleError,
    quality,
    priority: priority || eager,
    placeholder: placeholder,
    blurDataURL: generatedBlurDataURL,
    sizes: responsiveSizes,
    style: {
      aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
      ...style
    },
    ...props
  }

  if (fill) {
    return <Image {...imageProps} fill />
  }

  if (width && height) {
    return <Image {...imageProps} width={width} height={height} />
  }

  // For responsive images without fixed dimensions
  return (
    <div 
      className="relative"
      style={{ 
        aspectRatio: aspectRatio ? `${aspectRatio}` : '16/9'
      }}
    >
      <Image {...imageProps} fill />
    </div>
  )
}

// Lazy loaded image with intersection observer
interface LazyImageProps extends OptimizedImageProps {
  rootMargin?: string
  threshold?: number
  triggerOnce?: boolean
}

export function LazyImage({
  rootMargin = '50px',
  threshold = 0.1,
  triggerOnce = true,
  ...imageProps
}: LazyImageProps) {
  const [shouldLoad, setShouldLoad] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          if (triggerOnce) {
            observer.disconnect()
          }
        }
      },
      {
        rootMargin,
        threshold
      }
    )

    const currentRef = imgRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [rootMargin, threshold, triggerOnce])

  return (
    <div ref={imgRef}>
      {shouldLoad ? (
        <OptimizedImage {...imageProps} />
      ) : (
        <div 
          className={cn(
            'bg-muted animate-pulse',
            imageProps.className
          )}
          style={{ 
            width: imageProps.fill ? '100%' : imageProps.width, 
            height: imageProps.fill ? '100%' : imageProps.height,
            aspectRatio: imageProps.aspectRatio ? `${imageProps.aspectRatio}` : undefined
          }}
        />
      )}
    </div>
  )
}

// Image gallery with progressive loading
interface ImageGalleryProps {
  images: Array<{
    src: string
    alt: string
    width?: number
    height?: number
    priority?: boolean
  }>
  columns?: number
  gap?: number
  className?: string
  itemClassName?: string
  loadingStrategy?: 'eager' | 'lazy' | 'progressive'
}

export function ImageGallery({
  images,
  columns = 3,
  gap = 16,
  className,
  itemClassName,
  loadingStrategy = 'progressive'
}: ImageGalleryProps) {
  const [loadedCount, setLoadedCount] = useState(0)
  const [visibleCount, setVisibleCount] = useState(
    loadingStrategy === 'progressive' ? Math.min(6, images.length) : images.length
  )

  useEffect(() => {
    if (loadingStrategy === 'progressive' && loadedCount >= visibleCount * 0.7) {
      setVisibleCount(prev => Math.min(prev + 6, images.length))
    }
  }, [loadedCount, visibleCount, images.length, loadingStrategy])

  const handleImageLoad = () => {
    setLoadedCount(prev => prev + 1)
  }

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap}px`
  }

  const visibleImages = images.slice(0, visibleCount)

  return (
    <div className={className} style={gridStyle}>
      {visibleImages.map((image, index) => {
        const isEager = loadingStrategy === 'eager' || 
                       (loadingStrategy === 'progressive' && index < 3)
        
        return (
          <div key={index} className={itemClassName}>
            {loadingStrategy === 'lazy' ? (
              <LazyImage
                {...image}
                onLoad={handleImageLoad}
                priority={isEager}
                responsive
              />
            ) : (
              <OptimizedImage
                {...image}
                onLoad={handleImageLoad}
                priority={isEager}
                eager={isEager}
                responsive
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Adaptive image based on viewport and connection
interface AdaptiveImageProps extends OptimizedImageProps {
  srcSet?: {
    mobile: string
    tablet: string
    desktop: string
  }
  qualitySet?: {
    slow: number
    fast: number
  }
}

export function AdaptiveImage({
  srcSet,
  qualitySet = { slow: 50, fast: 85 },
  ...imageProps
}: AdaptiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(imageProps.src)
  const [currentQuality, setCurrentQuality] = useState(imageProps.quality || 75)

  useEffect(() => {
    const updateAdaptiveSettings = () => {
      // Check viewport size
      const isMobile = window.innerWidth <= 640
      const isTablet = window.innerWidth <= 1024 && window.innerWidth > 640
      
      // Check connection speed
      const connection = (navigator as any).connection
      const isSlowConnection = connection && 
        (['slow-2g', '2g'].includes(connection.effectiveType) || connection.saveData)

      // Update source based on viewport
      if (srcSet) {
        if (isMobile && srcSet.mobile) {
          setCurrentSrc(srcSet.mobile)
        } else if (isTablet && srcSet.tablet) {
          setCurrentSrc(srcSet.tablet)
        } else if (srcSet.desktop) {
          setCurrentSrc(srcSet.desktop)
        }
      }

      // Update quality based on connection
      setCurrentQuality(isSlowConnection ? qualitySet.slow : qualitySet.fast)
    }

    updateAdaptiveSettings()
    
    window.addEventListener('resize', updateAdaptiveSettings)
    
    // Listen for connection changes
    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener('change', updateAdaptiveSettings)
    }

    return () => {
      window.removeEventListener('resize', updateAdaptiveSettings)
      if (connection) {
        connection.removeEventListener('change', updateAdaptiveSettings)
      }
    }
  }, [srcSet, qualitySet])

  return (
    <OptimizedImage
      {...imageProps}
      src={currentSrc}
      quality={currentQuality}
    />
  )
}

// Progressive JPEG/WebP loader
interface ProgressiveImageProps extends OptimizedImageProps {
  lowQualitySrc?: string
  highQualitySrc?: string
}

export function ProgressiveImage({
  lowQualitySrc,
  highQualitySrc,
  ...imageProps
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc || imageProps.src)
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false)

  useEffect(() => {
    if (highQualitySrc) {
      const img = new window.Image()
      img.onload = () => {
        setCurrentSrc(highQualitySrc)
        setIsHighQualityLoaded(true)
      }
      img.src = highQualitySrc
    }
  }, [highQualitySrc])

  return (
    <OptimizedImage
      {...imageProps}
      src={currentSrc}
      className={cn(
        'transition-all duration-500',
        !isHighQualityLoaded && lowQualitySrc && 'filter blur-sm',
        imageProps.className
      )}
    />
  )
}

// Hook for image optimization settings
export function useImageOptimization() {
  const [settings, setSettings] = useState({
    quality: 75,
    format: 'auto' as 'auto' | 'webp' | 'jpg' | 'png',
    progressive: true,
    lazyLoading: true
  })

  useEffect(() => {
    // Check device capabilities and connection
    const connection = (navigator as any).connection
    const isSlowConnection = connection && 
      (['slow-2g', '2g'].includes(connection.effectiveType) || connection.saveData)
    
    // Check device memory
    const deviceMemory = (navigator as any).deviceMemory || 4
    const isLowEndDevice = deviceMemory < 4

    // Adjust settings based on capabilities
    if (isSlowConnection || isLowEndDevice) {
      setSettings(prev => ({
        ...prev,
        quality: 60,
        progressive: false
      }))
    }
  }, [])

  return settings
}