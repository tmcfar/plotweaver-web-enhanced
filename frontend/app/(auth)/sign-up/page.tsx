import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
              card: 'bg-card border border-border shadow-lg',
            },
          }}
        />
      </div>
    </div>
  )
}