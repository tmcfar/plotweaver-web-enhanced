'use client'

import React, { useState } from 'react'
import { 
  Sparkles, 
  Zap, 
  Play, 
  Wand2, 
  Bot, 
  Lightbulb, 
  RefreshCw,
  ArrowRight,
  Star,
  Clock,
  Target,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface AIFirstProps {
  projectId: string
  className?: string
}

// Mock data for AI-first experience
const mockData = {
  quickStats: {
    generatedToday: 3456,
    totalGenerated: 23456,
    aiSuggestionsUsed: 127,
    autoCompletions: 89
  },
  preGeneratedContent: [
    {
      id: '1',
      type: 'scene',
      title: 'Sarah\'s First Encounter',
      preview: 'The morning sun cast long shadows across the cobblestone streets...',
      words: 847,
      confidence: 92,
      timestamp: '2 minutes ago'
    },
    {
      id: '2',
      type: 'dialogue',
      title: 'Margaret\'s Revelation',
      preview: '"I\'ve been waiting for you," Margaret said softly...',
      words: 423,
      confidence: 88,
      timestamp: '15 minutes ago'
    },
    {
      id: '3',
      type: 'description',
      title: 'The Mysterious Library',
      preview: 'Ancient books lined the walls from floor to ceiling...',
      words: 612,
      confidence: 95,
      timestamp: '1 hour ago'
    }
  ],
  aiSuggestions: [
    {
      id: '1',
      type: 'improvement',
      text: 'The dialogue could be more impactful with emotional subtext',
      confidence: 87,
      location: 'Chapter 2, Paragraph 3'
    },
    {
      id: '2',
      type: 'continuation',
      text: 'Consider adding a scene transition here for better pacing',
      confidence: 91,
      location: 'Chapter 1, End'
    },
    {
      id: '3',
      type: 'character',
      text: 'Sarah\'s motivation could be clearer in this scene',
      confidence: 84,
      location: 'Chapter 2, Paragraph 7'
    }
  ],
  quickActions: [
    { icon: Wand2, label: 'Generate Next Scene', description: 'Continue the story automatically' },
    { icon: Bot, label: 'Character Dialogue', description: 'Generate character conversations' },
    { icon: Lightbulb, label: 'Plot Ideas', description: 'Get story development suggestions' },
    { icon: RefreshCw, label: 'Rewrite Section', description: 'Improve existing content' }
  ]
}

export function AIFirst({ projectId, className }: AIFirstProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedContent, setSelectedContent] = useState<string | null>(null)

  const { quickStats, preGeneratedContent, aiSuggestions, quickActions } = mockData

  const handleQuickGenerate = async (type: string) => {
    setIsGenerating(true)
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false)
    }, 2000)
  }

  const handleUseContent = (contentId: string) => {
    setSelectedContent(contentId)
    // Simulate inserting content
    setTimeout(() => {
      setSelectedContent(null)
    }, 1000)
  }

  return (
    <div className={cn('h-full flex flex-col space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI-Powered Writing
        </h1>
        <p className="text-muted-foreground">Let AI accelerate your creativity</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-blue-600">{quickStats.generatedToday}</div>
            <div className="text-xs text-muted-foreground">Generated Today</div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-purple-600">{quickStats.aiSuggestionsUsed}</div>
            <div className="text-xs text-muted-foreground">AI Suggestions</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-green-600">{quickStats.autoCompletions}</div>
            <div className="text-xs text-muted-foreground">Auto-Completions</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-orange-600">{quickStats.totalGenerated}</div>
            <div className="text-xs text-muted-foreground">Total AI Words</div>
          </CardContent>
        </Card>
      </div>

      {/* One-Click Generation */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            One-Click Generation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary/5"
                onClick={() => handleQuickGenerate(action.label)}
                disabled={isGenerating}
              >
                <action.icon className={cn(
                  'h-6 w-6',
                  isGenerating ? 'animate-spin' : 'text-primary'
                )} />
                <div className="text-center">
                  <div className="font-medium text-xs">{action.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>

          {isGenerating && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">AI is generating content...</span>
              </div>
              <Progress value={75} className="mt-2 h-1" />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Pre-Generated Content */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Ready to Use
              <Badge variant="secondary" className="ml-auto">
                {preGeneratedContent.length} items
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {preGeneratedContent.map((content) => (
                  <div 
                    key={content.id}
                    className={cn(
                      'border rounded-lg p-3 transition-all cursor-pointer',
                      selectedContent === content.id 
                        ? 'border-green-500 bg-green-50' 
                        : 'hover:border-primary/50 hover:bg-muted/50'
                    )}
                    onClick={() => handleUseContent(content.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{content.title}</h4>
                        <Badge variant="outline" className="text-xs mt-1">
                          {content.type}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">{content.timestamp}</div>
                        <Badge 
                          variant={content.confidence > 90 ? 'default' : 'secondary'}
                          className="text-xs mt-1"
                        >
                          {content.confidence}% confident
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {content.preview}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {content.words} words
                      </span>
                      <Button size="sm" variant="ghost" className="h-6 text-xs">
                        {selectedContent === content.id ? (
                          <>Inserting...</>
                        ) : (
                          <>
                            Use This <ArrowRight className="h-3 w-3 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-orange-500" />
              Smart Suggestions
              <Badge variant="secondary" className="ml-auto">
                {aiSuggestions.length} active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {aiSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge 
                        variant={suggestion.type === 'improvement' ? 'default' : 'secondary'}
                        className="text-xs capitalize"
                      >
                        {suggestion.type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.confidence}% confidence
                      </Badge>
                    </div>
                    
                    <p className="text-sm mb-2">{suggestion.text}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {suggestion.location}
                      </span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 text-xs">
                          Apply
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 text-xs">
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            AI Writing Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4 mb-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  I'm ready to help you write! I can generate scenes, improve dialogue, 
                  create character descriptions, or brainstorm plot ideas. What would you like to work on?
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              "Generate a dramatic scene"
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              "Improve this dialogue"
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              "What happens next?"
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}