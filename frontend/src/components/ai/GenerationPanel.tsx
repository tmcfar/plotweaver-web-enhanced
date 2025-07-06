'use client'

import React, { useState, useEffect } from 'react'
import { 
  Sparkles, 
  Settings, 
  DollarSign, 
  Zap, 
  Clock, 
  Target,
  Play,
  Pause,
  Square,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useStreamingResponse, useCostEstimation } from '@/hooks/useStreamingResponse'

interface GenerationOptions {
  agent: string
  temperature: number
  maxTokens: number
  tone: string
  style: string
  length: 'short' | 'medium' | 'long'
  focus: string[]
}

interface GenerationPanelProps {
  projectId: string
  context?: string
  selectedText?: string
  onGenerate?: (content: string) => void
  onInsert?: (content: string) => void
  className?: string
}

const agents = [
  { id: 'gpt-4', name: 'GPT-4', description: 'Most capable, best for complex writing', icon: '🤖' },
  { id: 'claude', name: 'Claude', description: 'Great for creative writing and editing', icon: '🧠' },
  { id: 'gemini', name: 'Gemini', description: 'Fast and efficient for quick generation', icon: '💫' },
]

const tones = [
  'Professional', 'Casual', 'Formal', 'Conversational', 'Academic', 'Creative', 
  'Humorous', 'Serious', 'Optimistic', 'Dramatic', 'Mysterious', 'Romantic'
]

const styles = [
  'Descriptive', 'Dialogue-heavy', 'Action-packed', 'Introspective', 'Minimalist',
  'Detailed', 'Fast-paced', 'Atmospheric', 'Character-driven', 'Plot-driven'
]

const focusAreas = [
  'Character Development', 'Plot Advancement', 'World Building', 'Dialogue',
  'Action Sequences', 'Emotional Depth', 'Pacing', 'Conflict Resolution'
]

