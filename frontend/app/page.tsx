import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Logo from '@/components/brand/Logo'
import Link from 'next/link'

export default function HomePage() {
  const { userId } = auth()

  // If user is signed in, redirect to dashboard
  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Logo size="xl" className="mx-auto mb-8" />
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Weave Your Stories with AI
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            PlotWeaver combines the power of AI with your creativity to help you write, 
            edit, and perfect your novels. From character development to plot consistency, 
            we've got you covered.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/sign-up">Start Writing</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                AI-Powered Writing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Let AI help generate scenes, develop characters, and maintain plot consistency 
                throughout your story.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                Smart Locking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Prevent plot holes with our intelligent locking system that maintains 
                story continuity and character consistency.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                Collaboration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Work with editors, beta readers, and co-authors in real-time with 
                advanced collaboration features.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Progress Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor your writing progress, set goals, and get insights into 
                your writing habits and productivity.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📱</span>
                Multi-Platform
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Write anywhere with our responsive design that works perfectly 
                on desktop, tablet, and mobile devices.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📖</span>
                Export Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Export your finished work in multiple formats including PDF, EPUB, 
                and Word for publishing or sharing.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Ready to Start Your Writing Journey?</CardTitle>
              <CardDescription>
                Join thousands of writers who have chosen PlotWeaver to bring their stories to life.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="w-full">
                <Link href="/sign-up">Get Started for Free</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}