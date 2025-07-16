// Type declarations to fix React 18 compatibility issues with @hello-pangea/dnd
declare module '@hello-pangea/dnd' {
  import { ReactElement } from 'react';
  
  export interface DroppableProvided {
    innerRef: (element: HTMLElement | null) => void;
    droppableProps: {
      [key: string]: any;
    };
    placeholder?: ReactElement | null;
  }

  export interface DroppableStateSnapshot {
    isDraggingOver: boolean;
    draggingOverWith?: string | null;
  }

  export interface DraggableProvided {
    innerRef: (element: HTMLElement | null) => void;
    draggableProps: {
      [key: string]: any;
    };
    dragHandleProps?: {
      [key: string]: any;
    } | null;
  }

  export interface DraggableStateSnapshot {
    isDragging: boolean;
    isDropAnimating: boolean;
  }

  export interface DropResult {
    draggableId: string;
    type: string;
    source: {
      index: number;
      droppableId: string;
    };
    destination?: {
      index: number;
      droppableId: string;
    } | null;
  }

  export interface DragDropContextProps {
    onDragEnd: (result: DropResult) => void;
    children: React.ReactNode;
  }

  export interface DroppableProps {
    droppableId: string;
    children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactElement<any>;
  }

  export interface DraggableProps {
    draggableId: string;
    index: number;
    children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => React.ReactElement<any>;
  }

  export const DragDropContext: React.FC<DragDropContextProps>;
  export const Droppable: React.FC<DroppableProps>;
  export const Draggable: React.FC<DraggableProps>;
}
