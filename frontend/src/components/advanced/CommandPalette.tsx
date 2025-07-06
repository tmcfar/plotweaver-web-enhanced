'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Search, 
  Command, 
  ArrowRight, 
  FileText, 
  FolderOpen, 
  Settings, 
  User, 
  Bot, 
  Sparkles, 
  GitBranch,
  Download,
  Plus,
  Edit,
  Trash2,
  Copy,
  Clock,
  Bookmark,
  Hash,
  Zap
} from 'lucide-react'
import { 
  Dialog, 
  DialogContent 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  category: string
  shortcut?: string
  action: () => void
  keywords?: string[]
}

interface CommandCategory {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const categories: CommandCategory[] = [
  { id: 'general', label: 'General', icon: Command, color: 'text-gray-500' },
  { id: 'files', label: 'Files', icon: FileText, color: 'text-blue-500' },
  { id: 'projects', label: 'Projects', icon: FolderOpen, color: 'text-green-500' },
  { id: 'ai', label: 'AI', icon: Bot, color: 'text-purple-500' },
  { id: 'git', label: 'Git', icon: GitBranch, color: 'text-orange-500' },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-600' }
]

// Mock commands - would be populated from app state
const createCommands = (): Command[] => [
  // General Commands
  {
    id: 'search-global',
    label: 'Search Everything',
    description: 'Search across all projects and files',
    icon: Search,
    category: 'general',
    shortcut: 'Ctrl+Shift+F',
    action: () => console.log('Global search'),
    keywords: ['search', 'find', 'global']
  },
  {
    id: 'quick-actions',
    label: 'Quick Actions',
    description: 'Show quick action menu',
    icon: Zap,
    category: 'general',
    shortcut: 'Ctrl+Shift+A',
    action: () => console.log('Quick actions'),
    keywords: ['quick', 'actions', 'menu']
  },

  // File Commands
  {
    id: 'new-scene',
    label: 'New Scene',
    description: 'Create a new scene in current chapter',
    icon: Plus,
    category: 'files',
    shortcut: 'Ctrl+N',
    action: () => console.log('New scene'),
    keywords: ['new', 'scene', 'create']
  },
  {
    id: 'new-chapter',
    label: 'New Chapter',
    description: 'Create a new chapter',
    icon: Plus,
    category: 'files',
    shortcut: 'Ctrl+Shift+N',
    action: () => console.log('New chapter'),
    keywords: ['new', 'chapter', 'create']
  },
  {
    id: 'save-scene',
    label: 'Save Current Scene',
    description: 'Save the current scene',
    icon: FileText,
    category: 'files',
    shortcut: 'Ctrl+S',
    action: () => console.log('Save scene'),
    keywords: ['save', 'scene', 'current']
  },
  {
    id: 'export-project',
    label: 'Export Project',
    description: 'Export project to various formats',
    icon: Download,
    category: 'files',
    action: () => console.log('Export project'),
    keywords: ['export', 'download', 'pdf', 'epub', 'word']
  },

  // Project Commands
  {
    id: 'switch-project',
    label: 'Switch Project',
    description: 'Switch to a different project',
    icon: FolderOpen,
    category: 'projects',
    shortcut: 'Ctrl+Shift+P',
    action: () => console.log('Switch project'),
    keywords: ['switch', 'project', 'change']
  },
  {
    id: 'project-settings',
    label: 'Project Settings',
    description: 'Configure current project settings',
    icon: Settings,
    category: 'projects',
    action: () => console.log('Project settings'),
    keywords: ['project', 'settings', 'config']
  },
  {
    id: 'recent-files',
    label: 'Recent Files',
    description: 'Show recently opened files',
    icon: Clock,
    category: 'projects',
    shortcut: 'Ctrl+R',
    action: () => console.log('Recent files'),
    keywords: ['recent', 'files', 'history']
  },

  // AI Commands
  {
    id: 'ai-generate',
    label: 'Generate Content',
    description: 'Generate new content with AI',
    icon: Sparkles,
    category: 'ai',
    shortcut: 'Ctrl+G',
    action: () => console.log('AI generate'),
    keywords: ['ai', 'generate', 'content', 'write']
  },
  {
    id: 'ai-improve',
    label: 'Improve Selection',
    description: 'Improve selected text with AI',
    icon: Bot,
    category: 'ai',
    shortcut: 'Ctrl+I',
    action: () => console.log('AI improve'),
    keywords: ['ai', 'improve', 'enhance', 'rewrite']
  },
  {
    id: 'ai-suggestions',
    label: 'Get AI Suggestions',
    description: 'Get AI suggestions for current scene',
    icon: Bot,
    category: 'ai',
    action: () => console.log('AI suggestions'),
    keywords: ['ai', 'suggestions', 'ideas', 'help']
  },

  // Git Commands
  {
    id: 'git-commit',
    label: 'Commit Changes',
    description: 'Commit current changes to git',
    icon: GitBranch,
    category: 'git',
    shortcut: 'Ctrl+Shift+C',
    action: () => console.log('Git commit'),
    keywords: ['git', 'commit', 'save', 'version']
  },
  {
    id: 'git-history',
    label: 'View History',
    description: 'View git commit history',
    icon: Clock,
    category: 'git',
    action: () => console.log('Git history'),
    keywords: ['git', 'history', 'commits', 'log']
  },
  {
    id: 'git-branch',
    label: 'Create Branch',
    description: 'Create a new git branch',
    icon: GitBranch,
    category: 'git',
    action: () => console.log('Git branch'),
    keywords: ['git', 'branch', 'new', 'create']
  },

  // Settings
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Open application preferences',
    icon: Settings,
    category: 'settings',
    shortcut: 'Ctrl+,',
    action: () => console.log('Preferences'),
    keywords: ['preferences', 'settings', 'config']
  },
  {
    id: 'theme-toggle',
    label: 'Toggle Theme',
    description: 'Switch between light and dark theme',
    icon: Settings,
    category: 'settings',
    action: () => console.log('Toggle theme'),
    keywords: ['theme', 'dark', 'light', 'toggle']
  },
  {
    id: 'keyboard-shortcuts',
    label: 'Keyboard Shortcuts',
    description: 'View all keyboard shortcuts',
    icon: Command,
    category: 'settings',
    shortcut: 'Ctrl+?',
    action: () => console.log('Keyboard shortcuts'),
    keywords: ['keyboard', 'shortcuts', 'hotkeys', 'help']
  }
]

