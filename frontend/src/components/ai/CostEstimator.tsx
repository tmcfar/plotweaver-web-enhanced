'use client'

import React, { useState, useEffect } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  AlertTriangle,
  Info,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface CostEstimate {
  inputTokens: number
  outputTokens: number
  inputCost: number
  outputCost: number
  totalCost: number
  agent: string
}

interface UsageStats {
  daily: number
  weekly: number
  monthly: number
  dailyLimit: number
  weeklyLimit: number
  monthlyLimit: number
}

interface CostEstimatorProps {
  estimate: CostEstimate
  usage?: UsageStats
  showBreakdown?: boolean
  showUsage?: boolean
  className?: string
}

const agentInfo = {
  'gpt-4': { 
    name: 'GPT-4', 
    inputRate: 0.03, 
    outputRate: 0.06, 
    color: 'text-blue-600',
    description: 'High quality, expensive' 
  },
  'gpt-3.5-turbo': { 
    name: 'GPT-3.5 Turbo', 
    inputRate: 0.0015, 
    outputRate: 0.002, 
    color: 'text-green-600',
    description: 'Fast and cost-effective' 
  },
  'claude': { 
    name: 'Claude', 
    inputRate: 0.008, 
    outputRate: 0.024, 
    color: 'text-purple-600',
    description: 'Great for creative writing' 
  },
  'gemini': { 
    name: 'Gemini', 
    inputRate: 0.00025, 
    outputRate: 0.0005, 
    color: 'text-orange-600',
    description: 'Most affordable option' 
  }
}

export function CostEstimator({ 
  estimate, 
  usage, 
  showBreakdown = true, 
  showUsage = true,
  className 
}: CostEstimatorProps) {
  const [comparisonAgent, setComparisonAgent] = useState<string>('gpt-3.5-turbo')
  
  const agent = agentInfo[estimate.agent as keyof typeof agentInfo] || agentInfo['gpt-4']
  const comparison = agentInfo[comparisonAgent as keyof typeof agentInfo]

  // Calculate comparison cost
  const comparisonCost = (estimate.inputTokens / 1000 * comparison.inputRate) + 
                        (estimate.outputTokens / 1000 * comparison.outputRate)
  const costDifference = estimate.totalCost - comparisonCost
  const costDifferencePercent = comparisonCost > 0 ? (costDifference / comparisonCost) * 100 : 0

  // Usage calculations
  const dailyUsagePercent = usage ? (usage.daily / usage.dailyLimit) * 100 : 0
  const monthlyUsagePercent = usage ? (usage.monthly / usage.monthlyLimit) * 100 : 0

  const formatCost = (cost: number) => `$${cost.toFixed(4)}`
  const formatTokens = (tokens: number) => tokens.toLocaleString()

  return (
    <TooltipProvider>
      <Card className={cn('w-full', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Cost Estimate
            </div>
            <Badge variant="outline" className={agent.color}>
              {agent.name}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Main cost display */}
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {formatCost(estimate.totalCost)}
            </div>
            <div className="text-xs text-muted-foreground">
              for {formatTokens(estimate.inputTokens + estimate.outputTokens)} tokens
            </div>
          </div>

          {/* Cost breakdown */}
          {showBreakdown && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Input</span>
                    <span className="font-mono">{formatCost(estimate.inputCost)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTokens(estimate.inputTokens)} @ ${agent.inputRate}/1K
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Output</span>
                    <span className="font-mono">{formatCost(estimate.outputCost)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTokens(estimate.outputTokens)} @ ${agent.outputRate}/1K
                  </div>
                </div>
              </div>

              {/* Comparison */}
              <div className="pt-3 border-t border-border/50">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">vs {comparison.name}</span>
                  <div className="flex items-center gap-1">
                    {costDifference > 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-red-500" />
                        <span className="text-red-600">+{formatCost(Math.abs(costDifference))}</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3 text-green-500" />
                        <span className="text-green-600">-{formatCost(Math.abs(costDifference))}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {Math.abs(costDifferencePercent).toFixed(1)}% {costDifference > 0 ? 'more' : 'less'} expensive
                </div>

                {/* Agent switcher */}
                <div className="flex gap-1 mt-2">
                  {Object.entries(agentInfo).map(([key, info]) => (
                    <Button
                      key={key}
                      variant={key === comparisonAgent ? "default" : "outline"}
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={() => setComparisonAgent(key)}
                    >
                      {info.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Usage tracking */}
          {showUsage && usage && (
            <div className="pt-3 border-t border-border/50 space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Usage This Month</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Daily</span>
                    <span className="font-mono">{formatCost(usage.daily)}</span>
                  </div>
                  <Progress value={dailyUsagePercent} className="h-1" />
                  <div className="text-xs text-muted-foreground">
                    {dailyUsagePercent.toFixed(1)}% of ${usage.dailyLimit} limit
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Monthly</span>
                    <span className="font-mono">{formatCost(usage.monthly)}</span>
                  </div>
                  <Progress 
                    value={monthlyUsagePercent} 
                    className={cn(
                      'h-1',
                      monthlyUsagePercent > 90 && 'bg-red-100',
                      monthlyUsagePercent > 75 && monthlyUsagePercent <= 90 && 'bg-yellow-100'
                    )}
                  />
                  <div className="text-xs text-muted-foreground">
                    {monthlyUsagePercent.toFixed(1)}% of ${usage.monthlyLimit} limit
                  </div>
                </div>

                {/* Usage warnings */}
                {monthlyUsagePercent > 75 && (
                  <div className={cn(
                    'flex items-center gap-2 p-2 rounded text-xs',
                    monthlyUsagePercent > 90 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  )}>
                    <AlertTriangle className="h-3 w-3" />
                    <span>
                      {monthlyUsagePercent > 90 
                        ? 'Approaching monthly limit' 
                        : 'High usage this month'
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cost optimization tips */}
          <div className="pt-3 border-t border-border/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-xs text-muted-foreground cursor-help">
                  <Info className="h-3 w-3" />
                  <span>Cost optimization tips</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <div>• Use shorter prompts when possible</div>
                  <div>• Choose the right model for your task</div>
                  <div>• Set appropriate max token limits</div>
                  <div>• Batch similar requests together</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

// Hook for cost tracking
export function useCostTracking() {
  const [costs, setCosts] = useState<CostEstimate[]>([])
  const [usage, setUsage] = useState<UsageStats>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    dailyLimit: 10,
    weeklyLimit: 50,
    monthlyLimit: 200
  })

  const addCost = (cost: CostEstimate) => {
    setCosts(prev => [...prev, cost])
    setUsage(prev => ({
      ...prev,
      daily: prev.daily + cost.totalCost,
      weekly: prev.weekly + cost.totalCost,
      monthly: prev.monthly + cost.totalCost
    }))
  }

  const getTotalCost = (period: 'daily' | 'weekly' | 'monthly') => {
    return usage[period]
  }

  const getCostsByAgent = () => {
    return costs.reduce((acc, cost) => {
      acc[cost.agent] = (acc[cost.agent] || 0) + cost.totalCost
      return acc
    }, {} as Record<string, number>)
  }

  const resetPeriod = (period: 'daily' | 'weekly' | 'monthly') => {
    setUsage(prev => ({ ...prev, [period]: 0 }))
  }

  return {
    costs,
    usage,
    addCost,
    getTotalCost,
    getCostsByAgent,
    resetPeriod
  }
}