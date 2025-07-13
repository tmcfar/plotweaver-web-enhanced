'use client'

import React, { useState, useEffect } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  MapPin,
  Users,
  Calendar,
  Zap,
  RefreshCw,
  Filter,
  Search,
  Eye,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface ContinuityIssue {
  id: string
  type: 'character' | 'plot' | 'timeline' | 'setting' | 'physics' | 'logic'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'investigating' | 'resolved' | 'ignored'
  title: string
  description: string
  evidence: string[]
  locations: {
    chapter: string
    section?: string
    paragraph?: number
    text?: string
  }[]
  detectedAt: Date
  resolvedAt?: Date
  lockId?: string
  suggestedFix?: string
  impact: number // 1-10 scale
}

interface ContinuityCheck {
  id: string
  type: 'automatic' | 'manual' | 'lock-triggered'
  status: 'running' | 'completed' | 'failed'
  startedAt: Date
  completedAt?: Date
  issuesFound: number
  progress: number
}

interface ContinuityPanelProps {
  projectId: string
  issues: ContinuityIssue[]
  checks: ContinuityCheck[]
  onResolveIssue?: (issueId: string, resolution: string) => void
  onIgnoreIssue?: (issueId: string) => void
  onRunCheck?: (type?: string) => void
  onViewLocation?: (location: ContinuityIssue['locations'][0]) => void
  className?: string
}

const issueTypeConfig = {
  character: { 
    icon: Users, 
    color: 'text-blue-500', 
    bgColor: 'bg-blue-50',
    label: 'Character',
    description: 'Character inconsistencies'
  },
  plot: { 
    icon: ArrowRight, 
    color: 'text-green-500', 
    bgColor: 'bg-green-50',
    label: 'Plot',
    description: 'Plot contradictions'
  },
  timeline: { 
    icon: Calendar, 
    color: 'text-purple-500', 
    bgColor: 'bg-purple-50',
    label: 'Timeline',
    description: 'Temporal inconsistencies'
  },
  setting: { 
    icon: MapPin, 
    color: 'text-orange-500', 
    bgColor: 'bg-orange-50',
    label: 'Setting',
    description: 'Location/environment issues'
  },
  physics: { 
    icon: Zap, 
    color: 'text-yellow-500', 
    bgColor: 'bg-yellow-50',
    label: 'Physics',
    description: 'Physical impossibilities'
  },
  logic: { 
    icon: AlertTriangle, 
    color: 'text-red-500', 
    bgColor: 'bg-red-50',
    label: 'Logic',
    description: 'Logical contradictions'
  }
}

