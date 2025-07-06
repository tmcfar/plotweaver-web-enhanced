'use client'

import React, { useState } from 'react'
import { 
  X, 
  Target, 
  Calendar, 
  Tag, 
  Users, 
  BarChart3,
  Clock,
  FileText,
  Lightbulb
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface PropertiesPanelProps {
  projectId: string
  onClose: () => void
}

// Mock data - this would come from your API/state
const mockProjectData = {
  title: 'The Secrets of Elderbrook',
  genre: 'Mystery/Fantasy',
  targetWordCount: 80000,
  currentWordCount: 12543,
  deadline: '2024-03-15',
  tags: ['mystery', 'small-town', 'supernatural', 'family-secrets'],
  characters: [
    { id: '1', name: 'Sarah Chen', role: 'Protagonist' },
    { id: '2', name: 'Margaret Whitfield', role: 'Mentor' },
    { id: '3', name: 'Dr. Harrison', role: 'Antagonist' },
  ],
  recentActivity: [
    { timestamp: '2024-01-15T10:30:00Z', action: 'Added 1,245 words to Chapter 1' },
    { timestamp: '2024-01-15T09:15:00Z', action: 'Created character profile for Margaret' },
    { timestamp: '2024-01-14T16:45:00Z', action: 'Updated story outline' },
  ]
}

export function PropertiesPanel({ projectId, onClose }: PropertiesPanelProps) {
  const [projectData] = useState(mockProjectData)
  const [activeTab, setActiveTab] = useState('overview')

  const progressPercentage = (projectData.currentWordCount / projectData.targetWordCount) * 100
  const wordsRemaining = projectData.targetWordCount - projectData.currentWordCount
  const daysUntilDeadline = Math.ceil(
    (new Date(projectData.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Properties</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-2">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="progress" className="text-xs">Progress</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
          </TabsList>

          <div className="p-4">
            <TabsContent value="overview" className="space-y-4 mt-0">
              {/* Project Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Project Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="title" className="text-xs">Title</Label>
                    <Input 
                      id="title" 
                      value={projectData.title} 
                      className="h-8 text-sm"
                      readOnly
                    />
                  </div>
                  <div>
                    <Label htmlFor="genre" className="text-xs">Genre</Label>
                    <Input 
                      id="genre" 
                      value={projectData.genre} 
                      className="h-8 text-sm"
                      readOnly
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {projectData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag className="h-2 w-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Characters */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Characters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {projectData.characters.map((character) => (
                    <div key={character.id} className="flex items-center justify-between">
                      <span className="text-sm">{character.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {character.role}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {projectData.recentActivity.map((activity, index) => (
                    <div key={index} className="text-xs">
                      <div className="text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-foreground">{activity.action}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progress" className="space-y-4 mt-0">
              {/* Word Count Progress */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Word Count Goal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {projectData.currentWordCount.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      of {projectData.targetWordCount.toLocaleString()} words
                    </div>
                  </div>
                  
                  <Progress value={progressPercentage} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="text-center">
                      <div className="font-medium text-green-600">
                        {Math.round(progressPercentage)}%
                      </div>
                      <div className="text-muted-foreground">Complete</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-orange-600">
                        {wordsRemaining.toLocaleString()}
                      </div>
                      <div className="text-muted-foreground">Remaining</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Deadline */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Deadline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {new Date(projectData.deadline).toLocaleDateString()}
                    </div>
                    <div className={`text-sm ${
                      daysUntilDeadline < 30 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {daysUntilDeadline} days remaining
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-xs text-muted-foreground text-center">
                    Daily target: {Math.ceil(wordsRemaining / daysUntilDeadline)} words
                  </div>
                </CardContent>
              </Card>

              {/* Writing Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Writing Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="font-medium">7 days</div>
                      <div className="text-muted-foreground">Current streak</div>
                    </div>
                    <div>
                      <div className="font-medium">485</div>
                      <div className="text-muted-foreground">Avg. daily</div>
                    </div>
                    <div>
                      <div className="font-medium">12</div>
                      <div className="text-muted-foreground">Sessions</div>
                    </div>
                    <div>
                      <div className="font-medium">18h</div>
                      <div className="text-muted-foreground">Total time</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Quick Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add notes about your project, character development, plot ideas, or anything else..."
                    className="min-h-[200px] text-sm resize-none"
                  />
                </CardContent>
              </Card>
              
              <Button size="sm" className="w-full">
                Save Notes
              </Button>
            </TabsContent>
          </div>
        </Tabs>
      </ScrollArea>
    </div>
  )
}