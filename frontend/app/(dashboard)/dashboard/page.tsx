import { currentUser } from '@clerk/nextjs/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await currentUser()

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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No projects yet. Start your first story!
            </p>
            <Button asChild className="mt-4">
              <Link href="/projects/new">Create Project</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Writing Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-muted-foreground">Words written today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Assistance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Available agents ready to help
            </p>
            <div className="mt-2 text-sm text-green-600">
              🤖 GPT-4 Ready
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}