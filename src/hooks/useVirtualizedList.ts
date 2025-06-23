import { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualizedListOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  getItemHeight?: (index: number) => number;
}

interface VirtualizedListResult<T> {
  visibleItems: Array<{ item: T; index: number; style: React.CSSProperties }>;
  totalHeight: number;
  scrollToIndex: (index: number) => void;
  containerProps: {
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    style: React.CSSProperties;
  };
  viewportProps: {
    style: React.CSSProperties;
  };
}

export function useVirtualizedList<T>(
  items: T[],
  options: VirtualizedListOptions
): VirtualizedListResult<T> {
  const { itemHeight, containerHeight, overscan = 3, getItemHeight } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate which items are visible
  const calculateVisibleItems = useCallback(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems = [];
    let currentTop = 0;

    // Calculate position for items before start
    for (let i = 0; i < startIndex; i++) {
      currentTop += getItemHeight ? getItemHeight(i) : itemHeight;
    }

    // Add visible items
    for (let i = startIndex; i <= endIndex; i++) {
      const height = getItemHeight ? getItemHeight(i) : itemHeight;
      visibleItems.push({
        item: items[i],
        index: i,
        style: {
          position: 'absolute' as const,
          top: currentTop,
          left: 0,
          right: 0,
          height,
        },
      });
      currentTop += height;
    }

    return visibleItems;
  }, [items, scrollTop, itemHeight, containerHeight, overscan, getItemHeight]);

  const visibleItems = calculateVisibleItems();

  // Calculate total height
  const totalHeight = getItemHeight
    ? items.reduce((acc, _, index) => acc + getItemHeight(index), 0)
    : items.length * itemHeight;

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Scroll to specific index
  const scrollToIndex = useCallback((index: number) => {
    if (scrollElementRef.current) {
      const offset = getItemHeight
        ? items.slice(0, index).reduce((acc, _, i) => acc + getItemHeight(i), 0)
        : index * itemHeight;
      scrollElementRef.current.scrollTop = offset;
    }
  }, [items, itemHeight, getItemHeight]);

  return {
    visibleItems,
    totalHeight,
    scrollToIndex,
    containerProps: {
      onScroll: handleScroll,
      style: {
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      },
    },
    viewportProps: {
      style: {
        height: totalHeight,
        position: 'relative',
      },
    },
  };
}