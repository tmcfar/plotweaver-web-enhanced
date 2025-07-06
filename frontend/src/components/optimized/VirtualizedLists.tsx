'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface VirtualizedListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  onScroll?: (scrollTop: number) => void
  className?: string
  getItemKey?: (item: T, index: number) => string | number
  estimatedItemHeight?: number
  onEndReached?: () => void
  endReachedThreshold?: number
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  onScroll,
  className,
  getItemKey,
  onEndReached,
  endReachedThreshold = 0.8
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  const totalHeight = items.length * itemHeight
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      key: getItemKey ? getItemKey(item, startIndex + index) : startIndex + index
    }))
  }, [items, startIndex, endIndex, getItemKey])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    setScrollTop(scrollTop)
    onScroll?.(scrollTop)

    // Check if we've reached the end for infinite loading
    if (onEndReached) {
      const { scrollHeight, clientHeight } = e.currentTarget
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight
      
      if (scrollPercentage >= endReachedThreshold) {
        onEndReached()
      }
    }
  }, [onScroll, onEndReached, endReachedThreshold])

  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map(({ item, index, key }) => (
            <div
              key={key}
              style={{
                height: itemHeight,
                overflow: 'hidden'
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Variable height virtualized list for more complex use cases
interface VariableHeightVirtualizedListProps<T> {
  items: T[]
  estimatedItemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  getItemHeight?: (item: T, index: number) => number
  overscan?: number
  onScroll?: (scrollTop: number) => void
  className?: string
  getItemKey?: (item: T, index: number) => string | number
  onEndReached?: () => void
  endReachedThreshold?: number
}

export function VariableHeightVirtualizedList<T>({
  items,
  estimatedItemHeight,
  containerHeight,
  renderItem,
  getItemHeight,
  overscan = 5,
  onScroll,
  className,
  getItemKey,
  onEndReached,
  endReachedThreshold = 0.8
}: VariableHeightVirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const [itemHeights, setItemHeights] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollElementRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // Calculate cumulative heights for efficient positioning
  const cumulativeHeights = useMemo(() => {
    const heights = [0]
    for (let i = 0; i < items.length; i++) {
      const height = itemHeights[i] || getItemHeight?.(items[i], i) || estimatedItemHeight
      heights.push(heights[heights.length - 1] + height)
    }
    return heights
  }, [items, itemHeights, getItemHeight, estimatedItemHeight])

  const totalHeight = cumulativeHeights[cumulativeHeights.length - 1]

  // Binary search to find the start index based on scroll position
  const findStartIndex = useCallback((scrollTop: number) => {
    let left = 0
    let right = cumulativeHeights.length - 1
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      if (cumulativeHeights[mid] < scrollTop) {
        left = mid + 1
      } else {
        right = mid
      }
    }
    
    return Math.max(0, left - 1 - overscan)
  }, [cumulativeHeights, overscan])

  // Find end index
  const findEndIndex = useCallback((scrollTop: number, containerHeight: number) => {
    const targetScrollBottom = scrollTop + containerHeight
    let left = 0
    let right = cumulativeHeights.length - 1
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      if (cumulativeHeights[mid] < targetScrollBottom) {
        left = mid + 1
      } else {
        right = mid
      }
    }
    
    return Math.min(items.length - 1, left + overscan)
  }, [cumulativeHeights, items.length, overscan])

  const startIndex = findStartIndex(scrollTop)
  const endIndex = findEndIndex(scrollTop, containerHeight)

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      key: getItemKey ? getItemKey(item, startIndex + index) : startIndex + index,
      top: cumulativeHeights[startIndex + index],
      height: itemHeights[startIndex + index] || 
              getItemHeight?.(item, startIndex + index) || 
              estimatedItemHeight
    }))
  }, [items, startIndex, endIndex, getItemKey, cumulativeHeights, itemHeights, getItemHeight, estimatedItemHeight])

  // Measure item heights when they're rendered
  const measureItem = useCallback((index: number, element: HTMLDivElement | null) => {
    if (!element) return

    const height = element.getBoundingClientRect().height
    setItemHeights(prev => {
      const newHeights = [...prev]
      newHeights[index] = height
      return newHeights
    })
  }, [])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    setScrollTop(scrollTop)
    onScroll?.(scrollTop)

    // Check for end reached
    if (onEndReached && !isLoading) {
      const { scrollHeight, clientHeight } = e.currentTarget
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight
      
      if (scrollPercentage >= endReachedThreshold) {
        setIsLoading(true)
        onEndReached()
        setTimeout(() => setIsLoading(false), 1000) // Prevent rapid calls
      }
    }
  }, [onScroll, onEndReached, endReachedThreshold, isLoading])

  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, key, top, height }) => (
          <div
            key={key}
            ref={(el) => {
              if (el) {
                itemRefs.current.set(index, el)
                measureItem(index, el)
              } else {
                itemRefs.current.delete(index)
              }
            }}
            style={{
              position: 'absolute',
              top,
              left: 0,
              right: 0,
              minHeight: height
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

// Grid virtualization for 2D layouts
interface VirtualizedGridProps<T> {
  items: T[]
  itemWidth: number
  itemHeight: number
  containerWidth: number
  containerHeight: number
  columnsCount: number
  renderItem: (item: T, index: number) => React.ReactNode
  gap?: number
  overscan?: number
  onScroll?: (scrollTop: number) => void
  className?: string
  getItemKey?: (item: T, index: number) => string | number
  onEndReached?: () => void
}

export function VirtualizedGrid<T>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  columnsCount,
  renderItem,
  gap = 0,
  overscan = 5,
  onScroll,
  className,
  getItemKey,
  onEndReached
}: VirtualizedGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)

  const rowsCount = Math.ceil(items.length / columnsCount)
  const rowHeight = itemHeight + gap
  const totalHeight = rowsCount * rowHeight

  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const endRow = Math.min(
    rowsCount - 1,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
  )

  const visibleItems = useMemo(() => {
    const visible = []
    
    for (let row = startRow; row <= endRow; row++) {
      for (let col = 0; col < columnsCount; col++) {
        const index = row * columnsCount + col
        if (index < items.length) {
          const item = items[index]
          visible.push({
            item,
            index,
            key: getItemKey ? getItemKey(item, index) : index,
            row,
            col,
            top: row * rowHeight,
            left: col * (itemWidth + gap)
          })
        }
      }
    }
    
    return visible
  }, [items, startRow, endRow, columnsCount, rowHeight, itemWidth, gap, getItemKey])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    setScrollTop(scrollTop)
    onScroll?.(scrollTop)

    // Check for end reached
    if (onEndReached) {
      const { scrollHeight, clientHeight } = e.currentTarget
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight
      
      if (scrollPercentage >= 0.8) {
        onEndReached()
      }
    }
  }, [onScroll, onEndReached])

  return (
    <div
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight, width: containerWidth }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, key, top, left }) => (
          <div
            key={key}
            style={{
              position: 'absolute',
              top,
              left,
              width: itemWidth,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

// Hook for managing virtualized list state
export function useVirtualizedList<T>(
  items: T[],
  options: {
    itemHeight?: number
    containerHeight?: number
    overscan?: number
    estimatedItemHeight?: number
  } = {}
) {
  const {
    itemHeight = 50,
    containerHeight = 400,
    overscan = 5,
    estimatedItemHeight = 50
  } = options

  const [scrollTop, setScrollTop] = useState(0)
  const [isAtEnd, setIsAtEnd] = useState(false)

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1)
  }, [items, startIndex, endIndex])

  const handleScroll = useCallback((scrollTop: number) => {
    setScrollTop(scrollTop)
    
    const totalHeight = items.length * itemHeight
    const atEnd = scrollTop + containerHeight >= totalHeight * 0.9
    setIsAtEnd(atEnd)
  }, [items.length, itemHeight, containerHeight])

  return {
    visibleItems,
    startIndex,
    endIndex,
    scrollTop,
    isAtEnd,
    handleScroll,
    totalHeight: items.length * itemHeight
  }
}