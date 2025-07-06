'use client'

import React from 'react'
import { 
  Crown, 
  Lock, 
  Sparkles, 
  Zap, 
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export type UserTier = 'free' | 'pro' | 'enterprise'
export type FeatureKey = 
  | 'ai_generation'
  | 'advanced_locks'
  | 'git_integration'
  | 'collaboration'
  | 'export_formats'
  | 'analytics'
  | 'priority_support'
  | 'custom_agents'
  | 'unlimited_projects'
  | 'team_management'

interface FeatureConfig {
  key: FeatureKey
  name: string
  description: string
  requiredTier: UserTier
  icon: React.ComponentType<{ className?: string }>
  limitDescription?: string
}

const featureConfigs: FeatureConfig[] = [
  {
    key: 'ai_generation',
    name: 'AI Generation',
    description: 'Generate scenes, dialogue, and content with AI',
    requiredTier: 'pro',
    icon: Sparkles,
    limitDescription: 'Limited to 10 generations per month on free tier'
  },
  {
    key: 'advanced_locks',
    name: 'Advanced Story Locks',
    description: 'Complex lock management and continuity checking',
    requiredTier: 'pro',
    icon: Lock
  },
  {
    key: 'git_integration',
    name: 'Git Integration',
    description: 'Version control and branching for your stories',
    requiredTier: 'pro',
    icon: ArrowRight
  },
  {
    key: 'collaboration',
    name: 'Real-time Collaboration',
    description: 'Work together with other writers in real-time',
    requiredTier: 'pro',
    icon: CheckCircle
  },
  {
    key: 'export_formats',
    name: 'Advanced Export',
    description: 'Export to PDF, EPUB, Word, and more formats',
    requiredTier: 'pro',
    icon: ArrowRight
  },
  {
    key: 'analytics',
    name: 'Writing Analytics',
    description: 'Detailed insights into your writing patterns',
    requiredTier: 'pro',
    icon: CheckCircle
  },
  {
    key: 'priority_support',
    name: 'Priority Support',
    description: 'Get help faster with priority customer support',
    requiredTier: 'pro',
    icon: Zap
  },
  {
    key: 'custom_agents',
    name: 'Custom AI Agents',
    description: 'Create and train your own AI writing assistants',
    requiredTier: 'enterprise',
    icon: Crown
  },
  {
    key: 'unlimited_projects',
    name: 'Unlimited Projects',
    description: 'No limits on the number of writing projects',
    requiredTier: 'pro',
    icon: CheckCircle
  },
  {
    key: 'team_management',
    name: 'Team Management',
    description: 'Manage writing teams and permissions',
    requiredTier: 'enterprise',
    icon: Crown
  }
]

interface FeatureGateProps {
  feature: FeatureKey
  userTier: UserTier
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgradePrompt?: boolean
  className?: string
}

export function FeatureGate({ 
  feature, 
  userTier, 
  children, 
  fallback,
  showUpgradePrompt = true,
  className 
}: FeatureGateProps) {
  const featureConfig = featureConfigs.find(f => f.key === feature)
  const hasAccess = checkFeatureAccess(feature, userTier)
  
  if (hasAccess) {
    return <div className={className}>{children}</div>
  }

  if (fallback) {
    return <div className={className}>{fallback}</div>
  }

  if (showUpgradePrompt && featureConfig) {
    return (
      <div className={cn('relative', className)}>
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-lg">
          <div className="h-full flex items-center justify-center p-4">
            <UpgradePrompt feature={featureConfig} userTier={userTier} />
          </div>
        </div>
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
      </div>
    )
  }

  return null
}

function checkFeatureAccess(feature: FeatureKey, userTier: UserTier): boolean {
  const featureConfig = featureConfigs.find(f => f.key === feature)
  if (!featureConfig) return true

  const tierHierarchy: UserTier[] = ['free', 'pro', 'enterprise']
  const userTierIndex = tierHierarchy.indexOf(userTier)
  const requiredTierIndex = tierHierarchy.indexOf(featureConfig.requiredTier)

  return userTierIndex >= requiredTierIndex
}

interface UpgradePromptProps {
  feature: FeatureConfig
  userTier: UserTier
}

function UpgradePrompt({ feature, userTier }: UpgradePromptProps) {
  const Icon = feature.icon
  const isEnterpriseFeature = feature.requiredTier === 'enterprise'
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          {isEnterpriseFeature ? (
            <Crown className="h-5 w-5 text-yellow-500" />
          ) : (
            <Sparkles className="h-5 w-5 text-purple-500" />
          )}
          {feature.name}
        </CardTitle>
        <CardDescription>
          {feature.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="space-y-4">
          <Badge 
            variant={isEnterpriseFeature ? 'default' : 'secondary'}
            className="text-sm"
          >
            {isEnterpriseFeature ? 'Enterprise' : 'Pro'} Feature
          </Badge>
          
          {feature.limitDescription && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {feature.limitDescription}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex gap-2">
            <Button 
              className="flex-1"
              onClick={() => {
                // Handle upgrade flow
                console.log('Upgrade to', feature.requiredTier)
              }}
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to {isEnterpriseFeature ? 'Enterprise' : 'Pro'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                // Handle learn more
                console.log('Learn more about', feature.key)
              }}
            >
              Learn More
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Feature availability checker hook
export function useFeatureAccess(userTier: UserTier) {
  const checkFeature = (feature: FeatureKey): boolean => {
    return checkFeatureAccess(feature, userTier)
  }

  const getAvailableFeatures = (): FeatureKey[] => {
    return featureConfigs
      .filter(config => checkFeatureAccess(config.key, userTier))
      .map(config => config.key)
  }

  const getUnavailableFeatures = (): FeatureKey[] => {
    return featureConfigs
      .filter(config => !checkFeatureAccess(config.key, userTier))
      .map(config => config.key)
  }

  return {
    checkFeature,
    getAvailableFeatures,
    getUnavailableFeatures,
    hasFeature: checkFeature
  }
}

// Feature comparison component
interface FeatureComparisonProps {
  currentTier: UserTier
  className?: string
}

export function FeatureComparison({ currentTier, className }: FeatureComparisonProps) {
  const tiers: { tier: UserTier; label: string; price: string }[] = [
    { tier: 'free', label: 'Free', price: '$0/month' },
    { tier: 'pro', label: 'Pro', price: '$19/month' },
    { tier: 'enterprise', label: 'Enterprise', price: 'Custom' }
  ]

  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Unlock advanced features to enhance your writing experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <Card 
            key={tier.tier}
            className={cn(
              'relative',
              tier.tier === currentTier && 'ring-2 ring-primary',
              tier.tier === 'pro' && 'border-primary'
            )}
          >
            {tier.tier === 'pro' && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{tier.label}</CardTitle>
              <div className="text-2xl font-bold">{tier.price}</div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {featureConfigs.map((feature) => {
                  const hasAccess = checkFeatureAccess(feature.key, tier.tier)
                  const Icon = hasAccess ? CheckCircle : XCircle
                  
                  return (
                    <div 
                      key={feature.key}
                      className="flex items-center gap-3 text-sm"
                    >
                      <Icon className={cn(
                        'h-4 w-4',
                        hasAccess ? 'text-green-500' : 'text-gray-400'
                      )} />
                      <span className={cn(
                        hasAccess ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {feature.name}
                      </span>
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-6">
                <Button 
                  className="w-full"
                  variant={tier.tier === currentTier ? 'outline' : 'default'}
                  disabled={tier.tier === currentTier}
                >
                  {tier.tier === currentTier ? 'Current Plan' : `Choose ${tier.label}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}