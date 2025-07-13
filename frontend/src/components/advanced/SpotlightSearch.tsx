'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Search, 
  FileText, 
  User, 
  Hash, 
  Calendar, 
  MapPin,
  Quote,
  Sparkles,
  Clock,
  Filter,
  X,
  ArrowRight,
  Bot
} from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface SpotlightSearchProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

type SearchResultType = 
  | 'scene' 
  | 'character' 
  | 'location' 
  | 'note' 
  | 'dialogue'
  | 'chapter'
  | 'project'

interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  content: string
  project?: string
  chapter?: string
  scene?: string
  lastModified: string
  relevanceScore: number
  highlights?: string[]
  metadata?: Record<string, any>
}

interface SearchFilter {
  type?: SearchResultType
  project?: string
  dateRange?: 'today' | 'week' | 'month' | 'all'
  hasAI?: boolean
}

// Mock search results - would come from search API
const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    type: 'scene',
    title: 'The Dark Forest Encounter',
    content: 'Sarah stumbled through the undergrowth, her heart pounding as shadows danced between the ancient trees. The forest seemed to whisper secrets...',
    project: 'The Secrets of Elderbrook',
    chapter: 'Chapter 3: Into the Unknown',
    scene: 'Scene 2',
    lastModified: '2024-01-15T14:30:00Z',
    relevanceScore: 0.95,
    highlights: ['forest', 'shadows', 'whisper']
  },
  {
    id: '2',
    type: 'character',
    title: 'Margaret Thornfield',
    content: 'Elderly librarian with deep knowledge of the town\'s history. She harbors a secret about the Elderbrook family curse and serves as Sarah\'s reluctant guide.',
    project: 'The Secrets of Elderbrook',
    lastModified: '2024-01-14T09:15:00Z',
    relevanceScore: 0.88,
    highlights: ['librarian', 'secret', 'guide']
  },
  {
    id: '3',
    type: 'dialogue',
    title: 'Sarah and Margaret\'s First Meeting',
    content: '"I\'ve been expecting you," Margaret said softly, not looking up from her ancient tome. "The signs have been clear for weeks now."',
    project: 'The Secrets of Elderbrook',
    chapter: 'Chapter 2: The Library',
    scene: 'Scene 1',
    lastModified: '2024-01-13T16:45:00Z',
    relevanceScore: 0.82,
    highlights: ['expecting', 'signs', 'weeks']
  },
  {
    id: '4',
    type: 'location',
    title: 'The Elderbrook Public Library',
    content: 'A Victorian-era building with towering bookshelves and hidden passages. The basement contains restricted archives about the town\'s supernatural history.',
    project: 'The Secrets of Elderbrook',
    lastModified: '2024-01-12T11:20:00Z',
    relevanceScore: 0.79,
    highlights: ['Victorian', 'archives', 'supernatural']
  },
  {
    id: '5',
    type: 'note',
    title: 'Plot Thread: The Family Curse',
    content: 'Research notes on the Elderbrook family curse. Key elements: generational pattern, connection to the forest, role of the library as sanctuary.',
    project: 'The Secrets of Elderbrook',
    lastModified: '2024-01-11T08:30:00Z',
    relevanceScore: 0.75,
    highlights: ['curse', 'generational', 'sanctuary']
  },
  {
    id: '6',
    type: 'chapter',
    title: 'Chapter 1: Arrival',
    content: 'Sarah arrives in Elderbrook to settle her grandmother\'s estate. First hints of something supernatural in the town.',
    project: 'The Secrets of Elderbrook',
    lastModified: '2024-01-10T14:00:00Z',
    relevanceScore: 0.71,
    highlights: ['arrival', 'estate', 'supernatural']
  }
]

const resultTypeConfig: Record<SearchResultType, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}> = {
  scene: { 
    label: 'Scene', 
    icon: FileText, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100' 
  },
  character: { 
    label: 'Character', 
    icon: User, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100' 
  },
  location: { 
    label: 'Location', 
    icon: MapPin, 
    color: 'text-red-600', 
    bgColor: 'bg-red-100' 
  },
  dialogue: { 
    label: 'Dialogue', 
    icon: Quote, 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-100' 
  },
  note: { 
    label: 'Note', 
    icon: Hash, 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-100' 
  },
  chapter: { 
    label: 'Chapter', 
    icon: FileText, 
    color: 'text-indigo-600', 
    bgColor: 'bg-indigo-100' 
  },
  project: { 
    label: 'Project', 
    icon: FileText, 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100' 
  }
}

