'use client'

import React, { use } from 'react'
import { EditorLayout } from '@/components/editor/EditorLayout'

interface ProjectEditorPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProjectEditorPage({ params }: ProjectEditorPageProps) {
  const { id } = use(params)
  return <EditorLayout projectId={id} />
}