const severityConfig = {
  low: { color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Low', priority: 1 },
  medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Medium', priority: 2 },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'High', priority: 3 },
  critical: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Critical', priority: 4 }
}

const statusConfig = {
  open: { icon: AlertTriangle, color: 'text-red-500', label: 'Open' },
  investigating: { icon: Clock, color: 'text-yellow-500', label: 'Investigating' },
  resolved: { icon: CheckCircle, color: 'text-green-500', label: 'Resolved' },
  ignored: { icon: XCircle, color: 'text-gray-500', label: 'Ignored' }
}

export function ContinuityPanel({
  projectId,
  issues,
  checks,
  onResolveIssue,
  onIgnoreIssue,
  onRunCheck,
  onViewLocation,
  className
}: ContinuityPanelProps) {
  const [activeTab, setActiveTab] = useState('issues')
  const [filter, setFilter] = useState({
    type: '',
    severity: '',
    status: '',
    search: ''
  })
  const [sortBy, setSortBy] = useState<'severity' | 'impact' | 'detected' | 'type'>('severity')

  // Filter and sort issues
  const filteredIssues = issues
    .filter(issue => {
      if (filter.type && issue.type !== filter.type) return false
      if (filter.severity && issue.severity !== filter.severity) return false
      if (filter.status && issue.status !== filter.status) return false
      if (filter.search && !issue.title.toLowerCase().includes(filter.search.toLowerCase()) &&
          !issue.description.toLowerCase().includes(filter.search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'severity':
          return severityConfig[b.severity].priority - severityConfig[a.severity].priority
        case 'impact':
          return b.impact - a.impact
        case 'detected':
          return b.detectedAt.getTime() - a.detectedAt.getTime()
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return 0
      }
    })

  // Statistics
  const stats = {
    total: issues.length,
    open: issues.filter(i => i.status === 'open').length,
    critical: issues.filter(i => i.severity === 'critical').length,
    resolved: issues.filter(i => i.status === 'resolved').length
  }

  const runningChecks = checks.filter(check => check.status === 'running')
  const lastCheck = checks
    .filter(check => check.status === 'completed')
    .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())[0]

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <TooltipProvider>
      <Card className={cn('h-full flex flex-col', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Continuity
              {stats.open > 0 && (
                <Badge variant="destructive">{stats.open} issues</Badge>
              )}
            </CardTitle>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRunCheck?.()}
                disabled={runningChecks.length > 0}
              >
                {runningChecks.length > 0 ? (
                  <>
                    <Clock className="h-4 w-4 mr-1 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Check Now
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Status summary */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            <div className="text-center">
              <div className="text-lg font-semibold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">{stats.open}</div>
              <div className="text-xs text-muted-foreground">Open</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">{stats.critical}</div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{stats.resolved}</div>
              <div className="text-xs text-muted-foreground">Resolved</div>
            </div>
          </div>

          {lastCheck && (
            <div className="text-xs text-muted-foreground mt-2">
              Last check: {formatDate(lastCheck.completedAt!)} • {lastCheck.issuesFound} issues found
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="checks">Checks</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="issues" className="flex-1 space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Input
                  placeholder="Search issues..."
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  className="h-8"
                />
                
                <Select value={filter.type} onValueChange={(value) => setFilter(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {Object.entries(issueTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filter.severity} onValueChange={(value) => setFilter(prev => ({ ...prev, severity: value }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Severities</SelectItem>
                    {Object.entries(severityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="severity">Severity</SelectItem>
                    <SelectItem value="impact">Impact</SelectItem>
                    <SelectItem value="detected">Detected</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Issues list */}
              <ScrollArea className="flex-1">
                <div className="space-y-3">
                  {filteredIssues.map(issue => {
                    const typeConfig = issueTypeConfig[issue.type]
                    const issueSeverityConfig = severityConfig[issue.severity]
                    const issueStatusConfig = statusConfig[issue.status]
                    const TypeIcon = typeConfig.icon
                    const StatusIcon = issueStatusConfig.icon

                    return (
                      <div
                        key={issue.id}
                        className={cn(
                          'border rounded-lg p-3 transition-colors',
                          typeConfig.bgColor,
                          issue.severity === 'critical' && 'border-red-300',
                          issue.status === 'resolved' && 'opacity-60'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2 mt-1">
                            <TypeIcon className={cn('h-4 w-4', typeConfig.color)} />
                            <StatusIcon className={cn('h-4 w-4', issueStatusConfig.color)} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">{issue.title}</h4>
                              <Badge variant="outline" className={cn('text-xs', issueSeverityConfig.color, issueSeverityConfig.bgColor)}>
                                {issueSeverityConfig.label}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Impact: {issue.impact}/10
                              </Badge>
                            </div>

                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {issue.description}
                            </p>

                            {/* Locations */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-muted-foreground">Found in:</span>
                              {issue.locations.slice(0, 3).map((location, idx) => (
                                <Button
                                  key={idx}
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 px-2 text-xs"
                                  onClick={() => onViewLocation?.(location)}
                                >
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {location.chapter}
                                  {location.section && ` • ${location.section}`}
                                </Button>
                              ))}
                              {issue.locations.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{issue.locations.length - 3} more
                                </span>
                              )}
                            </div>

                            {/* Suggested fix */}
                            {issue.suggestedFix && (
                              <div className="bg-muted/50 rounded p-2 mb-2">
                                <span className="text-xs font-medium">Suggested fix:</span>
                                <p className="text-xs text-muted-foreground mt-1">{issue.suggestedFix}</p>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="text-xs text-muted-foreground">
                                Detected {formatDate(issue.detectedAt)}
                                {issue.lockId && (
                                  <span className="ml-2 text-blue-600">• Lock violation</span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                {issue.status === 'open' && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 text-xs"
                                      onClick={() => onResolveIssue?.(issue.id, 'manual')}
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Resolve
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-xs"
                                      onClick={() => onIgnoreIssue?.(issue.id)}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Ignore
                                    </Button>
                                  </>
                                )}

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onViewLocation?.(issue.locations[0])}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Location
                                    </DropdownMenuItem>
                                    {issue.evidence.length > 0 && (
                                      <DropdownMenuItem>
                                        <Search className="h-4 w-4 mr-2" />
                                        View Evidence
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {filteredIssues.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">No continuity issues found</p>
                      <p className="text-xs">Your story appears to be consistent!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="checks" className="flex-1">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {checks.map(check => (
                    <div key={check.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm capitalize">{check.type}</span>
                          <Badge variant={check.status === 'running' ? 'default' : 'secondary'}>
                            {check.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(check.startedAt)}
                        </span>
                      </div>

                      {check.status === 'running' && (
                        <div className="space-y-1 mb-2">
                          <div className="flex items-center justify-between text-xs">
                            <span>Progress</span>
                            <span>{check.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-primary h-1 rounded-full transition-all duration-300" 
                              style={{ width: `${check.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {check.status === 'completed' && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Found </span>
                          <span className="font-medium">{check.issuesFound}</span>
                          <span className="text-muted-foreground"> issues</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {checks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">No checks have been run yet</p>
                      <p className="text-xs">Run a continuity check to scan for issues</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="insights" className="flex-1">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Issue Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(issueTypeConfig).map(([type, config]) => {
                        const count = issues.filter(i => i.type === type).length
                        const percentage = issues.length > 0 ? (count / issues.length) * 100 : 0
                        
                        return (
                          <div key={type} className="flex items-center gap-3">
                            <config.icon className={cn('h-4 w-4', config.color)} />
                            <span className="text-sm flex-1">{config.label}</span>
                            <span className="text-xs text-muted-foreground">{count}</span>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {stats.critical > 0 && (
                        <div className="flex items-start gap-2 text-red-600">
                          <AlertTriangle className="h-4 w-4 mt-0.5" />
                          <span>Address {stats.critical} critical issues immediately</span>
                        </div>
                      )}
                      {issues.filter(i => i.type === 'character').length > 2 && (
                        <div className="flex items-start gap-2 text-blue-600">
                          <Users className="h-4 w-4 mt-0.5" />
                          <span>Consider creating character consistency locks</span>
                        </div>
                      )}
                      {issues.filter(i => i.type === 'timeline').length > 1 && (
                        <div className="flex items-start gap-2 text-purple-600">
                          <Calendar className="h-4 w-4 mt-0.5" />
                          <span>Timeline issues detected - review chronology</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}