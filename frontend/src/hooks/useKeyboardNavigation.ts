import { useState, useEffect, useCallback } from 'react';

export interface NavigationItem {
  id: string;
  element?: HTMLElement;
  focusable?: boolean;
  disabled?: boolean;
}

export interface KeyboardNavigationOptions {
  items: NavigationItem[];
  onSelect?: (item: NavigationItem) => void;
  onExpand?: (item: NavigationItem) => void;
  onCollapse?: (item: NavigationItem) => void;
  loop?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export function useKeyboardNavigation({
  items,
  onSelect,
  onExpand,
  onCollapse,
  loop = true,
  orientation = 'vertical'
}: KeyboardNavigationOptions) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [announcement, setAnnouncement] = useState<string>('');

  const focusableItems = items.filter(item => item.focusable !== false && !item.disabled);

  const moveFocus = useCallback((direction: 'next' | 'previous') => {
    const currentIndex = focusedIndex;
    let newIndex: number;

    if (direction === 'next') {
      newIndex = currentIndex + 1;
      if (newIndex >= focusableItems.length) {
        newIndex = loop ? 0 : focusableItems.length - 1;
      }
    } else {
      newIndex = currentIndex - 1;
      if (newIndex < 0) {
        newIndex = loop ? focusableItems.length - 1 : 0;
      }
    }

    setFocusedIndex(newIndex);
    
    // Focus the element if it exists
    const targetItem = focusableItems[newIndex];
    if (targetItem?.element) {
      targetItem.element.focus();
    }

    // Announce the focused item
    setAnnouncement(`${newIndex + 1} of ${focusableItems.length}: ${targetItem?.id}`);
  }, [focusedIndex, focusableItems, loop]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isVertical = orientation === 'vertical';
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

    switch (event.key) {
      case nextKey:
        event.preventDefault();
        moveFocus('next');
        break;
      case prevKey:
        event.preventDefault();
        moveFocus('previous');
        break;
      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        if (focusableItems[0]?.element) {
          focusableItems[0].element.focus();
        }
        setAnnouncement(`First item: ${focusableItems[0]?.id}`);
        break;
      case 'End':
        event.preventDefault();
        const lastIndex = focusableItems.length - 1;
        setFocusedIndex(lastIndex);
        if (focusableItems[lastIndex]?.element) {
          focusableItems[lastIndex].element.focus();
        }
        setAnnouncement(`Last item: ${focusableItems[lastIndex]?.id}`);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        const currentItem = focusableItems[focusedIndex];
        if (currentItem && onSelect) {
          onSelect(currentItem);
          setAnnouncement(`Selected: ${currentItem.id}`);
        }
        break;
      case 'ArrowRight':
        if (isVertical && onExpand) {
          event.preventDefault();
          const currentItem = focusableItems[focusedIndex];
          if (currentItem) {
            onExpand(currentItem);
            setAnnouncement(`Expanded: ${currentItem.id}`);
          }
        }
        break;
      case 'ArrowLeft':
        if (isVertical && onCollapse) {
          event.preventDefault();
          const currentItem = focusableItems[focusedIndex];
          if (currentItem) {
            onCollapse(currentItem);
            setAnnouncement(`Collapsed: ${currentItem.id}`);
          }
        }
        break;
    }
  }, [focusedIndex, focusableItems, orientation, moveFocus, onSelect, onExpand, onCollapse]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    focusedIndex,
    setFocusedIndex,
    announcement,
    clearAnnouncement: () => setAnnouncement('')
  };
}