export function GenerationPanel({ 
  projectId, 
  context, 
  selectedText, 
  onGenerate, 
  onInsert,
  className 
}: GenerationPanelProps) {
  const [options, setOptions] = useState<GenerationOptions>({
    agent: 'gpt-4',
    temperature: 0.7,
    maxTokens: 500,
    tone: 'Creative',
    style: 'Descriptive',
    length: 'medium',
    focus: ['Character Development']
  })

  const [prompt, setPrompt] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [showPreview, setShowPreview] = useState(false)

  const { streamResponse, cancelStream, isStreaming } = useStreamingResponse()
  const { estimateCost, estimateTokens } = useCostEstimation()

  // Update max tokens based on length selection
  useEffect(() => {
    const lengthTokens = {
      short: 250,
      medium: 500,
      long: 1000
    }
    setOptions(prev => ({ ...prev, maxTokens: lengthTokens[options.length] }))
  }, [options.length])

  // Calculate cost estimation
  const inputTokens = estimateTokens(prompt + (context || '') + (selectedText || ''))
  const costEstimate = estimateCost(options.agent, inputTokens, options.maxTokens)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setGeneratedContent('')
    setGenerationProgress(0)
    setShowPreview(true)

    const fullPrompt = `
Context: ${context || 'No additional context provided'}
${selectedText ? `Selected text: ${selectedText}` : ''}

Instructions: ${prompt}

Please write in a ${options.tone.toLowerCase()} tone with a ${options.style.toLowerCase()} style.
Focus on: ${options.focus.join(', ')}.
Target length: ${options.length} (approximately ${options.maxTokens} tokens).
    `.trim()

    try {
      await streamResponse({
        prompt: fullPrompt,
        agent: options.agent,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        onChunk: (chunk) => {
          setGeneratedContent(prev => prev + chunk)
          // Simulate progress based on content length
          setGenerationProgress(prev => Math.min(prev + 2, 90))
        },
        onComplete: (finalContent, metadata) => {
          setGeneratedContent(finalContent)
          setGenerationProgress(100)
          setIsGenerating(false)
          onGenerate?.(finalContent)
        },
        onError: (error) => {
          console.error('Generation error:', error)
          setIsGenerating(false)
          setGenerationProgress(0)
        }
      })
    } catch (error) {
      console.error('Failed to generate:', error)
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  const handleCancel = () => {
    cancelStream()
    setIsGenerating(false)
    setGenerationProgress(0)
  }

  const handleInsert = () => {
    if (generatedContent && onInsert) {
      onInsert(generatedContent)
      setGeneratedContent('')
      setShowPreview(false)
    }
  }

  const handleRegenerate = () => {
    if (!isGenerating) {
      handleGenerate()
    }
  }

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Generation
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        <Tabs defaultValue="generate" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="flex-1 space-y-4">
            {/* Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="prompt">What would you like me to write?</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Write a dialogue between Sarah and the mysterious stranger..."
                className="min-h-[100px]"
              />
            </div>

            {/* Quick Options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Agent</Label>
                <Select value={options.agent} onValueChange={(value) => setOptions(prev => ({ ...prev, agent: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center gap-2">
                          <span>{agent.icon}</span>
                          <span>{agent.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Length</Label>
                <Select value={options.length} onValueChange={(value: any) => setOptions(prev => ({ ...prev, length: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (~250 words)</SelectItem>
                    <SelectItem value="medium">Medium (~500 words)</SelectItem>
                    <SelectItem value="long">Long (~1000 words)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cost Estimation */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span>Estimated Cost</span>
                  </div>
                  <span className="font-mono">${costEstimate.totalCost.toFixed(4)}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {inputTokens} input + {options.maxTokens} output tokens
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="flex gap-2">
              <Button 
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
              
              {isGenerating && (
                <Button variant="outline" onClick={handleCancel}>
                  <Square className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Progress */}
            {(isGenerating || generationProgress > 0) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Generation Progress</span>
                  <span>{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="h-2" />
              </div>
            )}

            {/* Preview */}
            {showPreview && generatedContent && (
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Generated Content</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleRegenerate}
                        disabled={isGenerating}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Regenerate
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleInsert}
                        disabled={isGenerating}
                      >
                        <Target className="h-3 w-3 mr-1" />
                        Insert
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm">
                      {generatedContent}
                      {isGenerating && (
                        <span className="inline-block w-2 h-4 bg-primary/50 animate-pulse ml-1" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="flex-1 space-y-6">
            {/* Agent Selection */}
            <div className="space-y-3">
              <Label>AI Agent</Label>
              <div className="grid gap-2">
                {agents.map(agent => (
                  <div
                    key={agent.id}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-colors',
                      options.agent === agent.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    )}
                    onClick={() => setOptions(prev => ({ ...prev, agent: agent.id }))}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{agent.icon}</span>
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-xs text-muted-foreground">{agent.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Temperature */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Creativity</Label>
                <Badge variant="outline">{options.temperature}</Badge>
              </div>
              <Slider
                value={[options.temperature]}
                onValueChange={([value]) => setOptions(prev => ({ ...prev, temperature: value }))}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Conservative</span>
                <span>Creative</span>
              </div>
            </div>

            <Separator />

            {/* Tone and Style */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={options.tone} onValueChange={(value) => setOptions(prev => ({ ...prev, tone: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tones.map(tone => (
                      <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Style</Label>
                <Select value={options.style} onValueChange={(value) => setOptions(prev => ({ ...prev, style: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {styles.map(style => (
                      <SelectItem key={style} value={style}>{style}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Focus Areas */}
            <div className="space-y-3">
              <Label>Focus Areas</Label>
              <div className="flex flex-wrap gap-2">
                {focusAreas.map(area => (
                  <Badge
                    key={area}
                    variant={options.focus.includes(area) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setOptions(prev => ({
                        ...prev,
                        focus: prev.focus.includes(area)
                          ? prev.focus.filter(f => f !== area)
                          : [...prev.focus, area]
                      }))
                    }}
                  >
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}