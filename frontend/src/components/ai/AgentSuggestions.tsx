'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Lightbulb, 
  X, 
  Check, 
  ArrowRight, 
  Sparkles, 
  RefreshCw,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Suggestion {
  id: string
  type: 'completion' | 'improvement' | 'alternative' | 'expansion'
  content: string
  context: string
  confidence: number
  agent: string
}

interface AgentSuggestionsProps {
  selectedText?: string
  cursorPosition?: number
  context?: string
  onApplySuggestion?: (suggestion: Suggestion) => void
  onDismissSuggestion?: (suggestionId: string) => void
  className?: string
}

const suggestionTypes = {
  completion: { icon: ArrowRight, label: 'Continue', color: 'text-blue-500' },
  improvement: { icon: Sparkles, label: 'Improve', color: 'text-purple-500' },
  alternative: { icon: RefreshCw, label: 'Alternative', color: 'text-green-500' },
  expansion: { icon: ChevronUp, label: 'Expand', color: 'text-orange-500' }
}

// Mock suggestions - these would come from AI in real implementation
const mockSuggestions: Suggestion[] = [
  {
    id: '1',
    type: 'completion',
    content: 'The rain had stopped, but the cobblestones still glistened under the streetlights, creating a mirror-like surface that reflected the uncertainty in Sarah\'s heart.',
    context: 'after "Sarah stepped out into the night"',
    confidence: 0.85,
    agent: 'claude'
  },
  {
    id: '2',
    type: 'improvement',
    content: 'The mysterious woman\'s piercing blue eyes seemed to hold secrets that stretched back generations, as if she had witnessed the town\'s history unfold.',
    context: 'replacing "The woman had blue eyes"',
    confidence: 0.92,
    agent: 'gpt-4'
  },
  {
    id: '3',
    type: 'alternative',
    content: '"I\'ve been expecting you," Margaret said softly, her voice carrying the weight of years.',
    context: 'instead of "Hello, Sarah"',
    confidence: 0.78,
    agent: 'claude'
  }
]

export function AgentSuggestions({ 
  selectedText, 
  cursorPosition, 
  context, 
  onApplySuggestion, 
  onDismissSuggestion,
  className 
}: AgentSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Simulate fetching suggestions based on context
  useEffect(() => {
    if (selectedText || cursorPosition !== undefined) {
      setIsLoading(true)
      // Simulate API delay
      const timer = setTimeout(() => {
        setSuggestions(mockSuggestions)
        setIsVisible(true)
        setIsLoading(false)
      }, 800)

      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
      setSuggestions([])
    }
  }, [selectedText, cursorPosition, context])

  const handleApplySuggestion = (suggestion: Suggestion) => {
    onApplySuggestion?.(suggestion)
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
    if (suggestions.length === 1) {
      setIsVisible(false)
    }
  }

  const handleDismissSuggestion = (suggestionId: string) => {
    onDismissSuggestion?.(suggestionId)
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
    if (suggestions.length === 1) {
      setIsVisible(false)
    }
  }

  const handleDismissAll = () => {
    setIsVisible(false)
    setSuggestions([])
  }

  const toggleExpanded = (suggestionId: string) => {
    setExpandedSuggestion(prev => prev === suggestionId ? null : suggestionId)
  }

  if (!isVisible && !isLoading) return null

  return (
    <div 
      ref={containerRef}
      className={cn(
        'fixed z-50 max-w-md',
        'animate-in slide-in-from-bottom-2 duration-200',
        className
      )}
      style={{ 
        bottom: '20px', 
        right: '20px',
        maxHeight: '60vh',
        overflowY: 'auto'
      }}
    >
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">AI Suggestions</span>
              {isLoading && (
                <div className="animate-spin">
                  <RefreshCw className="h-3 w-3" />
                </div>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={handleDismissAll}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion) => {
                const TypeIcon = suggestionTypes[suggestion.type].icon
                const isExpanded = expandedSuggestion === suggestion.id
                const previewLength = 80

                return (
                  <div 
                    key={suggestion.id}
                    className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <TypeIcon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', suggestionTypes[suggestion.type].color)} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {suggestionTypes[suggestion.type].label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(suggestion.confidence * 100)}% confidence
                          </span>
                        </div>
                        
                        <div className="text-sm mb-2">
                          {isExpanded || suggestion.content.length <= previewLength 
                            ? suggestion.content 
                            : `${suggestion.content.slice(0, previewLength)}...`
                          }
                          
                          {suggestion.content.length > previewLength && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 ml-1 text-xs"
                              onClick={() => toggleExpanded(suggestion.id)}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-3 w-3 mr-1" />
                                  Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                  More
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        
                        <div className="text-xs text-muted-foreground mb-2">
                          {suggestion.context}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApplySuggestion(suggestion)}
                            className="h-7 text-xs"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Apply
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDismissSuggestion(suggestion.id)}
                            className="h-7 text-xs"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Dismiss
                          </Button>
                          
                          <div className="ml-auto">
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.agent}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {suggestions.length > 1 && (
                <div className="pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDismissAll}
                    className="w-full text-xs"
                  >
                    Dismiss All
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Hook for managing suggestions
export function useAISuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isEnabled, setIsEnabled] = useState(true)

  const requestSuggestions = async (context: {
    selectedText?: string
    cursorPosition?: number
    context?: string
    projectId: string
  }) => {
    if (!isEnabled) return

    try {
      // This would call your AI API
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context)
      })
      
      if (response.ok) {
        const newSuggestions = await response.json()
        setSuggestions(newSuggestions)
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    }
  }

  const applySuggestion = (suggestion: Suggestion) => {
    // This would apply the suggestion to the editor
    console.log('Applying suggestion:', suggestion)
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
  }

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
  }

  const clearSuggestions = () => {
    setSuggestions([])
  }

  return {
    suggestions,
    isEnabled,
    setIsEnabled,
    requestSuggestions,
    applySuggestion,
    dismissSuggestion,
    clearSuggestions
  }
}