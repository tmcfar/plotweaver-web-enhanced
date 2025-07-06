'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  Send, 
  Bot, 
  User, 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  MoreHorizontal,
  Sparkles,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useStreamingResponse } from '@/hooks/useStreamingResponse'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
  agentName?: string
  tokens?: number
  cost?: number
}

interface AgentChatProps {
  projectId: string
  selectedAgent?: string
  context?: string
  onMessageSelect?: (message: Message) => void
  className?: string
}

const agentAvatars = {
  'gpt-4': '🤖',
  'claude': '🧠',
  'gemini': '💫',
  'custom': '⚡'
}

export function AgentChat({ 
  projectId, 
  selectedAgent = 'gpt-4',
  context,
  onMessageSelect,
  className 
}: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m here to help you with your story. What would you like to work on today?',
      timestamp: new Date(),
      agentName: selectedAgent
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { streamResponse, isStreaming } = useStreamingResponse()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Create assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: Message = {
      id: assistantMessageId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      agentName: selectedAgent
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      // Stream the response
      await streamResponse({
        prompt: inputValue.trim(),
        context: context || '',
        agent: selectedAgent,
        onChunk: (chunk: string) => {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + chunk }
              : msg
          ))
        },
        onComplete: (finalContent: string, metadata: any) => {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId
              ? { 
                  ...msg, 
                  content: finalContent,
                  isStreaming: false,
                  tokens: metadata?.tokens,
                  cost: metadata?.cost
                }
              : msg
          ))
          setIsTyping(false)
        },
        onError: (error: string) => {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId
              ? { 
                  ...msg, 
                  content: `Error: ${error}`,
                  isStreaming: false
                }
              : msg
          ))
          setIsTyping(false)
        }
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    // Could add toast notification here
  }

  const rateMessage = (messageId: string, rating: 'up' | 'down') => {
    // This would typically call an API to store the rating
    console.log(`Rated message ${messageId} as ${rating}`)
  }

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{agentAvatars[selectedAgent as keyof typeof agentAvatars]}</span>
              <span className="font-semibold">AI Assistant</span>
            </div>
            <Badge variant="secondary" className="capitalize">
              {selectedAgent}
            </Badge>
          </div>
          {isTyping && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.type === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted border',
                    onMessageSelect && 'cursor-pointer hover:bg-muted/80'
                  )}
                  onClick={() => onMessageSelect?.(message)}
                >
                  <div className="space-y-2">
                    <div className="whitespace-pre-wrap">
                      {message.content}
                      {message.isStreaming && (
                        <span className="inline-block w-2 h-4 bg-primary/50 animate-pulse ml-1" />
                      )}
                    </div>
                    
                    {message.type === 'assistant' && !message.isStreaming && (
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          {message.tokens && (
                            <span className="text-xs text-muted-foreground">
                              {message.tokens} tokens
                            </span>
                          )}
                          {message.cost && (
                            <span className="text-xs text-muted-foreground">
                              ${message.cost.toFixed(3)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyMessage(message.content)
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              rateMessage(message.id, 'up')
                            }}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              rateMessage(message.id, 'down')
                            }}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => copyMessage(message.content)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Regenerate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your story..."
              disabled={isStreaming}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isStreaming}
              size="icon"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}