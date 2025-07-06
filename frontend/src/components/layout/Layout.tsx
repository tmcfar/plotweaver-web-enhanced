import { FC, ReactNode } from 'react';
import { useGlobalStore } from '../../lib/store';
import { MODE_SET_CONFIGS } from '../../config/modeSetConfigs';
import { PanelContainer } from '../panels/PanelContainer';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  const { modeSet } = useGlobalStore();

  if (!modeSet) return null;
  
  const config = MODE_SET_CONFIGS[modeSet];
  
  return (
    <div className={`h-screen flex app-layout mode-${modeSet}`} data-mode={modeSet}>
      {config.panels.left.visible && (
        <PanelContainer
          side="left"
          defaultSize={config.panels.left.defaultSize || 250}
          minSize={config.panels.left.minSize || 200}
          maxSize={config.panels.left.maxSize || 400}
          config={config.panels.left}
        >
          {/* Left panel content */}
          <div>Left Panel</div>
        </PanelContainer>
      )}
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">{children}</div>
        {config.panels.bottom.visible && (
          <PanelContainer
            side="bottom"
            defaultSize={config.panels.bottom.defaultSize || 200}
            minSize={config.panels.bottom.minSize || 150}
            maxSize={config.panels.bottom.maxSize || 400}
            config={config.panels.bottom}
          >
            {/* Bottom panel content */}
            <div>Bottom Panel</div>
          </PanelContainer>
        )}
      </main>
      
      {config.panels.right.visible && (
        <PanelContainer
          side="right"
          defaultSize={config.panels.right.defaultSize || 300}
          minSize={config.panels.right.minSize || 250}
          maxSize={config.panels.right.maxSize || 500}
          config={config.panels.right}
        >
          {/* Right panel content */}
          <div>Right Panel</div>
        </PanelContainer>
      )}
    </div>
  );
};
