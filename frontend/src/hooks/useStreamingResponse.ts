'use client'

import { useState, useCallback } from 'react'

interface StreamingOptions {
  prompt: string
  context?: string
  agent: string
  temperature?: number
  maxTokens?: number
  onChunk?: (chunk: string) => void
  onComplete?: (finalContent: string, metadata: any) => void
  onError?: (error: string) => void
}

interface StreamingMetadata {
  tokens: number
  cost: number
  model: string
  duration: number
}

export function useStreamingResponse() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentStream, setCurrentStream] = useState<AbortController | null>(null)

  const streamResponse = useCallback(async (options: StreamingOptions) => {
    const {
      prompt,
      context = '',
      agent,
      temperature = 0.7,
      maxTokens = 1000,
      onChunk,
      onComplete,
      onError
    } = options

    setIsStreaming(true)
    
    // Create abort controller for cancellation
    const abortController = new AbortController()
    setCurrentStream(abortController)

    try {
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          context,
          agent,
          temperature,
          maxTokens,
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let metadata: StreamingMetadata | null = null

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              // Stream completed
              if (onComplete && metadata) {
                onComplete(fullContent, metadata)
              }
              return
            }

            try {
              const parsed = JSON.parse(data)
              
              if (parsed.type === 'content') {
                const content = parsed.content
                fullContent += content
                onChunk?.(content)
              } else if (parsed.type === 'metadata') {
                metadata = parsed.data
              } else if (parsed.type === 'error') {
                throw new Error(parsed.message)
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming data:', parseError)
            }
          }
        }
      }

      // Fallback completion if [DONE] wasn't received
      if (onComplete && metadata) {
        onComplete(fullContent, metadata)
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted')
      } else {
        console.error('Streaming error:', error)
        onError?.(error.message || 'An error occurred while streaming')
      }
    } finally {
      setIsStreaming(false)
      setCurrentStream(null)
    }
  }, [])

  const cancelStream = useCallback(() => {
    if (currentStream) {
      currentStream.abort()
      setCurrentStream(null)
      setIsStreaming(false)
    }
  }, [currentStream])

  return {
    streamResponse,
    cancelStream,
    isStreaming,
  }
}

// Cost estimation hook
export function useCostEstimation() {
  const estimateCost = useCallback((
    agent: string, 
    inputTokens: number, 
    outputTokens: number = 0
  ) => {
    // Cost per 1K tokens (these would be real pricing)
    const pricing = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'claude': { input: 0.008, output: 0.024 },
      'gemini': { input: 0.00025, output: 0.0005 },
    }

    const rates = pricing[agent as keyof typeof pricing] || pricing['gpt-4']
    
    const inputCost = (inputTokens / 1000) * rates.input
    const outputCost = (outputTokens / 1000) * rates.output
    
    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      breakdown: {
        inputTokens,
        outputTokens,
        inputRate: rates.input,
        outputRate: rates.output,
      }
    }
  }, [])

  const estimateTokens = useCallback((text: string) => {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4)
  }, [])

  return {
    estimateCost,
    estimateTokens,
  }
}