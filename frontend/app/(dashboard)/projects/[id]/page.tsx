'use client'

import React from 'react'
import { EditorLayout } from '@/components/editor/EditorLayout'

interface ProjectEditorPageProps {
  params: {
    id: string
  }
}

export default function ProjectEditorPage({ params }: ProjectEditorPageProps) {
  return <EditorLayout projectId={params.id} />
}