import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  WritingIcon, 
  AIIcon, 
  LockIcon, 
  CollaborationIcon, 
  ProgressIcon,
  ExportIcon 
} from './icons'

interface EmptyStateProps {
  className?: string
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  className,
  title,
  description,
  action,
  icon
}) => (
  <div className={cn(
    'flex flex-col items-center justify-center text-center py-16 px-4',
    className
  )}>
    {icon && (
      <div className="mb-6 text-muted-foreground">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold text-foreground mb-2">
      {title}
    </h3>
    <p className="text-muted-foreground mb-6 max-w-md">
      {description}
    </p>
    {action && (
      <Button onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </div>
)

export const NoProjectsState: React.FC<{ 
  onCreateProject: () => void
  className?: string 
}> = ({ onCreateProject, className }) => (
  <EmptyState
    className={className}
    icon={<WritingIcon size={48} />}
    title="No projects yet"
    description="Start your writing journey by creating your first project. Choose from templates or start from scratch."
    action={{
      label: "Create Your First Project",
      onClick: onCreateProject
    }}
  />
)

export const NoScenesState: React.FC<{ 
  onCreateScene: () => void
  className?: string 
}> = ({ onCreateScene, className }) => (
  <EmptyState
    className={className}
    icon={<WritingIcon size={48} />}
    title="No scenes written"
    description="Begin crafting your story by writing your first scene. Use AI assistance or start typing to get inspired."
    action={{
      label: "Write First Scene",
      onClick: onCreateScene
    }}
  />
)

export const NoCharactersState: React.FC<{ 
  onCreateCharacter: () => void
  className?: string 
}> = ({ onCreateCharacter, className }) => (
  <EmptyState
    className={className}
    icon={<CollaborationIcon size={48} />}
    title="No characters created"
    description="Bring your story to life by creating memorable characters. Define their personalities, backgrounds, and relationships."
    action={{
      label: "Create Character",
      onClick: onCreateCharacter
    }}
  />
)

export const NoAIGenerationsState: React.FC<{ 
  onStartGeneration: () => void
  className?: string 
}> = ({ onStartGeneration, className }) => (
  <EmptyState
    className={className}
    icon={<AIIcon size={48} />}
    title="No AI generations yet"
    description="Let AI help you write! Generate scenes, develop characters, or brainstorm plot ideas with our intelligent writing assistant."
    action={{
      label: "Start AI Generation",
      onClick: onStartGeneration
    }}
  />
)

export const NoLocksState: React.FC<{ className?: string }> = ({ className }) => (
  <EmptyState
    className={className}
    icon={<LockIcon size={48} />}
    title="No story elements locked"
    description="Lock important story elements to maintain consistency. Once locked, changes require approval to prevent plot holes."
  />
)

export const SearchEmptyState: React.FC<{ 
  query: string
  onClearSearch: () => void
  className?: string 
}> = ({ query, onClearSearch, className }) => (
  <EmptyState
    className={className}
    icon={
      <div className="text-4xl mb-2">🔍</div>
    }
    title={`No results for "${query}"`}
    description="Try adjusting your search terms or browse all content to find what you're looking for."
    action={{
      label: "Clear Search",
      onClick: onClearSearch
    }}
  />
)

export const ErrorState: React.FC<{ 
  title?: string
  description?: string
  onRetry?: () => void
  className?: string 
}> = ({ 
  title = "Something went wrong",
  description = "An error occurred while loading this content. Please try again.",
  onRetry,
  className 
}) => (
  <EmptyState
    className={className}
    icon={
      <div className="text-4xl mb-2 text-destructive">⚠️</div>
    }
    title={title}
    description={description}
    action={onRetry ? {
      label: "Try Again",
      onClick: onRetry
    } : undefined}
  />
)

export const OfflineState: React.FC<{ 
  onRetry?: () => void
  className?: string 
}> = ({ onRetry, className }) => (
  <EmptyState
    className={className}
    icon={
      <div className="text-4xl mb-2 text-muted-foreground">📡</div>
    }
    title="You're offline"
    description="Check your internet connection and try again. Your work has been saved locally."
    action={onRetry ? {
      label: "Reconnect",
      onClick: onRetry
    } : undefined}
  />
)

export const MaintenanceState: React.FC<{ className?: string }> = ({ className }) => (
  <EmptyState
    className={className}
    icon={
      <div className="text-4xl mb-2">🔧</div>
    }
    title="Scheduled maintenance"
    description="PlotWeaver is currently undergoing maintenance. We'll be back shortly with improvements!"
  />
)