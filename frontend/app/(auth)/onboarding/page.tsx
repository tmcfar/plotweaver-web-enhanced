'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Logo from '@/components/brand/Logo'

const WRITING_MODES = [
  {
    id: 'professional-writer',
    name: 'Professional Writer',
    description: 'Full control with AI assistance',
    features: ['Manual control', 'Advanced features', 'Git operations', 'Full customization'],
    icon: '✍️',
  },
  {
    id: 'ai-first',
    name: 'AI-First Creation',
    description: 'Let AI lead the creative process',
    features: ['Auto-generation', 'Simplified UI', 'Quick results', 'Smart suggestions'],
    icon: '🤖',
  },
  {
    id: 'editor',
    name: 'Editor & Reviewer',
    description: 'Review and annotate content',
    features: ['Read-only mode', 'Annotations', 'Reports', 'Collaboration'],
    icon: '📝',
  },
  {
    id: 'hobbyist',
    name: 'Creative Explorer',
    description: 'Fun, casual writing experience',
    features: ['Gamification', 'Templates', 'Community', 'Simple tools'],
    icon: '🎨',
  },
]

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedMode, setSelectedMode] = useState<string>('')
  const [preferences, setPreferences] = useState({
    writingGoals: '',
    experience: '',
    genres: [] as string[],
  })

  const handleComplete = async () => {
    // Save user preferences
    await user?.update({
      unsafeMetadata: {
        writingMode: selectedMode,
        preferences: preferences,
        onboardingComplete: true,
      },
    })
    
    router.push('/dashboard')
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <Logo size="xl" className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome to PlotWeaver, {user?.firstName}!
            </h1>
            <p className="text-muted-foreground">
              Let's set up your writing experience. How do you want to write today?
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {WRITING_MODES.map((mode) => (
              <Card 
                key={mode.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedMode === mode.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedMode(mode.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{mode.icon}</span>
                    {mode.name}
                  </CardTitle>
                  <CardDescription>{mode.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {mode.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <span className="text-green-500">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center mt-8">
            <Button 
              onClick={() => setStep(2)}
              disabled={!selectedMode}
              size="lg"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <Card>
            <CardHeader>
              <CardTitle>Tell us about your writing</CardTitle>
              <CardDescription>
                This helps us customize your experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-foreground">
                  What are your writing goals?
                </label>
                <Input
                  placeholder="e.g., Write a novel, improve my skills, have fun..."
                  value={preferences.writingGoals}
                  onChange={(e) => setPreferences(prev => ({ ...prev, writingGoals: e.target.value }))}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  How would you describe your writing experience?
                </label>
                <Input
                  placeholder="e.g., Beginner, intermediate, professional..."
                  value={preferences.experience}
                  onChange={(e) => setPreferences(prev => ({ ...prev, experience: e.target.value }))}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-4">
                <Button onClick={() => setStep(1)} variant="outline">
                  Back
                </Button>
                <Button onClick={handleComplete} className="flex-1">
                  Complete Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}