export function CommandPalette({ isOpen, onClose, className }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const commands = useMemo(() => createCommands(), [])

  // Filter commands based on search query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands

    const searchTerms = query.toLowerCase().split(' ')
    
    return commands.filter(command => {
      const searchableText = [
        command.label,
        command.description || '',
        command.category,
        ...(command.keywords || [])
      ].join(' ').toLowerCase()

      return searchTerms.every(term => searchableText.includes(term))
    })
  }, [commands, query])

  // Group filtered commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {}
    
    filteredCommands.forEach(command => {
      if (!groups[command.category]) {
        groups[command.category] = []
      }
      groups[command.category].push(command)
    })

    return groups
  }, [filteredCommands])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredCommands])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action()
            handleClose()
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
  }, [isOpen, filteredCommands, selectedIndex])

  const handleClose = () => {
    setQuery('')
    setSelectedIndex(0)
    onClose()
  }

  const handleCommandSelect = (command: Command) => {
    command.action()
    handleClose()
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn(
        'max-w-2xl p-0 gap-0 overflow-hidden',
        className
      )}>
        {/* Search Input */}
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
            autoFocus
          />
          <div className="flex items-center gap-1 ml-2 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded border">↑↓</kbd>
            <span>navigate</span>
            <kbd className="px-1.5 py-0.5 rounded border">↵</kbd>
            <span>select</span>
            <kbd className="px-1.5 py-0.5 rounded border">esc</kbd>
            <span>close</span>
          </div>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-96">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No commands found</p>
              <p className="text-xs">Try a different search term</p>
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(groupedCommands).map(([categoryId, categoryCommands], groupIndex) => {
                const category = categories.find(c => c.id === categoryId)
                if (!category || categoryCommands.length === 0) return null

                const CategoryIcon = category.icon
                let commandIndex = 0
                
                // Calculate the starting index for this category
                for (let i = 0; i < groupIndex; i++) {
                  const prevCategoryId = Object.keys(groupedCommands)[i]
                  commandIndex += groupedCommands[prevCategoryId]?.length || 0
                }

                return (
                  <div key={categoryId} className="mb-4 last:mb-0">
                    {/* Category Header */}
                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                      <CategoryIcon className={cn('h-3 w-3', category.color)} />
                      {category.label}
                    </div>

                    {/* Commands */}
                    <div className="space-y-1">
                      {categoryCommands.map((command, index) => {
                        const globalIndex = commandIndex + index
                        const isSelected = globalIndex === selectedIndex
                        const Icon = command.icon

                        return (
                          <div
                            key={command.id}
                            className={cn(
                              'flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors',
                              isSelected 
                                ? 'bg-accent text-accent-foreground' 
                                : 'hover:bg-muted/50'
                            )}
                            onClick={() => handleCommandSelect(command)}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm truncate">
                                  {command.label}
                                </div>
                                {command.description && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {command.description}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {command.shortcut && (
                                <Badge variant="outline" className="text-xs font-mono">
                                  {command.shortcut}
                                </Badge>
                              )}
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Add separator between categories */}
                    {groupIndex < Object.keys(groupedCommands).length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
              </span>
              {query && (
                <span>
                  matching "{query}"
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border text-xs">Ctrl+K</kbd>
              <span>to open</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook to manage command palette state
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
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