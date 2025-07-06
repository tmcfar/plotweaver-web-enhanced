'use client'

import React, { useState } from 'react'
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  User, 
  Bot, 
  Edit, 
  Gamepad2,
  Target,
  Sparkles,
  BookOpen,
  Settings,
  Crown,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { ModeSetType } from './ModeSetSwitcher'

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void
  onSkip?: () => void
  className?: string
}

export interface OnboardingData {
  selectedMode: ModeSetType
  writingGoals: string[]
  experience: string
  projectType: string
  writingFrequency: string
  interests: string[]
  preferences: {
    notifications: boolean
    aiAssistance: boolean
    collaboration: boolean
    analytics: boolean
  }
}

const steps = [
  'Welcome',
  'Writing Mode',
  'Goals & Experience',
  'Project Setup',
  'Preferences',
  'Complete'
]

export function OnboardingFlow({ onComplete, onSkip, className }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    selectedMode: 'professional',
    writingGoals: [],
    interests: [],
    preferences: {
      notifications: true,
      aiAssistance: true,
      collaboration: false,
      analytics: true
    }
  })

  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete(formData as OnboardingData)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateFormData = (updates: Partial<OnboardingData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep />
      case 1:
        return (
          <ModeSelectionStep 
            selected={formData.selectedMode || 'professional'}
            onSelect={(mode) => updateFormData({ selectedMode: mode })}
          />
        )
      case 2:
        return (
          <GoalsExperienceStep 
            goals={formData.writingGoals || []}
            experience={formData.experience || ''}
            onUpdate={(goals, experience) => updateFormData({ writingGoals: goals, experience })}
          />
        )
      case 3:
        return (
          <ProjectSetupStep 
            projectType={formData.projectType || ''}
            writingFrequency={formData.writingFrequency || ''}
            interests={formData.interests || []}
            onUpdate={(projectType, writingFrequency, interests) => 
              updateFormData({ projectType, writingFrequency, interests })
            }
          />
        )
      case 4:
        return (
          <PreferencesStep 
            preferences={formData.preferences || {
              notifications: true,
              aiAssistance: true,
              collaboration: false,
              analytics: true
            }}
            onUpdate={(preferences) => updateFormData({ preferences })}
          />
        )
      case 5:
        return <CompletionStep selectedMode={formData.selectedMode || 'professional'} />
      default:
        return null
    }
  }

  return (
    <div className={cn('max-w-2xl mx-auto p-6', className)}>
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Welcome to PlotWeaver</h1>
          {onSkip && (
            <Button variant="ghost" onClick={onSkip}>
              Skip Setup
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <p className="text-muted-foreground mt-2">
          {steps[currentStep]}
        </p>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <Button onClick={handleNext}>
          {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next Step'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// Step Components
function WelcomeStep() {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-xl">Welcome to PlotWeaver</CardTitle>
        <CardDescription>
          Let's set up your perfect writing environment in just a few steps
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium text-sm">AI-Powered Writing</div>
                <div className="text-xs text-muted-foreground">Generate and enhance content</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium text-sm">Story Consistency</div>
                <div className="text-xs text-muted-foreground">Maintain plot continuity</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <User className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-medium text-sm">Collaboration</div>
                <div className="text-xs text-muted-foreground">Work with other writers</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Settings className="h-5 w-5 text-purple-500" />
              <div>
                <div className="font-medium text-sm">Customizable</div>
                <div className="text-xs text-muted-foreground">Tailored to your workflow</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ModeSelectionStep({ selected, onSelect }: { 
  selected: ModeSetType
  onSelect: (mode: ModeSetType) => void 
}) {
  const modes = [
    {
      id: 'professional' as ModeSetType,
      label: 'Professional Writer',
      description: 'Advanced controls and detailed analytics',
      icon: User,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      features: ['Advanced lock management', 'Git integration', 'Detailed analytics']
    },
    {
      id: 'ai-first' as ModeSetType,
      label: 'AI-First',
      description: 'Simplified AI-powered writing',
      icon: Bot,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      features: ['One-click generation', 'Smart suggestions', 'Auto-completion']
    },
    {
      id: 'editor' as ModeSetType,
      label: 'Editor',
      description: 'Read-only with annotation tools',
      icon: Edit,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      features: ['Annotation tools', 'Track changes', 'Review workflow']
    },
    {
      id: 'hobbyist' as ModeSetType,
      label: 'Hobbyist',
      description: 'Gamified writing experience',
      icon: Gamepad2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      features: ['Achievement system', 'Daily goals', 'Community features']
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Your Writing Mode</CardTitle>
        <CardDescription>
          Select the mode that best matches your writing style and needs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selected} onValueChange={onSelect}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modes.map((mode) => {
              const Icon = mode.icon
              return (
                <Label 
                  key={mode.id}
                  htmlFor={mode.id}
                  className="cursor-pointer"
                >
                  <div className={cn(
                    'border rounded-lg p-4 transition-all hover:shadow-md',
                    selected === mode.id && 'ring-2 ring-primary border-primary'
                  )}>
                    <div className="flex items-center gap-3 mb-3">
                      <RadioGroupItem value={mode.id} id={mode.id} />
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        mode.bgColor
                      )}>
                        <Icon className={cn('h-5 w-5', mode.color)} />
                      </div>
                      <div>
                        <div className="font-medium">{mode.label}</div>
                        <div className="text-xs text-muted-foreground">{mode.description}</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {mode.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="h-3 w-3" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </Label>
              )
            })}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  )
}

function GoalsExperienceStep({ 
  goals, 
  experience, 
  onUpdate 
}: { 
  goals: string[]
  experience: string
  onUpdate: (goals: string[], experience: string) => void 
}) {
  const goalOptions = [
    'Complete a novel',
    'Write short stories',
    'Improve writing skills',
    'Collaborate with others',
    'Build a writing habit',
    'Publish my work',
    'Write for fun',
    'Professional writing'
  ]

  const toggleGoal = (goal: string) => {
    const newGoals = goals.includes(goal)
      ? goals.filter(g => g !== goal)
      : [...goals, goal]
    onUpdate(newGoals, experience)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Writing Goals & Experience</CardTitle>
        <CardDescription>
          Help us understand what you want to achieve and your writing background
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-sm font-medium mb-3 block">
            What are your writing goals? (Select all that apply)
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {goalOptions.map((goal) => (
              <div key={goal} className="flex items-center space-x-2">
                <Checkbox 
                  id={goal}
                  checked={goals.includes(goal)}
                  onCheckedChange={() => toggleGoal(goal)}
                />
                <Label htmlFor={goal} className="text-sm cursor-pointer">
                  {goal}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="experience" className="text-sm font-medium mb-2 block">
            Writing Experience Level
          </Label>
          <Select value={experience} onValueChange={(value) => onUpdate(goals, value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select your experience level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner (Just starting out)</SelectItem>
              <SelectItem value="intermediate">Intermediate (Some experience)</SelectItem>
              <SelectItem value="advanced">Advanced (Experienced writer)</SelectItem>
              <SelectItem value="professional">Professional (Published author)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectSetupStep({ 
  projectType, 
  writingFrequency, 
  interests, 
  onUpdate 
}: { 
  projectType: string
  writingFrequency: string
  interests: string[]
  onUpdate: (projectType: string, writingFrequency: string, interests: string[]) => void 
}) {
  const interestOptions = [
    'Fantasy', 'Science Fiction', 'Mystery', 'Romance', 'Thriller',
    'Literary Fiction', 'Horror', 'Historical Fiction', 'Biography',
    'Non-fiction', 'Poetry', 'Screenwriting'
  ]

  const toggleInterest = (interest: string) => {
    const newInterests = interests.includes(interest)
      ? interests.filter(i => i !== interest)
      : [...interests, interest]
    onUpdate(projectType, writingFrequency, newInterests)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project & Writing Preferences</CardTitle>
        <CardDescription>
          Tell us about your writing habits and interests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="projectType" className="text-sm font-medium mb-2 block">
            What type of project are you working on?
          </Label>
          <Select value={projectType} onValueChange={(value) => onUpdate(value, writingFrequency, interests)}>
            <SelectTrigger>
              <SelectValue placeholder="Select project type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="novel">Novel</SelectItem>
              <SelectItem value="short-story">Short Story Collection</SelectItem>
              <SelectItem value="screenplay">Screenplay</SelectItem>
              <SelectItem value="non-fiction">Non-fiction Book</SelectItem>
              <SelectItem value="poetry">Poetry Collection</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="frequency" className="text-sm font-medium mb-2 block">
            How often do you write?
          </Label>
          <Select value={writingFrequency} onValueChange={(value) => onUpdate(projectType, value, interests)}>
            <SelectTrigger>
              <SelectValue placeholder="Select writing frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="few-times-week">A few times a week</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="sporadic">When inspiration strikes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">
            What genres interest you? (Select all that apply)
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {interestOptions.map((interest) => (
              <div key={interest} className="flex items-center space-x-2">
                <Checkbox 
                  id={interest}
                  checked={interests.includes(interest)}
                  onCheckedChange={() => toggleInterest(interest)}
                />
                <Label htmlFor={interest} className="text-sm cursor-pointer">
                  {interest}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PreferencesStep({ 
  preferences, 
  onUpdate 
}: { 
  preferences: OnboardingData['preferences']
  onUpdate: (preferences: OnboardingData['preferences']) => void 
}) {
  const updatePreference = (key: keyof OnboardingData['preferences'], value: boolean) => {
    onUpdate({ ...preferences, [key]: value })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize Your Experience</CardTitle>
        <CardDescription>
          Choose your preferences for notifications and features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Email Notifications</Label>
              <div className="text-xs text-muted-foreground">
                Get notified about writing reminders and updates
              </div>
            </div>
            <Checkbox 
              checked={preferences.notifications}
              onCheckedChange={(checked) => updatePreference('notifications', checked as boolean)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">AI Writing Assistance</Label>
              <div className="text-xs text-muted-foreground">
                Enable AI suggestions and generation features
              </div>
            </div>
            <Checkbox 
              checked={preferences.aiAssistance}
              onCheckedChange={(checked) => updatePreference('aiAssistance', checked as boolean)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Collaboration Features</Label>
              <div className="text-xs text-muted-foreground">
                Allow others to collaborate on your projects
              </div>
            </div>
            <Checkbox 
              checked={preferences.collaboration}
              onCheckedChange={(checked) => updatePreference('collaboration', checked as boolean)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Writing Analytics</Label>
              <div className="text-xs text-muted-foreground">
                Track your writing progress and patterns
              </div>
            </div>
            <Checkbox 
              checked={preferences.analytics}
              onCheckedChange={(checked) => updatePreference('analytics', checked as boolean)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CompletionStep({ selectedMode }: { selectedMode: ModeSetType }) {
  const modeLabels = {
    professional: 'Professional Writer',
    'ai-first': 'AI-First',
    editor: 'Editor',
    hobbyist: 'Hobbyist'
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-xl">You're All Set!</CardTitle>
        <CardDescription>
          Welcome to PlotWeaver. Your writing environment is ready.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">Your Selected Mode:</div>
            <Badge variant="default" className="text-sm">
              {modeLabels[selectedMode]}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">What's Next:</div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Create your first project
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Set up your writing goals
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Explore AI-powered features
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Start writing your story
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}