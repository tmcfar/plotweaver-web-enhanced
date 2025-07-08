'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NoProjectsState } from '@/components/design-system/empty-states'
import { InlineLoading } from '@/components/design-system/loading-states'
import { CreateProjectWizard } from '@/components/projects/CreateProjectWizard'
import { ProjectStats } from '@/components/projects/ProjectStats'
import {
  WritingIcon,
  AIIcon,
  CollaborationIcon
} from '@/components/design-system/icons'

// Helper hook for conditional clerk usage
function useClerkUserSafe() {
  const isDevelopment = process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  if (isDevelopment) {
    return {
      user: {
        firstName: 'Developer',
        lastName: 'User',
        email: 'dev@plotweaver.local'
      }
    };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useUser } = require('@clerk/nextjs');
    return useUser();
  } catch {
    return {
      user: {
        firstName: 'Developer',
        lastName: 'User',
        email: 'dev@plotweaver.local'
      }
    };
  }
}

export default function DashboardPage() {
  const [showCreateWizard, setShowCreateWizard] = useState(false)
  const { user } = useClerkUserSafe();

  const handleCreateProject = () => {
    setShowCreateWizard(true)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.firstName || 'Writer'}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Ready to weave some plots? Let's get started.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="writing">Writing</TabsTrigger>
          <TabsTrigger value="ai">AI Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <ProjectStats />

          {/* Writing Goal Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Writing Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">0 / 500 words</span>
                </div>
                <Progress value={0} className="w-full" />
                <p className="text-xs text-muted-foreground">
                  Set a daily writing goal to build consistent habits
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button
                  onClick={handleCreateProject}
                  className="h-auto p-4 flex flex-col items-start"
                >
                  <WritingIcon size={24} className="mb-2" />
                  <span className="font-medium">New Project</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Start a fresh story
                  </span>
                </Button>

                <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                  <AIIcon size={24} className="mb-2" />
                  <span className="font-medium">AI Brainstorm</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Generate ideas
                  </span>
                </Button>

                <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                  <CollaborationIcon size={24} className="mb-2" />
                  <span className="font-medium">Invite Collaborator</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Work together
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <NoProjectsState onCreateProject={handleCreateProject} />
        </TabsContent>

        <TabsContent value="writing">
          <Card>
            <CardHeader>
              <CardTitle>Writing Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Character Generator</h4>
                    <p className="text-sm text-muted-foreground">Create detailed character profiles</p>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Plot Outline</h4>
                    <p className="text-sm text-muted-foreground">Structure your story beats</p>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Scene Editor</h4>
                    <p className="text-sm text-muted-foreground">Write and edit individual scenes</p>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AIIcon size={20} />
                  AI Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">GPT-4</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Ready
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Claude</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Ready
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Story Analysis</span>
                    <InlineLoading size="sm" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Generations</span>
                      <span>0 / 100</span>
                    </div>
                    <Progress value={0} className="mt-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Tokens</span>
                      <span>0 / 10,000</span>
                    </div>
                    <Progress value={0} className="mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Project Wizard */}
      <CreateProjectWizard
        open={showCreateWizard}
        onOpenChange={setShowCreateWizard}
      />
    </div>
  )
}