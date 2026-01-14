import { useEffect, useRef, useState, useCallback, ReactNode } from "react";
import "gridstack/dist/gridstack.min.css";
import { GridStack, GridStackWidget as GSWidget } from "gridstack";
import { 
  GripVertical, Maximize2, Minimize2, X, Settings, 
  Plus, LayoutGrid, Lock, Unlock, RotateCcw, Save
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface GridWidget {
  id: string;
  title: string;
  icon?: ReactNode;
  component: ReactNode;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  locked?: boolean;
  visible?: boolean;
}

interface GridStackLayoutProps {
  widgets: GridWidget[];
  onWidgetsChange: (widgets: GridWidget[]) => void;
  columns?: number;
  cellHeight?: number;
  gap?: number;
  editable?: boolean;
  onReset?: () => void;
}

export const GridStackLayout = ({
  widgets,
  onWidgetsChange,
  columns = 12,
  cellHeight = 80,
  gap = 10,
  editable = true,
  onReset
}: GridStackLayoutProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInstanceRef = useRef<GridStack | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const visibleWidgets = widgets.filter(w => w.visible !== false);
  const hiddenWidgets = widgets.filter(w => w.visible === false);

  // Initialize GridStack
  useEffect(() => {
    if (!gridRef.current || isInitialized) return;

    const grid = GridStack.init({
      column: columns,
      cellHeight: cellHeight,
      margin: gap,
      float: true,
      animate: true,
      draggable: {
        handle: '.widget-drag-handle'
      },
      resizable: {
        handles: 'e,se,s,sw,w'
      },
      staticGrid: !editMode,
      columnOpts: {
        breakpoints: [{ w: 0, c: columns }]
      }
    }, gridRef.current);

    gridInstanceRef.current = grid;
    setIsInitialized(true);

    // Load initial widgets
    const gsWidgets: GSWidget[] = visibleWidgets.map((widget, index) => ({
      id: widget.id,
      x: widget.x ?? (index % columns) * 3,
      y: widget.y ?? Math.floor(index / 4) * 2,
      w: widget.w ?? 3,
      h: widget.h ?? 2,
      minW: widget.minW ?? 2,
      minH: widget.minH ?? 1,
      maxW: widget.maxW ?? columns,
      maxH: widget.maxH ?? 6,
      locked: widget.locked,
      content: `<div data-widget-id="${widget.id}"></div>`
    }));

    grid.load(gsWidgets);

    // Handle change events
    grid.on('change', (_event: Event, items: any) => {
      if (!items) return;
      
      const updatedWidgets = widgets.map(widget => {
        const item = items.find((i: any) => i.id === widget.id);
        if (item) {
          return {
            ...widget,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h
          };
        }
        return widget;
      });
      
      onWidgetsChange(updatedWidgets);
    });

    return () => {
      grid.destroy(false);
      gridInstanceRef.current = null;
      setIsInitialized(false);
    };
  }, []);

  // Update static mode when editMode changes
  useEffect(() => {
    if (gridInstanceRef.current) {
      gridInstanceRef.current.setStatic(!editMode);
    }
  }, [editMode]);

  // Handle widget visibility changes
  useEffect(() => {
    if (!gridInstanceRef.current || !isInitialized) return;

    const grid = gridInstanceRef.current;
    const currentItems = grid.getGridItems();
    const currentIds = currentItems.map(el => el.getAttribute('gs-id'));

    // Add new visible widgets
    visibleWidgets.forEach((widget, index) => {
      if (!currentIds.includes(widget.id)) {
        grid.addWidget({
          id: widget.id,
          x: widget.x ?? 0,
          y: widget.y ?? 0,
          w: widget.w ?? 3,
          h: widget.h ?? 2,
          minW: widget.minW ?? 2,
          minH: widget.minH ?? 1,
          content: `<div data-widget-id="${widget.id}"></div>`
        });
      }
    });

    // Remove hidden widgets
    currentItems.forEach(el => {
      const id = el.getAttribute('gs-id');
      if (id && !visibleWidgets.find(w => w.id === id)) {
        grid.removeWidget(el, false);
      }
    });
  }, [visibleWidgets, isInitialized]);

  const handleRemove = useCallback((id: string) => {
    if (gridInstanceRef.current) {
      const el = gridRef.current?.querySelector(`[gs-id="${id}"]`);
      if (el) {
        gridInstanceRef.current.removeWidget(el as HTMLElement, false);
      }
    }
    onWidgetsChange(widgets.map(w => 
      w.id === id ? { ...w, visible: false } : w
    ));
  }, [widgets, onWidgetsChange]);

  const handleRestore = useCallback((id: string) => {
    onWidgetsChange(widgets.map(w => 
      w.id === id ? { ...w, visible: true } : w
    ));
  }, [widgets, onWidgetsChange]);

  const toggleLock = useCallback((id: string) => {
    const widget = widgets.find(w => w.id === id);
    if (!widget || !gridInstanceRef.current) return;

    const el = gridRef.current?.querySelector(`[gs-id="${id}"]`);
    if (el) {
      gridInstanceRef.current.update(el as HTMLElement, { locked: !widget.locked });
    }

    onWidgetsChange(widgets.map(w => 
      w.id === id ? { ...w, locked: !w.locked } : w
    ));
  }, [widgets, onWidgetsChange]);

  const handleResetLayout = useCallback(() => {
    if (onReset) {
      onReset();
    }
  }, [onReset]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {editable && (
        <div className="flex items-center justify-between bg-card border rounded-lg p-2">
          <div className="flex items-center gap-2">
            <Button
              variant={editMode ? "default" : "outline"}
              size="sm"
              onClick={() => setEditMode(!editMode)}
              className="gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              {editMode ? "Guardar Layout" : "Editar Layout"}
            </Button>
            
            {editMode && onReset && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetLayout}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Restablecer
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hiddenWidgets.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Agregar Widget
                    <Badge variant="secondary" className="ml-1">{hiddenWidgets.length}</Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  {hiddenWidgets.map(widget => (
                    <DropdownMenuItem key={widget.id} onClick={() => handleRestore(widget.id)}>
                      {widget.icon}
                      <span className="ml-2">{widget.title}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <Badge variant="outline" className="text-xs">
              {visibleWidgets.length} widgets activos
            </Badge>
          </div>
        </div>
      )}

      {/* Expanded Widget Modal */}
      <AnimatePresence>
        {expandedWidget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8"
            onClick={() => setExpandedWidget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-xl shadow-2xl w-full max-w-6xl h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const widget = widgets.find(w => w.id === expandedWidget);
                if (!widget) return null;
                return (
                  <>
                    <div className="flex items-center justify-between p-4 border-b">
                      <div className="flex items-center gap-2">
                        {widget.icon}
                        <span className="font-semibold">{widget.title}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setExpandedWidget(null)}>
                        <Minimize2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="p-4 h-[calc(100%-4rem)] overflow-auto">
                      {widget.component}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GridStack Container */}
      <div 
        ref={gridRef} 
        className="grid-stack"
        style={{ 
          '--gs-column-max': columns,
          minHeight: '400px'
        } as React.CSSProperties}
      >
        {visibleWidgets.map((widget) => (
          <div
            key={widget.id}
            className="grid-stack-item"
            gs-id={widget.id}
            gs-x={widget.x ?? 0}
            gs-y={widget.y ?? 0}
            gs-w={widget.w ?? 3}
            gs-h={widget.h ?? 2}
            gs-min-w={widget.minW ?? 2}
            gs-min-h={widget.minH ?? 1}
            gs-locked={widget.locked ? 'true' : undefined}
          >
            <div className="grid-stack-item-content">
              <Card className={cn(
                "h-full w-full transition-all duration-200 overflow-hidden",
                editMode && "ring-2 ring-dashed ring-primary/30 hover:ring-primary/50",
                widget.locked && editMode && "ring-muted-foreground/30"
              )}>
                <CardHeader className="py-2 px-3 flex flex-row items-center justify-between space-y-0 bg-muted/30">
                  <div className="flex items-center gap-2">
                    {editMode && !widget.locked && (
                      <div className="widget-drag-handle cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted rounded">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {widget.icon}
                      <span className="truncate">{widget.title}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setExpandedWidget(widget.id)}
                    >
                      <Maximize2 className="w-3 h-3" />
                    </Button>
                    
                    {editMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Settings className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => toggleLock(widget.id)}>
                            {widget.locked ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                            {widget.locked ? "Desbloquear" : "Bloquear"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleRemove(widget.id)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Ocultar Widget
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-3 h-[calc(100%-2.5rem)] overflow-auto">
                  {widget.component}
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .grid-stack {
          background: transparent;
        }
        .grid-stack-item-content {
          background: transparent;
          border-radius: var(--radius);
          overflow: hidden;
        }
        .grid-stack > .grid-stack-item > .grid-stack-item-content {
          inset: 0;
        }
        .grid-stack-item > .ui-resizable-handle {
          background: transparent;
        }
        .grid-stack > .grid-stack-item > .ui-resizable-se {
          width: 16px;
          height: 16px;
          background: hsl(var(--primary));
          border-radius: 2px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .grid-stack > .grid-stack-item:hover > .ui-resizable-se {
          opacity: 0.5;
        }
        .grid-stack-placeholder > .placeholder-content {
          background: hsl(var(--primary) / 0.1);
          border: 2px dashed hsl(var(--primary) / 0.5);
          border-radius: var(--radius);
        }
      `}</style>
    </div>
  );
};

export default GridStackLayout;
