import Logo from '@/components/brand/Logo'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 left-4">
        <Logo size="lg" />
      </div>
      {children}
    </div>
  )
}