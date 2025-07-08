'use client'

import React, { useState } from 'react'
import { 
  Trophy, 
  Star, 
  Target, 
  Flame, 
  Users, 
  Crown, 
  Medal, 
  Zap,
  BookOpen,
  PenTool,
  Calendar,
  TrendingUp,
  Gift,
  Sparkles,
  Award,
  Clock,
  MessageSquare,
  Heart
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface HobbyistProps {
  projectId: string
  className?: string
}

// Mock data for hobbyist experience
const mockData = {
  profile: {
    level: 12,
    xp: 8450,
    xpToNext: 1550,
    rank: 'Story Weaver',
    streak: 18,
    totalWords: 127456,
    storiesCompleted: 3
  },
  achievements: [
    { 
      id: '1', 
      title: 'First Chapter', 
      description: 'Complete your first chapter', 
      icon: BookOpen, 
      earned: true, 
      rarity: 'common',
      earnedDate: '2024-01-10'
    },
    { 
      id: '2', 
      title: 'Word Warrior', 
      description: 'Write 10,000 words', 
      icon: PenTool, 
      earned: true, 
      rarity: 'uncommon',
      earnedDate: '2024-01-12'
    },
    { 
      id: '3', 
      title: 'Daily Dedication', 
      description: 'Write for 7 days in a row', 
      icon: Calendar, 
      earned: true, 
      rarity: 'rare',
      earnedDate: '2024-01-15'
    },
    { 
      id: '4', 
      title: 'Marathon Writer', 
      description: 'Write 50,000 words', 
      icon: Target, 
      earned: false, 
      rarity: 'epic',
      progress: 0.67
    },
    { 
      id: '5', 
      title: 'Story Master', 
      description: 'Complete 5 stories', 
      icon: Crown, 
      earned: false, 
      rarity: 'legendary',
      progress: 0.6
    }
  ],
  challenges: [
    {
      id: '1',
      title: 'January Sprint',
      description: 'Write 25,000 words this month',
      progress: 18432,
      target: 25000,
      timeLeft: '12 days',
      reward: '500 XP + Epic Badge',
      participants: 1247
    },
    {
      id: '2',
      title: 'Character Creator',
      description: 'Create 5 detailed character profiles',
      progress: 3,
      target: 5,
      timeLeft: '20 days',
      reward: '300 XP + Character Master Badge',
      participants: 892
    }
  ],
  community: [
    {
      id: '1',
      author: 'WriteWizard',
      title: 'Just finished my first novel!',
      excerpt: 'After 6 months of writing, I finally completed my fantasy adventure...',
      likes: 127,
      comments: 23,
      timeAgo: '2 hours ago'
    },
    {
      id: '2',
      author: 'StoryTeller42',
      title: 'Tips for writing compelling dialogue',
      excerpt: 'Here are some techniques I\'ve learned for making conversations feel natural...',
      likes: 89,
      comments: 15,
      timeAgo: '5 hours ago'
    }
  ],
  dailyGoals: {
    wordsWritten: 847,
    wordsTarget: 1000,
    timeSpent: 45,
    timeTarget: 60,
    chaptersCompleted: 0,
    chaptersTarget: 1
  }
}

const rarityConfig = {
  common: { color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Common' },
  uncommon: { color: 'text-green-500', bgColor: 'bg-green-100', label: 'Uncommon' },
  rare: { color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Rare' },
  epic: { color: 'text-purple-500', bgColor: 'bg-purple-100', label: 'Epic' },
  legendary: { color: 'text-orange-500', bgColor: 'bg-orange-100', label: 'Legendary' }
}

export function Hobbyist({ projectId, className }: HobbyistProps) {
  const [showCelebration, setShowCelebration] = useState(false)
  const { profile, achievements, challenges, community, dailyGoals } = mockData

  const xpProgress = (profile.xp / (profile.xp + profile.xpToNext)) * 100
  const wordsProgress = (dailyGoals.wordsWritten / dailyGoals.wordsTarget) * 100
  const timeProgress = (dailyGoals.timeSpent / dailyGoals.timeTarget) * 100

  const triggerCelebration = () => {
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 3000)
  }

  return (
    <div className={cn('h-full flex flex-col space-y-6 relative', className)}>
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-300">
          <div className="bg-white rounded-lg p-8 text-center animate-in zoom-in duration-500">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-2xl font-bold mb-2">Achievement Unlocked!</h2>
            <p className="text-muted-foreground">You're on fire! 🔥</p>
          </div>
        </div>
      )}

      {/* Header with Profile */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{profile.rank}</h1>
                <p className="text-muted-foreground">Level {profile.level} Writer</p>
                <div className="flex items-center gap-2 mt-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">{profile.streak} day streak</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-600">{profile.xp.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">XP</div>
              <Progress value={xpProgress} className="w-32 h-2 mt-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {profile.xpToNext.toLocaleString()} XP to next level
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            Today's Goals
            <Badge variant="secondary" className="ml-auto">
              {Math.round((wordsProgress + timeProgress) / 2)}% Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Words Written</span>
                <span>{dailyGoals.wordsWritten} / {dailyGoals.wordsTarget}</span>
              </div>
              <Progress value={wordsProgress} className="h-2" />
              {wordsProgress >= 100 && (
                <Badge variant="default" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Goal Complete!
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Time Spent</span>
                <span>{dailyGoals.timeSpent} / {dailyGoals.timeTarget} min</span>
              </div>
              <Progress value={timeProgress} className="h-2" />
              {timeProgress >= 100 && (
                <Badge variant="default" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Goal Complete!
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Chapters</span>
                <span>{dailyGoals.chaptersCompleted} / {dailyGoals.chaptersTarget}</span>
              </div>
              <Progress value={(dailyGoals.chaptersCompleted / dailyGoals.chaptersTarget) * 100} className="h-2" />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={triggerCelebration} className="flex-1">
              <Zap className="h-4 w-4 mr-2" />
              Start Writing Session
            </Button>
            <Button variant="outline">
              <Gift className="h-4 w-4 mr-2" />
              Claim Rewards
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Achievements & Challenges */}
        <div className="space-y-6">
          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Achievements
                <Badge variant="secondary" className="ml-auto">
                  {achievements.filter(a => a.earned).length} / {achievements.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {achievements.map((achievement) => {
                    const AchievementIcon = achievement.icon
                    const rarity = rarityConfig[achievement.rarity]

                    return (
                      <div 
                        key={achievement.id}
                        className={cn(
                          'border rounded-lg p-3 transition-all',
                          achievement.earned 
                            ? 'border-yellow-200 bg-yellow-50/50' 
                            : 'border-gray-200 bg-gray-50/50 opacity-60'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            achievement.earned ? 'bg-yellow-100' : 'bg-gray-100'
                          )}>
                            <AchievementIcon className={cn(
                              'h-5 w-5',
                              achievement.earned ? 'text-yellow-600' : 'text-gray-400'
                            )} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{achievement.title}</h4>
                              <Badge 
                                variant="outline" 
                                className={cn('text-xs', rarity.color, rarity.bgColor)}
                              >
                                {rarity.label}
                              </Badge>
                            </div>
                            
                            <p className="text-xs text-muted-foreground mb-2">
                              {achievement.description}
                            </p>
                            
                            {achievement.earned ? (
                              <Badge variant="default" className="text-xs">
                                <Medal className="h-3 w-3 mr-1" />
                                Earned {achievement.earnedDate}
                              </Badge>
                            ) : achievement.progress && (
                              <div className="space-y-1">
                                <Progress value={achievement.progress * 100} className="h-1" />
                                <div className="text-xs text-muted-foreground">
                                  {Math.round(achievement.progress * 100)}% Complete
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Active Challenges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Active Challenges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {challenges.map((challenge) => (
                  <div key={challenge.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{challenge.title}</h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {challenge.participants.toLocaleString()}
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-3">{challenge.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{challenge.progress.toLocaleString()} / {challenge.target.toLocaleString()}</span>
                      </div>
                      <Progress value={(challenge.progress / challenge.target) * 100} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {challenge.timeLeft} left
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <Award className="h-3 w-3 mr-1" />
                        {challenge.reward}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Community & Stats */}
        <div className="space-y-6">
          {/* Writing Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Your Journey
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {profile.totalWords.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Words</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {profile.storiesCompleted}
                  </div>
                  <div className="text-xs text-muted-foreground">Stories Completed</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {profile.level}
                  </div>
                  <div className="text-xs text-muted-foreground">Level</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {profile.streak}
                  </div>
                  <div className="text-xs text-muted-foreground">Day Streak</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Community Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                Community Highlights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-4">
                  {community.map((post) => (
                    <div key={post.id} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-blue-500" />
                        <span className="font-medium text-sm">{post.author}</span>
                        <span className="text-xs text-muted-foreground">{post.timeAgo}</span>
                      </div>
                      
                      <h4 className="font-medium text-sm mb-1">{post.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {post.comments}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}