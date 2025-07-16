import React from 'react';

interface TimelinePanelProps {
  projectId?: string;
}

export default function TimelinePanel({ projectId }: TimelinePanelProps) {
  return (
    <div className="h-full flex flex-col p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Story Timeline</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          <div className="border-l-2 border-muted pl-4 ml-2">
            <div className="relative">
              <div className="absolute -left-6 w-3 h-3 bg-primary rounded-full"></div>
              <h3 className="font-medium">Chapter 1</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Introduction and setup
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Scene 1 → Scene 2 → Scene 3
              </p>
            </div>
          </div>
          
          <div className="border-l-2 border-muted pl-4 ml-2">
            <div className="relative">
              <div className="absolute -left-6 w-3 h-3 bg-muted rounded-full"></div>
              <h3 className="font-medium">Chapter 2</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Rising action
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Scene 4 → Scene 5
              </p>
            </div>
          </div>
          
          <div className="border-l-2 border-muted pl-4 ml-2">
            <div className="relative">
              <div className="absolute -left-6 w-3 h-3 bg-muted rounded-full"></div>
              <h3 className="font-medium">Chapter 3</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Climax and resolution
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Scene 6 → Scene 7 → Scene 8
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
