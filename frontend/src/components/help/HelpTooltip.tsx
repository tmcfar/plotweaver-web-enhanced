import React, { useState, useEffect } from 'react';
import { HelpCircle, Loader2 } from 'lucide-react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { useHelpContent } from './HelpProvider';
import { useTracking } from '@/hooks/useTracking';

interface HelpTooltipProps {
  helpId: string;
  children: React.ReactNode;
  showIcon?: boolean;
  iconPosition?: 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  iconClassName?: string;
}

export function HelpTooltip({ 
  helpId, 
  children, 
  showIcon = true,
  iconPosition = 'right',
  trigger = 'hover',
  side = 'top',
  className = '',
  iconClassName = ''
}: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { content, isLoading, error } = useHelpContent(helpId);
  const { trackEvent } = useTracking('HelpTooltip');

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    
    if (open) {
      trackEvent('help_tooltip_opened', { 
        helpId,
        trigger,
        hasContent: !!content
      });
    } else {
      trackEvent('help_tooltip_closed', { 
        helpId,
        trigger
      });
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsOpen(!isOpen);
    }
  };

  const getTooltipContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Loading help...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-red-400">
          Failed to load help content
        </div>
      );
    }

    if (!content) {
      return (
        <div className="text-gray-400">
          No help content available
        </div>
      );
    }

    return (
      <div className="max-w-xs">
        {content.title && (
          <div className="font-semibold text-white mb-1">
            {content.title}
          </div>
        )}
        <div className="text-gray-100 text-sm leading-relaxed">
          {content.content}
        </div>
      </div>
    );
  };

  const iconElement = showIcon && (
    <HelpCircle 
      className={`w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors cursor-help ${iconClassName}`}
      aria-hidden="true"
    />
  );

  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root
        open={isOpen}
        onOpenChange={handleOpenChange}
        delayDuration={trigger === 'hover' ? 500 : 0}
      >
        <TooltipPrimitive.Trigger asChild>
          <span 
            className={`inline-flex items-center gap-1 ${className}`}
            onClick={handleClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
              }
            }}
            role={trigger === 'click' ? 'button' : undefined}
            tabIndex={trigger === 'click' ? 0 : undefined}
            aria-label={content?.title || `Help for ${helpId}`}
          >
            {iconPosition === 'left' && iconElement}
            {children}
            {iconPosition === 'right' && iconElement}
          </span>
        </TooltipPrimitive.Trigger>
        
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg z-50 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
            side={side}
            sideOffset={5}
            onEscapeKeyDown={() => setIsOpen(false)}
          >
            {getTooltipContent()}
            <TooltipPrimitive.Arrow className="fill-gray-900" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export default HelpTooltip;