export function SpotlightSearch({ isOpen, onClose, className }: SpotlightSearchProps) {
  const [query, setQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState('all')
  const [filters, setFilters] = useState<SearchFilter>({})
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isAISearch, setIsAISearch] = useState(false)

  // Filter and search results
  const filteredResults = useMemo(() => {
    let results = mockSearchResults

    // Apply text search
    if (query.trim()) {
      const searchTerms = query.toLowerCase().split(' ')
      results = results.filter(result => {
        const searchableText = [
          result.title,
          result.content,
          result.project || '',
          result.chapter || '',
          result.scene || ''
        ].join(' ').toLowerCase()

        return searchTerms.every(term => searchableText.includes(term))
      })
    }

    // Apply type filter
    if (selectedTab !== 'all') {
      results = results.filter(result => result.type === selectedTab)
    }

    // Apply additional filters
    if (filters.project) {
      results = results.filter(result => result.project === filters.project)
    }

    // Sort by relevance score
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }, [query, selectedTab, filters])

  // Group results by type for "all" tab
  const groupedResults = useMemo(() => {
    if (selectedTab !== 'all') return { [selectedTab]: filteredResults }

    const groups: Record<string, SearchResult[]> = {}
    filteredResults.forEach(result => {
      if (!groups[result.type]) {
        groups[result.type] = []
      }
      groups[result.type].push(result)
    })

    return groups
  }, [filteredResults, selectedTab])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredResults])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredResults.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredResults.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (filteredResults[selectedIndex]) {
            handleResultSelect(filteredResults[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          handleClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, filteredResults, selectedIndex]) // handleClose and handleResultSelect are defined below

  const handleClose = () => {
    setQuery('')
    setSelectedIndex(0)
    setFilters({})
    setIsAISearch(false)
    onClose()
  }

  const handleResultSelect = (result: SearchResult) => {
    console.log('Selected result:', result)
    // Navigate to the selected result
    handleClose()
  }

  const handleAISearch = async () => {
    setIsAISearch(true)
    
    // Simulate AI search
    setTimeout(() => {
      setIsAISearch(false)
      // Would process AI search results here
    }, 2000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const highlightText = (text: string, highlights?: string[]) => {
    if (!highlights || highlights.length === 0) return text

    let highlightedText = text
    highlights.forEach(highlight => {
      const regex = new RegExp(`(${highlight})`, 'gi')
      highlightedText = highlightedText.replace(
        regex, 
        '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>'
      )
    })

    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn(
        'max-w-4xl max-h-[80vh] flex flex-col p-0',
        className
      )}>
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Everything
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search scenes, characters, locations, notes..."
              className="pl-10 pr-20"
              autoFocus
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAISearch}
                  disabled={isAISearch}
                  className="h-7 px-2 text-xs"
                >
                  {isAISearch ? (
                    <>
                      <Sparkles className="h-3 w-3 mr-1 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Bot className="h-3 w-3 mr-1" />
                      AI Search
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mt-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filters:</span>
            
            {Object.entries(filters).map(([key, value]) => (
              <Badge 
                key={key} 
                variant="secondary" 
                className="text-xs flex items-center gap-1"
              >
                {key}: {value}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setFilters(prev => ({ ...prev, [key]: undefined }))}
                />
              </Badge>
            ))}
            
            {Object.keys(filters).length === 0 && (
              <span className="text-xs text-muted-foreground">None</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all" className="text-xs">
                All ({filteredResults.length})
              </TabsTrigger>
              {Object.entries(resultTypeConfig).map(([type, config]) => {
                const count = mockSearchResults.filter(r => r.type === type).length
                return (
                  <TabsTrigger key={type} value={type} className="text-xs">
                    {config.label} ({count})
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-hidden px-6 pb-6">
          {filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {query ? `No results for "${query}"` : 'Start typing to search'}
              </p>
              {query && (
                <Button variant="outline" onClick={handleAISearch} disabled={isAISearch}>
                  <Bot className="h-4 w-4 mr-2" />
                  Try AI Search
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-6">
                {Object.entries(groupedResults).map(([type, results]) => {
                  const config = resultTypeConfig[type as SearchResultType]
                  if (!config || results.length === 0) return null

                  const Icon = config.icon

                  return (
                    <div key={type}>
                      {selectedTab === 'all' && (
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className={cn('h-4 w-4', config.color)} />
                          <h3 className="font-medium text-sm">
                            {config.label}s ({results.length})
                          </h3>
                        </div>
                      )}

                      <div className="space-y-2">
                        {results.map((result, index) => {
                          const globalIndex = filteredResults.indexOf(result)
                          const isSelected = globalIndex === selectedIndex
                          const ResultIcon = resultTypeConfig[result.type].icon

                          return (
                            <div
                              key={result.id}
                              className={cn(
                                'border rounded-lg p-4 cursor-pointer transition-all',
                                isSelected 
                                  ? 'border-primary bg-accent' 
                                  : 'hover:border-muted-foreground/30 hover:bg-muted/50'
                              )}
                              onClick={() => handleResultSelect(result)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    'w-6 h-6 rounded flex items-center justify-center',
                                    resultTypeConfig[result.type].bgColor
                                  )}>
                                    <ResultIcon className={cn(
                                      'h-3 w-3',
                                      resultTypeConfig[result.type].color
                                    )} />
                                  </div>
                                  <h4 className="font-medium text-sm">
                                    {highlightText(result.title, result.highlights)}
                                  </h4>
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(result.relevanceScore * 100)}% match
                                  </Badge>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              </div>

                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {highlightText(result.content, result.highlights)}
                              </p>

                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-3">
                                  {result.project && (
                                    <span>{result.project}</span>
                                  )}
                                  {result.chapter && (
                                    <span>{result.chapter}</span>
                                  )}
                                  {result.scene && (
                                    <span>{result.scene}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(result.lastModified)}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
              </span>
              {query && (
                <span>for "{query}"</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded border">↑↓</kbd>
              <span>navigate</span>
              <kbd className="px-1.5 py-0.5 rounded border">↵</kbd>
              <span>select</span>
              <kbd className="px-1.5 py-0.5 rounded border">esc</kbd>
              <span>close</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook to manage spotlight search
export function useSpotlightSearch() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev)
  }
}