'use client'

import React, { useState } from 'react'
import { 
  Save, 
  MoreHorizontal, 
  Settings, 
  Eye, 
  Type, 
  Maximize2,
  Minimize2,
  PanelRight,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface EditorPanelProps {
  projectId: string
  onToggleProperties: () => void
  propertiesPanelVisible: boolean
}

interface EditorTab {
  id: string
  title: string
  type: 'document' | 'character' | 'location'
  isDirty: boolean
  content: string
}

// Mock editor tabs - this would come from your state management
const mockTabs: EditorTab[] = [
  {
    id: '1',
    title: 'Chapter 1: The Beginning',
    type: 'document',
    isDirty: true,
    content: `# Chapter 1: The Beginning

The morning sun cast long shadows across the cobblestone streets of Elderbrook, painting the ancient buildings in hues of gold and amber. Sarah pulled her coat tighter against the crisp autumn air as she hurried down the familiar path to the old library.

She had been making this journey every day for the past three weeks, ever since discovering the mysterious letter hidden in her grandmother's attic. The letter, written in an elegant script that seemed to shimmer in certain light, had spoken of secrets buried deep within the town's history—secrets that only the library's oldest volumes might reveal.

As she approached the towering oak doors of the library, Sarah noticed something different. A figure stood in the shadows near the entrance, watching her approach with keen interest. Their face was obscured by a wide-brimmed hat, but something about their posture suggested they had been waiting for her.

"Excuse me," the stranger called out as Sarah reached for the door handle. "Are you Sarah Chen?"

Sarah's heart skipped a beat. How did this person know her name? She turned slowly, studying the figure who stepped into the morning light. It was an elderly woman with silver hair and kind but piercing blue eyes.

"I'm Margaret Whitfield," the woman continued, extending a gloved hand. "I believe we need to talk about your grandmother's letter."

The weight of those words settled over Sarah like a heavy blanket. Her grandmother had passed away six months ago, taking with her a lifetime of stories that Sarah had always assumed were merely fairy tales. But the letter had suggested otherwise, and now this stranger's appearance confirmed her growing suspicion that there was more to her family's history than she had ever imagined.

"How do you know about the letter?" Sarah asked, her voice barely above a whisper.

Margaret smiled, but there was a sadness in her expression that spoke of old sorrows and buried truths. "Because, my dear, I helped your grandmother write it."

...`
  },
  {
    id: '2',
    title: 'Character: Sarah Chen',
    type: 'character',
    isDirty: false,
    content: `# Sarah Chen

## Basic Information
- **Age:** 28
- **Occupation:** Graduate student in History
- **Location:** Elderbrook, New England

## Physical Description
Sarah is of medium height with long, dark hair that she often wears in a practical ponytail. Her Asian-American heritage is evident in her features, inherited from her Chinese grandmother and American grandfather. She has expressive brown eyes that light up when she's passionate about a subject, and her hands are often ink-stained from taking extensive notes.

## Personality
- **Curious:** Sarah has an insatiable appetite for knowledge, particularly about history and genealogy
- **Determined:** Once she sets her mind to something, she sees it through to completion
- **Cautious:** While curious, she's not reckless and thinks through her actions
- **Loyal:** Deeply connected to her family's memory and history

## Background
Sarah grew up listening to her grandmother's stories about their family's past in China and their immigration to America. She always thought these were just colorful tales until her grandmother's death revealed hidden depths to their family history.

## Goals
- Uncover the truth about her family's past
- Complete her graduate thesis on immigration patterns in New England
- Honor her grandmother's memory

## Character Arc
Sarah begins as someone who sees history as academic study but learns that some histories are personal and dangerous. She must decide how much she's willing to risk to uncover the truth about her heritage.`
  }
]

export function EditorPanel({ projectId, onToggleProperties, propertiesPanelVisible }: EditorPanelProps) {
  const [openTabs, setOpenTabs] = useState<EditorTab[]>(mockTabs)
  const [activeTab, setActiveTab] = useState(mockTabs[0].id)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [editorMode, setEditorMode] = useState<'write' | 'preview'>('write')

  const activeTabData = openTabs.find(tab => tab.id === activeTab)

  const closeTab = (tabId: string) => {
    const newTabs = openTabs.filter(tab => tab.id !== tabId)
    setOpenTabs(newTabs)
    
    if (activeTab === tabId && newTabs.length > 0) {
      setActiveTab(newTabs[0].id)
    }
  }

  const updateTabContent = (tabId: string, content: string) => {
    setOpenTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, content, isDirty: true }
        : tab
    ))
  }

  if (!activeTabData) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Type className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No document open</p>
          <p className="text-sm">Select a document from the sidebar to start writing</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "h-full flex flex-col bg-background",
      isFullscreen && "fixed inset-0 z-50"
    )}>
      {/* Tab Bar */}
      <div className="border-b border-border bg-muted/30">
        <div className="flex items-center">
          {/* Active Tabs */}
          <div className="flex-1 flex overflow-x-auto">
            {openTabs.map((tab) => (
              <div
                key={tab.id}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 border-r border-border cursor-pointer group min-w-0",
                  activeTab === tab.id 
                    ? "bg-background border-b-2 border-b-primary" 
                    : "hover:bg-muted/50"
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="text-sm font-medium truncate">
                  {tab.title}
                  {tab.isDirty && <span className="text-orange-500 ml-1">●</span>}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTab(tab.id)
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Tab Actions */}
          <div className="flex items-center border-l border-border px-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleProperties}
              className="h-8 w-8"
              title={propertiesPanelVisible ? "Hide Properties" : "Show Properties"}
            >
              <PanelRight className={cn(
                "h-4 w-4 transition-transform",
                propertiesPanelVisible && "rotate-180"
              )} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Save className="h-4 w-4 mr-2" />
                  Save Document
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Document Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                <DropdownMenuItem>Export as Word</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Editor Toolbar */}
      <div className="border-b border-border bg-muted/30 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={activeTabData.type === 'document' ? 'default' : 'secondary'}>
              {activeTabData.type}
            </Badge>
            <Tabs value={editorMode} onValueChange={(value) => setEditorMode(value as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="write" className="text-xs">Write</TabsTrigger>
                <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Words: {activeTabData.content.split(/\s+/).length}</span>
            <span>Characters: {activeTabData.content.length}</span>
            <Button variant="ghost" size="sm" className="h-6">
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        {editorMode === 'write' ? (
          <Textarea
            value={activeTabData.content}
            onChange={(e) => updateTabContent(activeTabData.id, e.target.value)}
            className="h-full resize-none border-0 rounded-none focus-visible:ring-0 font-mono text-sm leading-relaxed p-6"
            placeholder="Start writing your story..."
          />
        ) : (
          <div className="h-full overflow-auto p-6 prose prose-slate max-w-none">
            <div 
              dangerouslySetInnerHTML={{ 
                __html: activeTabData.content
                  .replace(/^# /gm, '<h1>')
                  .replace(/^## /gm, '<h2>')
                  .replace(/^### /gm, '<h3>')
                  .replace(/\n/g, '<br>')
              }} 
            />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-border bg-muted/30 px-4 py-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Line 1, Column 1</span>
            <span>Spaces: 2</span>
            <span>UTF-8</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Last saved: 2 minutes ago</span>
            <Badge variant="outline" className="text-xs">Auto-save on</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}