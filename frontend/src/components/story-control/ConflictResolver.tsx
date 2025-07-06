'use client'

import React, { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Lightbulb,
  Undo2,
  Copy,
  FileText,
  GitBranch,
  Merge,
  Split
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface Conflict {
  id: string
  type: 'lock_violation' | 'continuity_error' | 'character_inconsistency' | 'plot_contradiction'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  originalText: string
  conflictingText: string
  location: {
    chapter: string
    section?: string
    paragraph?: number
    startChar: number
    endChar: number
  }
  suggestedResolutions: Resolution[]
  context: {
    beforeText: string
    afterText: string
    relatedLocks?: string[]
    relatedCharacters?: string[]
  }
  detectedAt: Date
  lockId?: string
}

interface Resolution {
  id: string
  type: 'revert' | 'modify' | 'ignore' | 'split_scene' | 'create_lock'
  title: string
  description: string
  newText?: string
  confidence: number
  impact: 'low' | 'medium' | 'high'
  reasoning: string
  previewText?: string
}

interface ConflictResolverProps {
  conflict: Conflict
  onResolve: (conflictId: string, resolution: Resolution, customText?: string) => void
  onCancel: () => void
  onRequestAISuggestion?: (conflict: Conflict) => Promise<Resolution[]>
  className?: string
}

const conflictTypeConfig = {
  lock_violation: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    label: 'Lock Violation',
    description: 'Content violates a story lock'
  },
  continuity_error: {
    icon: XCircle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    label: 'Continuity Error',
    description: 'Inconsistency with established facts'
  },
  character_inconsistency: {
    icon: AlertTriangle,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    label: 'Character Issue',
    description: 'Character behaves inconsistently'
  },
  plot_contradiction: {
    icon: GitBranch,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    label: 'Plot Contradiction',
    description: 'Plot elements contradict each other'
  }
}

const resolutionTypeConfig = {
  revert: {
    icon: Undo2,
    color: 'text-gray-600',
    label: 'Revert Changes',
    description: 'Restore to previous version'
  },
  modify: {
    icon: FileText,
    color: 'text-blue-600',
    label: 'Modify Text',
    description: 'Adjust the current text'
  },
  ignore: {
    icon: XCircle,
    color: 'text-gray-500',
    label: 'Ignore Conflict',
    description: 'Accept the inconsistency'
  },
  split_scene: {
    icon: Split,
    color: 'text-green-600',
    label: 'Split Scene',
    description: 'Break into separate scenes'
  },
  create_lock: {
    icon: CheckCircle,
    color: 'text-purple-600',
    label: 'Create Lock',
    description: 'Make this the new standard'
  }
}

