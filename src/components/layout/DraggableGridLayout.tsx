import { useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { 
  GripVertical, Maximize2, Minimize2, X, Settings, 
  Plus, LayoutGrid, Columns, Rows, Square, Lock, Unlock
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

export interface GridWidget {
  id: string;
  title: string;
  icon?: ReactNode;
  component: ReactNode;
  colSpan: 1 | 2 | 3 | 4;
  rowSpan: 1 | 2 | 3;
  minColSpan?: 1 | 2;
  minRowSpan?: 1 | 2;
  locked?: boolean;
  visible?: boolean;
}

interface DraggableGridLayoutProps {
  widgets: GridWidget[];
  onWidgetsChange: (widgets: GridWidget[]) => void;
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

const COLUMN_CLASSES = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

const GAP_CLASSES = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

const SPAN_CLASSES = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
};

const ROW_SPAN_CLASSES = {
  1: 'row-span-1',
  2: 'row-span-2',
  3: 'row-span-3',
};

export const DraggableGridLayout = ({
  widgets,
  onWidgetsChange,
  columns = 4,
  gap = 'md',
  editable = true
}: DraggableGridLayoutProps) => {
  const [editMode, setEditMode] = useState(false);
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

  const visibleWidgets = widgets.filter(w => w.visible !== false);

  const handleResize = useCallback((id: string, colSpan: 1 | 2 | 3 | 4, rowSpan: 1 | 2 | 3) => {
    onWidgetsChange(widgets.map(w => 
      w.id === id ? { ...w, colSpan, rowSpan } : w
    ));
  }, [widgets, onWidgetsChange]);

  const handleRemove = useCallback((id: string) => {
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
    onWidgetsChange(widgets.map(w => 
      w.id === id ? { ...w, locked: !w.locked } : w
    ));
  }, [widgets, onWidgetsChange]);

  const handleDragStart = (id: string) => {
    setDraggedWidget(id);
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
  };

  const handleReorder = (newOrder: GridWidget[]) => {
    onWidgetsChange(newOrder);
  };

  const hiddenWidgets = widgets.filter(w => w.visible === false);

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
              {editMode ? "Listo" : "Editar Layout"}
            </Button>
            
            {editMode && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Columns className="w-4 h-4" />
                      {columns} Columnas
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {[2, 3, 4].map(col => (
                      <DropdownMenuItem key={col} onClick={() => {}}>
                        {col} Columnas
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
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
                <DropdownMenuContent align="end">
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

      {/* Grid */}
      <Reorder.Group
        axis="y"
        values={visibleWidgets}
        onReorder={handleReorder}
        className={cn(
          "grid auto-rows-min",
          COLUMN_CLASSES[columns],
          GAP_CLASSES[gap]
        )}
      >
        {visibleWidgets.map((widget) => (
          <Reorder.Item
            key={widget.id}
            value={widget}
            dragListener={editMode && !widget.locked}
            onDragStart={() => handleDragStart(widget.id)}
            onDragEnd={handleDragEnd}
            className={cn(
              SPAN_CLASSES[widget.colSpan],
              ROW_SPAN_CLASSES[widget.rowSpan],
              draggedWidget === widget.id && "opacity-50",
              "min-h-[200px]"
            )}
          >
            <Card className={cn(
              "h-full transition-all duration-200",
              editMode && "ring-2 ring-dashed ring-primary/30",
              editMode && !widget.locked && "cursor-move",
              widget.locked && editMode && "ring-muted-foreground/30"
            )}>
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  {editMode && !widget.locked && (
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  )}
                  {widget.icon}
                  <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setExpandedWidget(widget.id)}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </Button>
                  
                  {editMode && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Settings className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggleLock(widget.id)}>
                          {widget.locked ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                          {widget.locked ? "Desbloquear" : "Bloquear"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                          Tamaño
                        </DropdownMenuItem>
                        {[1, 2, 3, 4].map(span => (
                          <DropdownMenuItem 
                            key={span} 
                            onClick={() => handleResize(widget.id, span as 1|2|3|4, widget.rowSpan)}
                          >
                            <Square className="w-4 h-4 mr-2" />
                            {span} {span === 1 ? 'Columna' : 'Columnas'}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        {[1, 2, 3].map(span => (
                          <DropdownMenuItem 
                            key={span} 
                            onClick={() => handleResize(widget.id, widget.colSpan, span as 1|2|3)}
                          >
                            <Rows className="w-4 h-4 mr-2" />
                            {span} {span === 1 ? 'Fila' : 'Filas'}
                          </DropdownMenuItem>
                        ))}
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
              <CardContent className="p-4 pt-0 h-[calc(100%-3rem)] overflow-auto">
                {widget.component}
              </CardContent>
            </Card>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
};

export default DraggableGridLayout;
