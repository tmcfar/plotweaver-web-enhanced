import React from 'react';

interface CharacterPanelProps {
  projectId?: string;
  characterId?: string;
}

export default function CharacterPanel({ projectId, characterId }: CharacterPanelProps) {
  return (
    <div className="h-full flex flex-col p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Character Details</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {characterId ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
              <p className="mt-1">Character Name</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Character description will appear here...
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
              <p className="mt-1">Protagonist</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Select a character to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
