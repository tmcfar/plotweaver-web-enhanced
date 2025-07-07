'use client'

import { useRouter } from 'next/navigation'
import { CreateProjectWizard } from '@/components/projects/CreateProjectWizard'

export default function NewProjectPage() {
  const router = useRouter()

  return (
    <CreateProjectWizard
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          router.push('/projects')
        }
      }}
    />
  )
}
