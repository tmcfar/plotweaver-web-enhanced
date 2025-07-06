'use client'

import React, { useState } from 'react'
import { 
  PenTool, 
  GitBranch, 
  BarChart3, 
  Settings, 
  Lock, 
  FileText, 
  Clock, 
  Target,
  TrendingUp,
  Book,
  Layers,
  GitCommit,
  Archive,
  Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface ProfessionalWriterProps {
  projectId: string
  className?: string
}

// Mock data - would come from API/hooks
const mockData = {
  projectStats: {
    totalWords: 85432,
    targetWords: 120000,
    pagesWritten: 341,
    averageWordsPerDay: 1247,
    writingStreak: 12,
    productivity: 87
  },
  locks: {
    total: 23,
    active: 18,
    violated: 2,
    critical: 1
  },
  gitStats: {
    commits: 156,
    branches: 4,
    uncommittedChanges: 3,
    lastCommit: '2 hours ago'
  },
  recentSessions: [
    { date: '2024-01-15', words: 2341, duration: '3h 45m', efficiency: 92 },
    { date: '2024-01-14', words: 1876, duration: '2h 30m', efficiency: 88 },
    { date: '2024-01-13', words: 3102, duration: '4h 15m', efficiency: 95 },
  ],
  chapters: [
    { id: '1', title: 'The Beginning', words: 4523, status: 'completed', locks: 3 },
    { id: '2', title: 'Rising Action', words: 6234, status: 'in-progress', locks: 5 },
    { id: '3', title: 'The Twist', words: 1245, status: 'draft', locks: 1 },
  ]
}

export function ProfessionalWriter({ projectId, className }: ProfessionalWriterProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const { projectStats, locks, gitStats, recentSessions, chapters } = mockData

  const completionPercentage = (projectStats.totalWords / projectStats.targetWords) * 100
  const wordsRemaining = projectStats.targetWords - projectStats.totalWords

  return (
    <div className={cn('h-full flex flex-col space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Professional Dashboard</h1>
          <p className="text-muted-foreground">Advanced controls and detailed analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <GitCommit className="h-4 w-4 mr-2" />
            Commit Changes
          </Button>
          <Button variant="outline" size="sm">
            <Archive className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Advanced Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Word Count</CardTitle>
            <PenTool className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.totalWords.toLocaleString()}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                of {projectStats.targetWords.toLocaleString()} target
              </span>
              <Badge variant="secondary" className="text-xs">
                {Math.round(completionPercentage)}%
              </Badge>
            </div>
            <Progress value={completionPercentage} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Story Locks</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locks.active}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">Active</span>
              {locks.violated > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {locks.violated} violated
                </Badge>
              )}
              {locks.critical > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {locks.critical} critical
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Git Status</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gitStats.commits}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">commits</span>
              {gitStats.uncommittedChanges > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {gitStats.uncommittedChanges} uncommitted
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.averageWordsPerDay}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">words/day avg</span>
              <Badge 
                variant={projectStats.productivity > 80 ? "default" : "secondary"} 
                className="text-xs"
              >
                {projectStats.productivity}% efficiency
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="locks">Lock Management</TabsTrigger>
            <TabsTrigger value="git">Version Control</TabsTrigger>
            <TabsTrigger value="export">Export Tools</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden mt-6">
            <TabsContent value="overview" className="h-full space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {/* Writing Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Writing Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current Progress</span>
                        <span>{Math.round(completionPercentage)}%</span>
                      </div>
                      <Progress value={completionPercentage} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {wordsRemaining.toLocaleString()} words remaining
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-blue-600">
                          {projectStats.writingStreak}
                        </div>
                        <div className="text-xs text-muted-foreground">Day Streak</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-green-600">
                          {projectStats.pagesWritten}
                        </div>
                        <div className="text-xs text-muted-foreground">Pages</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Daily Target</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          To finish on time: {Math.ceil(wordsRemaining / 30)} words/day
                        </span>
                        <Badge variant="outline" className="text-xs">
                          30 days left
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Chapter Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Book className="h-5 w-5" />
                      Chapter Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {chapters.map((chapter) => (
                          <div key={chapter.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">{chapter.title}</h4>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={chapter.status === 'completed' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {chapter.status}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  <Lock className="h-3 w-3 mr-1" />
                                  {chapter.locks}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{chapter.words.toLocaleString()} words</span>
                              <Button variant="ghost" size="sm" className="h-6 text-xs">
                                Edit
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="h-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Sessions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Writing Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentSessions.map((session, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium text-sm">{session.date}</div>
                            <div className="text-xs text-muted-foreground">
                              {session.words} words in {session.duration}
                            </div>
                          </div>
                          <Badge 
                            variant={session.efficiency > 90 ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {session.efficiency}% efficiency
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Productivity Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Productivity Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="border rounded-lg p-3">
                        <div className="text-lg font-semibold text-blue-600">
                          {projectStats.averageWordsPerDay}
                        </div>
                        <div className="text-xs text-muted-foreground">Avg Words/Day</div>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="text-lg font-semibold text-green-600">
                          {projectStats.writingStreak}
                        </div>
                        <div className="text-xs text-muted-foreground">Current Streak</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Performance Insights</h4>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div>• Best writing time: 9:00 AM - 11:00 AM</div>
                        <div>• Most productive day: Tuesday</div>
                        <div>• Average session: 2h 45m</div>
                        <div>• Words per hour: 453</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="locks" className="h-full">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Advanced Lock Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Lock Management Panel</p>
                    <p className="text-xs">Full lock controls and violation tracking</p>
                    <Button className="mt-4" variant="outline">
                      Open Lock Manager
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="git" className="h-full">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Version Control
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Current Branch</span>
                          <Badge variant="default">main</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {gitStats.commits} commits • Last: {gitStats.lastCommit}
                        </div>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Uncommitted</span>
                          <Badge variant="secondary">{gitStats.uncommittedChanges}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Changes ready to commit
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <GitCommit className="h-4 w-4 mr-2" />
                        Commit Changes
                      </Button>
                      <Button variant="outline" size="sm">
                        <GitBranch className="h-4 w-4 mr-2" />
                        New Branch
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Pull
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="h-full">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Export & Publishing Tools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <h4 className="font-medium text-sm mb-1">PDF Export</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Professional formatted PDF
                      </p>
                      <Button size="sm" variant="outline" className="w-full">
                        Export PDF
                      </Button>
                    </div>

                    <div className="border rounded-lg p-4 text-center">
                      <Book className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <h4 className="font-medium text-sm mb-1">EPUB</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        E-book format
                      </p>
                      <Button size="sm" variant="outline" className="w-full">
                        Export EPUB
                      </Button>
                    </div>

                    <div className="border rounded-lg p-4 text-center">
                      <Archive className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <h4 className="font-medium text-sm mb-1">Word Document</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Microsoft Word format
                      </p>
                      <Button size="sm" variant="outline" className="w-full">
                        Export DOCX
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}