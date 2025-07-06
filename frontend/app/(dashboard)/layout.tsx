import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { UserButton } from '@clerk/nextjs'
import Logo from '@/components/brand/Logo'
import { ThemeToggle } from '@/components/design-system/theme-toggle'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <Logo size="md" />
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8',
                },
              }}
            />
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}