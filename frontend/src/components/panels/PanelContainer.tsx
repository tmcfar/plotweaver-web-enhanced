import { FC, ReactNode, useState, useCallback } from 'react';

interface PanelConfig {
  visible: boolean;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
}

interface PanelContainerProps {
  side: 'left' | 'right' | 'bottom';
  defaultSize: number;
  minSize: number;
  maxSize: number;
  children: ReactNode;
  config: PanelConfig;
}

export const PanelContainer: FC<PanelContainerProps> = ({
  side,
  defaultSize,
  minSize,
  maxSize,
  children,
  config
}) => {
  const [size, setSize] = useState(config.defaultSize || defaultSize);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
    document.body.style.cursor = side === 'bottom' ? 'row-resize' : 'col-resize';
  }, [side]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const rect = document.body.getBoundingClientRect();
      let newSize;

      if (side === 'bottom') {
        const y = e.clientY - rect.top;
        const containerHeight = rect.height;
        newSize = containerHeight - y;
      } else {
        const x = e.clientX - rect.left;
        newSize = side === 'left' ? x : rect.width - x;
      }

      setSize(Math.max(minSize, Math.min(maxSize, newSize)));
    },
    [isDragging, maxSize, minSize, side]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
  }, []);

  useState(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`panel panel-${side} ${isCollapsed ? 'collapsed' : ''}`}
      style={{
        ...(side === 'bottom'
          ? { height: isCollapsed ? '40px' : size }
          : { width: isCollapsed ? '40px' : size }),
        flexShrink: 0
      }}
    >
      <button
        className="collapse-button"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? '≡' : '✖'}
      </button>

      <div
        className={`panel-content ${isCollapsed ? 'hidden' : ''}`}
        style={{ opacity: isCollapsed ? 0 : 1 }}
      >
        {children}
      </div>

      {!isCollapsed && (
        <div
          className={`resize-handle resize-handle-${side}`}
          onMouseDown={handleMouseDown}
        />
      )}
    </div>
  );
};
