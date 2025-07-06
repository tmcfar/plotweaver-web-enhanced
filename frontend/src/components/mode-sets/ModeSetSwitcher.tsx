'use client'

import React, { useState } from 'react'
import { 
  User, 
  Bot, 
  Edit, 
  Gamepad2, 
  Settings, 
  Crown, 
  Sparkles, 
  Target,
  ChevronDown,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export type ModeSetType = 'professional' | 'ai-first' | 'editor' | 'hobbyist'

interface ModeSetSwitcherProps {
  currentMode: ModeSetType
  onModeChange: (mode: ModeSetType) => void
  className?: string
}

interface ModeSetConfig {
  id: ModeSetType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  features: string[]
  tier: 'free' | 'pro' | 'enterprise'
}

const modeSetConfigs: ModeSetConfig[] = [
  {
    id: 'professional',
    label: 'Professional Writer',
    description: 'Advanced controls and detailed analytics',
    icon: User,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    features: [
      'Advanced lock management',
      'Git version control',
      'Detailed analytics',
      'Export tools',
      'Collaboration features'
    ],
    tier: 'pro'
  },
  {
    id: 'ai-first',
    label: 'AI-First',
    description: 'Simplified AI-powered writing',
    icon: Bot,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    features: [
      'One-click generation',
      'Smart suggestions',
      'Auto-completion',
      'Content cards',
      'AI assistant chat'
    ],
    tier: 'pro'
  },
  {
    id: 'editor',
    label: 'Editor',
    description: 'Read-only with annotation tools',
    icon: Edit,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    features: [
      'Annotation tools',
      'Track changes',
      'Review workflow',
      'Export focused',
      'Comment threads'
    ],
    tier: 'free'
  },
  {
    id: 'hobbyist',
    label: 'Hobbyist',
    description: 'Gamified writing experience',
    icon: Gamepad2,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    features: [
      'Achievement system',
      'Progress tracking',
      'Daily goals',
      'Community features',
      'Writing streaks'
    ],
    tier: 'free'
  }
]

export function ModeSetSwitcher({ currentMode, onModeChange, className }: ModeSetSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const currentConfig = modeSetConfigs.find(config => config.id === currentMode)
  
  const CurrentIcon = currentConfig?.icon || User

  return (
    <div className={cn('relative', className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="h-10 justify-between min-w-[200px]"
          >
            <div className="flex items-center gap-2">
              <CurrentIcon className={cn('h-4 w-4', currentConfig?.color)} />
              <span className="font-medium">{currentConfig?.label}</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="start" className="w-80">
          <DropdownMenuLabel className="px-2 py-1.5">
            Choose Writing Mode
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {modeSetConfigs.map((config) => {
            const Icon = config.icon
            const isSelected = config.id === currentMode
            
            return (
              <DropdownMenuItem
                key={config.id}
                className="p-3 cursor-pointer focus:bg-muted/50"
                onClick={() => {
                  onModeChange(config.id)
                  setIsOpen(false)
                }}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    config.bgColor
                  )}>
                    <Icon className={cn('h-5 w-5', config.color)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{config.label}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                      <Badge 
                        variant={config.tier === 'free' ? 'secondary' : 'default'}
                        className="text-xs capitalize"
                      >
                        {config.tier}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {config.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      {config.features.slice(0, 3).map((feature) => (
                        <Badge 
                          key={feature}
                          variant="outline" 
                          className="text-xs"
                        >
                          {feature}
                        </Badge>
                      ))}
                      {config.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{config.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            )
          })}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem className="p-2 cursor-pointer">
            <div className="flex items-center gap-2 w-full">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Customize Mode Settings</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Full Mode Set Selection Dialog
interface ModeSetSelectionDialogProps {
  currentMode: ModeSetType
  onModeChange: (mode: ModeSetType) => void
  onClose: () => void
  isOpen: boolean
}

export function ModeSetSelectionDialog({ 
  currentMode, 
  onModeChange, 
  onClose, 
  isOpen 
}: ModeSetSelectionDialogProps) {
  const [selectedMode, setSelectedMode] = useState<ModeSetType>(currentMode)

  const handleConfirm = () => {
    onModeChange(selectedMode)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Choose Your Writing Mode
          </h2>
          <p className="text-muted-foreground mt-1">
            Select the mode that best fits your writing style and needs
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modeSetConfigs.map((config) => {
              const Icon = config.icon
              const isSelected = config.id === selectedMode
              
              return (
                <Card 
                  key={config.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    isSelected && 'ring-2 ring-primary border-primary'
                  )}
                  onClick={() => setSelectedMode(config.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-12 h-12 rounded-lg flex items-center justify-center',
                          config.bgColor
                        )}>
                          <Icon className={cn('h-6 w-6', config.color)} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{config.label}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={config.tier === 'free' ? 'secondary' : 'default'}
                              className="text-xs capitalize"
                            >
                              {config.tier}
                            </Badge>
                            {config.tier === 'pro' && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <CardDescription className="mb-3">
                      {config.description}
                    </CardDescription>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Key Features:</h4>
                      <div className="grid grid-cols-1 gap-1">
                        {config.features.map((feature) => (
                          <div 
                            key={feature} 
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                          >
                            <Target className="h-3 w-3" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
        
        <div className="p-6 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Switch to {modeSetConfigs.find(c => c.id === selectedMode)?.label}
          </Button>
        </div>
      </div>
    </div>
  )
}