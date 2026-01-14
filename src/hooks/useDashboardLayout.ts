import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { GridWidget } from '@/components/layout/DraggableGridLayout';

const STORAGE_KEY_PREFIX = 'dashboard_layout_';

interface DashboardLayoutState {
  widgets: GridWidget[];
  columns: 2 | 3 | 4;
}

export const useDashboardLayout = (
  dashboardId: string,
  defaultWidgets: GridWidget[]
) => {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<GridWidget[]>(defaultWidgets);
  const [columns, setColumns] = useState<2 | 3 | 4>(4);
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
          const parsed: DashboardLayoutState = JSON.parse(stored);
          
          // Merge with defaults to handle new widgets
          const mergedWidgets = defaultWidgets.map(defaultWidget => {
            const savedWidget = parsed.widgets.find(w => w.id === defaultWidget.id);
            if (savedWidget) {
              return {
                ...defaultWidget,
                colSpan: savedWidget.colSpan,
                rowSpan: savedWidget.rowSpan,
                locked: savedWidget.locked,
                visible: savedWidget.visible
              };
            }
            return defaultWidget;
          });
          
          // Preserve order from saved layout
          const orderedWidgets = parsed.widgets
            .map(saved => mergedWidgets.find(w => w.id === saved.id))
            .filter(Boolean) as GridWidget[];
          
          // Add any new widgets that weren't in the saved layout
          const newWidgets = mergedWidgets.filter(
            w => !parsed.widgets.find(saved => saved.id === w.id)
          );
          
          setWidgets([...orderedWidgets, ...newWidgets]);
          setColumns(parsed.columns || 4);
        } else {
          setWidgets(defaultWidgets);
        }
      } catch (error) {
        console.error('Error loading dashboard layout:', error);
        setWidgets(defaultWidgets);
      }
      setIsLoaded(true);
    };

    loadLayout();
  }, [getStorageKey, defaultWidgets]);

  // Save layout when widgets change
  const saveLayout = useCallback((newWidgets: GridWidget[], newColumns?: 2 | 3 | 4) => {
    const layoutState: DashboardLayoutState = {
      widgets: newWidgets.map(w => ({
        id: w.id,
        title: w.title,
        colSpan: w.colSpan,
        rowSpan: w.rowSpan,
        locked: w.locked,
        visible: w.visible,
        component: null as any, // Don't save components
        icon: null as any // Don't save icons
      })),
      columns: newColumns || columns
    };

    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(layoutState));
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
    }
  }, [getStorageKey, columns]);

  // Handle widget changes
  const handleWidgetsChange = useCallback((newWidgets: GridWidget[]) => {
    setWidgets(newWidgets);
    saveLayout(newWidgets);
  }, [saveLayout]);

  // Handle column changes
  const handleColumnsChange = useCallback((newColumns: 2 | 3 | 4) => {
    setColumns(newColumns);
    saveLayout(widgets, newColumns);
  }, [widgets, saveLayout]);

  // Reset to default layout
  const resetLayout = useCallback(() => {
    setWidgets(defaultWidgets);
    setColumns(4);
    localStorage.removeItem(getStorageKey());
  }, [defaultWidgets, getStorageKey]);

  return {
    widgets,
    columns,
    isLoaded,
    handleWidgetsChange,
    handleColumnsChange,
    resetLayout
  };
};
