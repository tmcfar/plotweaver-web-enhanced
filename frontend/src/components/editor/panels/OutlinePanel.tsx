'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Plus, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OutlineItem {
  id: string
  title: string
  type: 'chapter' | 'scene' | 'section'
  children?: OutlineItem[]
  wordCount?: number
  status?: 'draft' | 'complete' | 'revision'
}

interface OutlinePanelProps {
  items?: OutlineItem[]
  onItemClick?: (item: OutlineItem) => void
  onAddItem?: (parentId?: string) => void
  className?: string
}

export default function OutlinePanel({
  items = [],
  onItemClick,
  onAddItem,
  className
}: OutlinePanelProps) {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set())

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const renderOutlineItem = (item: OutlineItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)

    return (
      <div key={item.id} className="w-full">
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 hover:bg-accent cursor-pointer rounded-md",
            "transition-colors",
            level > 0 && "ml-4"
          )}
          onClick={() => onItemClick?.(item)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(item.id)
              }}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}
          
          <div className="flex-1 flex items-center justify-between">
            <span className={cn(
              "text-sm",
              item.type === 'chapter' && "font-semibold",
              item.type === 'scene' && "text-muted-foreground"
            )}>
              {item.title}
            </span>
            
            {item.wordCount !== undefined && (
              <span className="text-xs text-muted-foreground">
                {item.wordCount.toLocaleString()} words
              </span>
            )}
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children!.map(child => renderOutlineItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Outline</CardTitle>
            <CardDescription className="text-xs">
              Story structure overview
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAddItem?.()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-4 pb-4">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No outline items yet.
              <br />
              Click the + button to add chapters and scenes.
            </div>
          ) : (
            <div className="space-y-1">
              {items.map(item => renderOutlineItem(item))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
