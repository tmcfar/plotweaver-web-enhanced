'use client'

import React, { useState } from 'react'
import { 
  FileText, 
  Settings, 
  Search, 
  BookOpen, 
  Users, 
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Folder,
  FolderOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface EditorSidebarProps {
  projectId: string
  collapsed: boolean
  onToggleCollapse: () => void
}

interface DocumentNode {
  id: string
  name: string
  type: 'folder' | 'document'
  children?: DocumentNode[]
  wordCount?: number
  isOpen?: boolean
}

// Mock document structure - this would come from your API
const mockDocuments: DocumentNode[] = [
  {
    id: '1',
    name: 'Chapters',
    type: 'folder',
    isOpen: true,
    children: [
      { id: '2', name: 'Chapter 1: The Beginning', type: 'document', wordCount: 2543 },
      { id: '3', name: 'Chapter 2: Rising Action', type: 'document', wordCount: 1876 },
      { id: '4', name: 'Chapter 3: The Twist', type: 'document', wordCount: 0 },
    ]
  },
  {
    id: '5',
    name: 'Characters',
    type: 'folder',
    isOpen: false,
    children: [
      { id: '6', name: 'Main Characters', type: 'document', wordCount: 456 },
      { id: '7', name: 'Supporting Cast', type: 'document', wordCount: 234 },
    ]
  },
  {
    id: '8',
    name: 'Research',
    type: 'folder',
    isOpen: false,
    children: [
      { id: '9', name: 'Historical Context', type: 'document', wordCount: 1234 },
      { id: '10', name: 'Location Notes', type: 'document', wordCount: 567 },
    ]
  }
]

function DocumentTree({ documents, level = 0 }: { documents: DocumentNode[], level?: number }) {
  const [openFolders, setOpenFolders] = useState<Set<string>>(
    new Set(documents.filter(doc => doc.isOpen).map(doc => doc.id))
  )

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-1">
      {documents.map((doc) => (
        <div key={doc.id}>
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent cursor-pointer group",
              level > 0 && "ml-4"
            )}
            onClick={() => doc.type === 'folder' ? toggleFolder(doc.id) : null}
          >
            {doc.type === 'folder' ? (
              <>
                {openFolders.has(doc.id) ? (
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Folder className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="flex-1 font-medium">{doc.name}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Plus className="h-4 w-4 mr-2" />
                      New Document
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Folder className="h-4 w-4 mr-2" />
                      New Folder
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Rename</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{doc.name}</span>
                {doc.wordCount !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    {doc.wordCount > 0 ? `${doc.wordCount}w` : 'Empty'}
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Rename</DropdownMenuItem>
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
          {doc.type === 'folder' && doc.children && openFolders.has(doc.id) && (
            <DocumentTree documents={doc.children} level={level + 1} />
          )}
        </div>
      ))}
    </div>
  )
}

export function EditorSidebar({ projectId, collapsed, onToggleCollapse }: EditorSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  if (collapsed) {
    return (
      <div className="w-full h-full p-2 flex flex-col items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="mb-4"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="space-y-2">
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <FileText className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <BookOpen className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <Users className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Project Explorer</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-6 w-6"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="files" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 mx-4 mt-2">
          <TabsTrigger value="files" className="p-1">
            <FileText className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="search" className="p-1">
            <Search className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="outline" className="p-1">
            <BookOpen className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="collab" className="p-1">
            <Users className="h-3 w-3" />
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 px-4">
          <TabsContent value="files" className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Documents
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <DocumentTree documents={mockDocuments} />
          </TabsContent>

          <TabsContent value="search" className="mt-4">
            <div className="text-sm text-muted-foreground text-center py-8">
              Search functionality coming soon...
            </div>
          </TabsContent>

          <TabsContent value="outline" className="mt-4">
            <div className="text-sm text-muted-foreground text-center py-8">
              Story outline view coming soon...
            </div>
          </TabsContent>

          <TabsContent value="collab" className="mt-4">
            <div className="text-sm text-muted-foreground text-center py-8">
              Collaboration tools coming soon...
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}