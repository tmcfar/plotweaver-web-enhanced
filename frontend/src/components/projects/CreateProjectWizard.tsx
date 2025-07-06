'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WritingIcon, AIIcon, CollaborationIcon, ProgressIcon } from '@/components/design-system/icons'
import { useCreateProject, useProjectTemplates } from '@/hooks/useProjects'
import { InlineLoading } from '@/components/design-system/loading-states'
import type { Project, ProjectTemplate, CreateProjectRequest } from '@/types/project'

interface CreateProjectWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormData {
  title: string
  description: string
  genre: string
  writingMode: Project['writingMode']
  templateId?: string
  targetWordCount?: number
  tags: string[]
}

const initialFormData: FormData = {
  title: '',
  description: '',
  genre: '',
  writingMode: 'professional-writer',
  tags: [],
}

const genres = [
  'Fiction',
  'Non-fiction',
  'Fantasy',
  'Science Fiction',
  'Mystery',
  'Romance',
  'Thriller',
  'Horror',
  'Historical Fiction',
  'Young Adult',
  'Children\'s',
  'Biography',
  'Memoir',
  'Self-Help',
  'Business',
  'Technical',
  'Other'
]

const writingModes: { 
  value: Project['writingMode']
  title: string
  description: string
  icon: React.ReactNode
  features: string[]
}[] = [
  {
    value: 'professional-writer',
    title: 'Professional Writer',
    description: 'Full control with AI assistance',
    icon: <WritingIcon size={24} />,
    features: ['Manual control', 'Advanced features', 'Git operations', 'Full customization']
  },
  {
    value: 'ai-first',
    title: 'AI-First Creation',
    description: 'Let AI lead the creative process',
    icon: <AIIcon size={24} />,
    features: ['Auto-generation', 'Simplified UI', 'Quick results', 'Smart suggestions']
  },
  {
    value: 'editor',
    title: 'Editor & Reviewer',
    description: 'Review and annotate content',
    icon: <CollaborationIcon size={24} />,
    features: ['Read-only mode', 'Annotations', 'Reports', 'Collaboration']
  },
  {
    value: 'hobbyist',
    title: 'Creative Explorer',
    description: 'Fun, casual writing experience',
    icon: <ProgressIcon size={24} />,
    features: ['Gamification', 'Templates', 'Community', 'Simple tools']
  }
]

export function CreateProjectWizard({ open, onOpenChange }: CreateProjectWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  
  const { data: templates = [] } = useProjectTemplates()
  const createProject = useCreateProject()

  const steps = [
    { title: 'Choose Mode', description: 'Select your writing style' },
    { title: 'Project Details', description: 'Basic information' },
    { title: 'Story Setup', description: 'Genre and structure' },
    { title: 'Review', description: 'Confirm your project' }
  ]

  const selectedTemplate = templates.find(t => t.id === formData.templateId)

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    }
  }

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleCreate = async () => {
    const projectData: CreateProjectRequest = {
      title: formData.title,
      description: formData.description || undefined,
      genre: formData.genre,
      writingMode: formData.writingMode,
      templateId: formData.templateId,
      targetWordCount: formData.targetWordCount,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
    }

    createProject.mutate(projectData, {
      onSuccess: (project) => {
        onOpenChange(false)
        setStep(0)
        setFormData(initialFormData)
        router.push(`/projects/${project.id}`)
      }
    })
  }

  const canProceed = () => {
    switch (step) {
      case 0:
        return !!formData.writingMode
      case 1:
        return formData.title.trim().length > 0
      case 2:
        return !!formData.genre
      case 3:
        return true
      default:
        return false
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">How do you want to write?</h3>
              <p className="text-muted-foreground">
                Choose the writing mode that best fits your style and goals.
              </p>
            </div>
            
            <div className="grid gap-4">
              {writingModes.map((mode) => (
                <Card 
                  key={mode.value}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    formData.writingMode === mode.value ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, writingMode: mode.value }))}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-primary">{mode.icon}</div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{mode.title}</CardTitle>
                        <CardDescription>{mode.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {mode.features.map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Project Details</h3>
              <p className="text-muted-foreground">
                Give your project a name and description.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project Title *</label>
                <Input
                  placeholder="My Amazing Novel"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  placeholder="A brief description of your project..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Story Setup</h3>
              <p className="text-muted-foreground">
                Choose your genre and set optional goals.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Genre *</label>
                <Select 
                  value={formData.genre} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Target Word Count (Optional)</label>
                <Input
                  type="number"
                  placeholder="80000"
                  value={formData.targetWordCount || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    targetWordCount: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  className="mt-1"
                />
              </div>

              {templates.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Template (Optional)</label>
                  <Select 
                    value={formData.templateId || ''} 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      templateId: value || undefined 
                    }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No template</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTemplate && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedTemplate.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Review & Create</h3>
              <p className="text-muted-foreground">
                Review your project details before creating.
              </p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>{formData.title}</CardTitle>
                {formData.description && (
                  <CardDescription>{formData.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Writing Mode</span>
                  <Badge variant="outline">
                    {writingModes.find(m => m.value === formData.writingMode)?.title}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Genre</span>
                  <span className="text-sm text-muted-foreground">{formData.genre}</span>
                </div>
                {formData.targetWordCount && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Target Word Count</span>
                    <span className="text-sm text-muted-foreground">
                      {formData.targetWordCount.toLocaleString()} words
                    </span>
                  </div>
                )}
                {selectedTemplate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Template</span>
                    <span className="text-sm text-muted-foreground">{selectedTemplate.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Step {step + 1} of {steps.length}: {steps[step].description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={((step + 1) / steps.length) * 100} />
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map((stepInfo, index) => (
              <span 
                key={index}
                className={index <= step ? 'text-foreground font-medium' : ''}
              >
                {stepInfo.title}
              </span>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="py-6">
          {renderStepContent()}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={step === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-2">
            {step === steps.length - 1 ? (
              <Button 
                onClick={handleCreate}
                disabled={!canProceed() || createProject.isPending}
              >
                {createProject.isPending ? (
                  <InlineLoading size="sm" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Project
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}