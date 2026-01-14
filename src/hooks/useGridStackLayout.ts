import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { GridWidget } from '@/components/layout/GridStackLayout';

const STORAGE_KEY_PREFIX = 'gridstack_layout_';

interface GridStackLayoutState {
  widgets: Omit<GridWidget, 'component' | 'icon'>[];
}

export const useGridStackLayout = (
  dashboardId: string,
  defaultWidgets: GridWidget[]
) => {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<GridWidget[]>(defaultWidgets);
  const [isLoaded, setIsLoaded] = useState(false);

  // Generate storage key based on user and dashboard
  const getStorageKey = useCallback(() => {
    const userId = user?.id || 'anonymous';
    return `${STORAGE_KEY_PREFIX}${dashboardId}_${userId}`;
  }, [dashboardId, user?.id]);

  // Load layout from localStorage on mount
  useEffect(() => {
    const loadLayout = () => {
      try {
        const stored = localStorage.getItem(getStorageKey());
        if (stored) {
          const parsed: GridStackLayoutState = JSON.parse(stored);
          
          // Merge with defaults to handle new widgets and preserve components
          const mergedWidgets = defaultWidgets.map(defaultWidget => {
            const savedWidget = parsed.widgets.find(w => w.id === defaultWidget.id);
            if (savedWidget) {
              return {
                ...defaultWidget,
                x: savedWidget.x,
                y: savedWidget.y,
                w: savedWidget.w,
                h: savedWidget.h,
                locked: savedWidget.locked,
                visible: savedWidget.visible
              };
            }
            return defaultWidget;
          });
          
          setWidgets(mergedWidgets);
        } else {
          setWidgets(defaultWidgets);
        }
      } catch (error) {
        console.error('Error loading GridStack layout:', error);
        setWidgets(defaultWidgets);
      }
      setIsLoaded(true);
    };

    loadLayout();
  }, [getStorageKey, defaultWidgets]);

  // Save layout when widgets change
  const saveLayout = useCallback((newWidgets: GridWidget[]) => {
    const layoutState: GridStackLayoutState = {
      widgets: newWidgets.map(w => ({
        id: w.id,
        title: w.title,
        x: w.x,
        y: w.y,
        w: w.w,
        h: w.h,
        minW: w.minW,
        minH: w.minH,
        maxW: w.maxW,
        maxH: w.maxH,
        locked: w.locked,
        visible: w.visible
      }))
    };

    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(layoutState));
    } catch (error) {
      console.error('Error saving GridStack layout:', error);
    }
  }, [getStorageKey]);

  // Handle widget changes
  const handleWidgetsChange = useCallback((newWidgets: GridWidget[]) => {
    setWidgets(newWidgets);
    saveLayout(newWidgets);
  }, [saveLayout]);

  // Reset to default layout
  const resetLayout = useCallback(() => {
    setWidgets(defaultWidgets);
    localStorage.removeItem(getStorageKey());
  }, [defaultWidgets, getStorageKey]);

  return {
    widgets,
    isLoaded,
    handleWidgetsChange,
    resetLayout
  };
};
