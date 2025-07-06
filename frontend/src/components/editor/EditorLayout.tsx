'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { EditorSidebar } from './EditorSidebar'
import { EditorPanel } from './EditorPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable'

interface EditorLayoutProps {
  projectId: string
  className?: string
}

export function EditorLayout({ projectId, className }: EditorLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [propertiesPanelVisible, setPropertiesPanelVisible] = useState(true)

  return (
    <div className={cn('h-screen flex flex-col bg-background', className)}>
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Sidebar */}
          <ResizablePanel
            defaultSize={20}
            minSize={15}
            maxSize={30}
            collapsible={true}
            onCollapse={() => setSidebarCollapsed(true)}
            onExpand={() => setSidebarCollapsed(false)}
            className={cn(
              'border-r border-border',
              sidebarCollapsed && 'min-w-[60px]'
            )}
          >
            <EditorSidebar
              projectId={projectId}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Main Editor Area */}
          <ResizablePanel defaultSize={propertiesPanelVisible ? 60 : 80} minSize={50}>
            <EditorPanel
              projectId={projectId}
              onToggleProperties={() => setPropertiesPanelVisible(!propertiesPanelVisible)}
              propertiesPanelVisible={propertiesPanelVisible}
            />
          </ResizablePanel>

          {/* Properties Panel */}
          {propertiesPanelVisible && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel
                defaultSize={20}
                minSize={15}
                maxSize={30}
                className="border-l border-border"
              >
                <PropertiesPanel
                  projectId={projectId}
                  onClose={() => setPropertiesPanelVisible(false)}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  )
}