export function ConflictResolver({
  conflict,
  onResolve,
  onCancel,
  onRequestAISuggestion,
  className
}: ConflictResolverProps) {
  const [selectedResolution, setSelectedResolution] = useState<Resolution | null>(null)
  const [customText, setCustomText] = useState('')
  const [isRequestingAI, setIsRequestingAI] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<Resolution[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  const typeConfig = conflictTypeConfig[conflict.type]
  const TypeIcon = typeConfig.icon

  const handleRequestAISuggestion = async () => {
    if (!onRequestAISuggestion) return
    
    setIsRequestingAI(true)
    try {
      const suggestions = await onRequestAISuggestion(conflict)
      setAiSuggestions(suggestions)
      setActiveTab('ai-suggestions')
    } catch (error) {
      console.error('Failed to get AI suggestions:', error)
    } finally {
      setIsRequestingAI(false)
    }
  }

  const handleResolve = () => {
    if (!selectedResolution) return
    
    const finalText = selectedResolution.type === 'modify' && customText 
      ? customText 
      : selectedResolution.newText
      
    onResolve(conflict.id, selectedResolution, finalText)
  }

  const allResolutions = [...conflict.suggestedResolutions, ...aiSuggestions]

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className={cn('max-w-4xl max-h-[90vh] overflow-hidden', className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className={cn('h-5 w-5', typeConfig.color)} />
            Resolve {typeConfig.label}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="resolutions">Resolutions</TabsTrigger>
              <TabsTrigger value="ai-suggestions">AI Help</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden mt-4">
              <TabsContent value="overview" className="h-full overflow-auto space-y-4">
                {/* Conflict details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Conflict Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Description</Label>
                      <p className="text-sm text-muted-foreground mt-1">{conflict.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Location</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {conflict.location.chapter}
                          {conflict.location.section && ` • ${conflict.location.section}`}
                          {conflict.location.paragraph && ` • Para ${conflict.location.paragraph}`}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs">Severity</Label>
                        <Badge variant="outline" className="mt-1 capitalize">
                          {conflict.severity}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Text comparison */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Text Comparison</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Context Before</Label>
                      <div className="bg-muted/50 rounded p-3 text-sm mt-1">
                        {conflict.context.beforeText || 'No previous context'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-green-600">Original Text</Label>
                        <div className="bg-green-50 border border-green-200 rounded p-3 text-sm mt-1">
                          {conflict.originalText}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-red-600">Conflicting Text</Label>
                        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm mt-1">
                          {conflict.conflictingText}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Context After</Label>
                      <div className="bg-muted/50 rounded p-3 text-sm mt-1">
                        {conflict.context.afterText || 'No following context'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Related information */}
                {(conflict.context.relatedLocks || conflict.context.relatedCharacters) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Related Elements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {conflict.context.relatedLocks && (
                        <div>
                          <Label className="text-xs">Related Locks</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {conflict.context.relatedLocks.map(lock => (
                              <Badge key={lock} variant="outline" className="text-xs">
                                {lock}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {conflict.context.relatedCharacters && (
                        <div>
                          <Label className="text-xs">Related Characters</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {conflict.context.relatedCharacters.map(character => (
                              <Badge key={character} variant="outline" className="text-xs">
                                {character}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="resolutions" className="h-full overflow-auto">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {conflict.suggestedResolutions.map(resolution => {
                      const resConfig = resolutionTypeConfig[resolution.type]
                      const ResIcon = resConfig.icon
                      const isSelected = selectedResolution?.id === resolution.id

                      return (
                        <Card 
                          key={resolution.id}
                          className={cn(
                            'cursor-pointer transition-colors border-2',
                            isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                          )}
                          onClick={() => setSelectedResolution(resolution)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <ResIcon className={cn('h-5 w-5 mt-0.5', resConfig.color)} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm">{resolution.title}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(resolution.confidence * 100)}% confidence
                                  </Badge>
                                  <Badge 
                                    variant={resolution.impact === 'high' ? 'destructive' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {resolution.impact} impact
                                  </Badge>
                                </div>
                                
                                <p className="text-sm text-muted-foreground mb-2">
                                  {resolution.description}
                                </p>
                                
                                <div className="bg-muted/50 rounded p-2 mb-2">
                                  <Label className="text-xs">Reasoning</Label>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {resolution.reasoning}
                                  </p>
                                </div>

                                {resolution.newText && (
                                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                    <Label className="text-xs text-blue-600">Suggested Text</Label>
                                    <p className="text-sm mt-1">{resolution.newText}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}

                    {conflict.suggestedResolutions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">No automatic resolutions available</p>
                        <p className="text-xs">Try requesting AI suggestions or create a custom solution</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="ai-suggestions" className="h-full overflow-auto space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">AI Suggestions</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRequestAISuggestion}
                    disabled={isRequestingAI || !onRequestAISuggestion}
                  >
                    {isRequestingAI ? (
                      <>
                        <Lightbulb className="h-4 w-4 mr-1 animate-pulse" />
                        Thinking...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="h-4 w-4 mr-1" />
                        Get AI Help
                      </>
                    )}
                  </Button>
                </div>

                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {aiSuggestions.map(suggestion => {
                      const resConfig = resolutionTypeConfig[suggestion.type]
                      const ResIcon = resConfig.icon
                      const isSelected = selectedResolution?.id === suggestion.id

                      return (
                        <Card 
                          key={suggestion.id}
                          className={cn(
                            'cursor-pointer transition-colors border-2',
                            isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                          )}
                          onClick={() => setSelectedResolution(suggestion)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <ResIcon className={cn('h-5 w-5 mt-0.5', resConfig.color)} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm">{suggestion.title}</h4>
                                  <Badge variant="secondary" className="text-xs">AI</Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(suggestion.confidence * 100)}% confidence
                                  </Badge>
                                </div>
                                
                                <p className="text-sm text-muted-foreground mb-2">
                                  {suggestion.description}
                                </p>

                                {suggestion.newText && (
                                  <div className="bg-purple-50 border border-purple-200 rounded p-2">
                                    <Label className="text-xs text-purple-600">AI Suggested Text</Label>
                                    <p className="text-sm mt-1">{suggestion.newText}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}

                    {aiSuggestions.length === 0 && !isRequestingAI && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">No AI suggestions yet</p>
                        <p className="text-xs">Click "Get AI Help" to request intelligent solutions</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="preview" className="h-full overflow-auto space-y-4">
                {selectedResolution ? (
                  <>
                    <div>
                      <Label>Selected Resolution</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedResolution.title} - {selectedResolution.description}
                      </p>
                    </div>

                    {selectedResolution.type === 'modify' && (
                      <div>
                        <Label htmlFor="custom-text">Custom Text</Label>
                        <Textarea
                          id="custom-text"
                          value={customText}
                          onChange={(e) => setCustomText(e.target.value)}
                          placeholder={selectedResolution.newText || 'Enter your custom text...'}
                          rows={6}
                          className="mt-1"
                        />
                      </div>
                    )}

                    <div>
                      <Label>Preview</Label>
                      <div className="border rounded p-4 bg-muted/50 mt-1">
                        <div className="space-y-2 text-sm">
                          <div className="text-muted-foreground">
                            {conflict.context.beforeText}
                          </div>
                          <div className="font-medium bg-green-100 px-2 py-1 rounded">
                            {selectedResolution.type === 'modify' && customText 
                              ? customText 
                              : selectedResolution.newText || selectedResolution.previewText || 'Resolution applied'
                            }
                          </div>
                          <div className="text-muted-foreground">
                            {conflict.context.afterText}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ArrowRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Select a resolution to preview</p>
                    <p className="text-xs">Choose from the suggested resolutions or AI suggestions</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Actions */}
        <Separator />
        <div className="flex items-center justify-between pt-4">
          <div className="text-xs text-muted-foreground">
            Detected: {conflict.detectedAt.toLocaleDateString()} at {conflict.detectedAt.toLocaleTimeString()}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleResolve}
              disabled={!selectedResolution}
            >
              Apply Resolution
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}