'use client'

import React from 'react'
import { TrendingUp, BookOpen, Target, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard } from '@/components/design-system/loading-states'
import { useProjectStats } from '@/hooks/useProjects'

export function ProjectStats() {
  const { data: stats, isLoading, error } = useProjectStats()

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Unable to load project statistics
          </p>
        </CardContent>
      </Card>
    )
  }

  const completionRate = stats.totalProjects > 0 
    ? (stats.completedProjects / stats.totalProjects) * 100 
    : 0

  const formatWordCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProjects}</div>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {stats.activeProjects} active
            </Badge>
            <Badge variant="outline" className="text-xs">
              {stats.completedProjects} completed
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Total Word Count */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Words</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatWordCount(stats.totalWordCount)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Across all projects
          </p>
        </CardContent>
      </Card>

      {/* Daily Average */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round(stats.averageWordsPerDay)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Words per day
          </p>
        </CardContent>
      </Card>

      {/* Current Streak */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Writing Streak</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.currentStreak || 0}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Days in a row
          </p>
        </CardContent>
      </Card>

      {/* Completion Rate */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Project Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Completed Projects</span>
              <span className="font-medium">
                {stats.completedProjects} of {stats.totalProjects}
              </span>
            </div>
            <Progress value={completionRate} className="h-2" />
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {stats.completedProjects}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {stats.activeProjects}
                </div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-600">
                  {stats.totalProjects - stats.activeProjects - stats.completedProjects}
                </div>
                <div className="text-xs text-muted-foreground">Draft</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}