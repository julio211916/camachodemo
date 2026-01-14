import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Ruler, Trash2, Eye, EyeOff, Edit2, Check, X, 
  Circle, Crosshair, ArrowRight, Move, PenTool, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface Measurement {
  id: string;
  type: 'distance' | 'angle' | 'area';
  points: { x: number; y: number; z?: number }[];
  value: number;
  unit: string;
  label?: string;
  color: string;
  visible: boolean;
  createdAt: Date;
}

export interface Annotation {
  id: string;
  type: 'point' | 'text' | 'arrow';
  position: { x: number; y: number; z?: number };
  text: string;
  color: string;
  visible: boolean;
  createdAt: Date;
}

interface MeasurementToolsProps {
  measurements: Measurement[];
  annotations: Annotation[];
  activeTool: 'select' | 'measure-distance' | 'measure-angle' | 'annotate-point' | 'annotate-text' | null;
  onToolChange: (tool: MeasurementToolsProps['activeTool']) => void;
  onAddMeasurement: (measurement: Omit<Measurement, 'id' | 'createdAt'>) => void;
  onUpdateMeasurement: (id: string, updates: Partial<Measurement>) => void;
  onDeleteMeasurement: (id: string) => void;
  onAddAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  onClearAll: () => void;
}

const MEASUREMENT_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#a855f7', // purple
  '#06b6d4', // cyan
];

export const MeasurementTools = ({
  measurements,
  annotations,
  activeTool,
  onToolChange,
  onAddMeasurement,
  onUpdateMeasurement,
  onDeleteMeasurement,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onClearAll,
}: MeasurementToolsProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  const tools = [
    { id: 'select' as const, icon: Move, label: 'Seleccionar' },
    { id: 'measure-distance' as const, icon: Ruler, label: 'Medir Distancia' },
    { id: 'measure-angle' as const, icon: Crosshair, label: 'Medir Ángulo' },
    { id: 'annotate-point' as const, icon: Circle, label: 'Marcar Punto' },
    { id: 'annotate-text' as const, icon: MessageSquare, label: 'Añadir Nota' },
  ];

  const handleStartEdit = (id: string, currentLabel: string) => {
    setEditingId(id);
    setEditingLabel(currentLabel || '');
  };

  const handleSaveEdit = (id: string, type: 'measurement' | 'annotation') => {
    if (type === 'measurement') {
      onUpdateMeasurement(id, { label: editingLabel });
    } else {
      onUpdateAnnotation(id, { text: editingLabel });
    }
    setEditingId(null);
    setEditingLabel('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingLabel('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tool Selection */}
      <div className="p-3 border-b">
        <h3 className="text-sm font-semibold mb-3">Herramientas</h3>
        <div className="grid grid-cols-5 gap-1">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                variant={activeTool === tool.id ? "default" : "ghost"}
                size="icon"
                className={cn(
                  "w-full h-9",
                  activeTool === tool.id && "bg-primary text-primary-foreground"
                )}
                onClick={() => onToolChange(activeTool === tool.id ? null : tool.id)}
                title={tool.label}
              >
                <Icon className="w-4 h-4" />
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {activeTool === 'measure-distance' && 'Clic en 2 puntos para medir'}
          {activeTool === 'measure-angle' && 'Clic en 3 puntos para medir ángulo'}
          {activeTool === 'annotate-point' && 'Clic para marcar punto'}
          {activeTool === 'annotate-text' && 'Clic para añadir nota'}
          {!activeTool && 'Selecciona una herramienta'}
        </p>
      </div>

      <ScrollArea className="flex-1">
        {/* Measurements List */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Mediciones ({measurements.length})
            </h4>
            {measurements.length > 0 && (
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onClearAll}>
                Limpiar
              </Button>
            )}
          </div>

          {measurements.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No hay mediciones
            </p>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {measurements.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="bg-secondary/50 rounded-lg p-2"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: m.color }}
                      />
                      
                      {editingId === m.id ? (
                        <div className="flex-1 flex items-center gap-1">
                          <Input
                            value={editingLabel}
                            onChange={(e) => setEditingLabel(e.target.value)}
                            className="h-6 text-xs"
                            placeholder="Etiqueta..."
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSaveEdit(m.id, 'measurement')}>
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancelEdit}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium">
                                {m.label || `Medición ${i + 1}`}
                              </span>
                              <Badge variant="outline" className="text-[10px] h-4">
                                {m.type === 'distance' ? 'Dist' : m.type === 'angle' ? 'Áng' : 'Área'}
                              </Badge>
                            </div>
                            <span className="text-sm font-bold text-primary">
                              {m.value.toFixed(2)} {m.unit}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-0.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleStartEdit(m.id, m.label || '')}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => onUpdateMeasurement(m.id, { visible: !m.visible })}
                            >
                              {m.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => onDeleteMeasurement(m.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <Separator />

        {/* Annotations List */}
        <div className="p-3">
          <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
            <PenTool className="w-4 h-4" />
            Anotaciones ({annotations.length})
          </h4>

          {annotations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No hay anotaciones
            </p>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {annotations.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="bg-secondary/50 rounded-lg p-2"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: a.color }}
                      />
                      
                      {editingId === a.id ? (
                        <div className="flex-1 flex items-center gap-1">
                          <Textarea
                            value={editingLabel}
                            onChange={(e) => setEditingLabel(e.target.value)}
                            className="min-h-[60px] text-xs"
                            placeholder="Nota..."
                            autoFocus
                          />
                          <div className="flex flex-col gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSaveEdit(a.id, 'annotation')}>
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancelEdit}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <div className="flex items-center gap-1 mb-1">
                              <Badge variant="outline" className="text-[10px] h-4">
                                {a.type === 'point' ? 'Punto' : a.type === 'arrow' ? 'Flecha' : 'Nota'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {a.text || `Anotación ${i + 1}`}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-0.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleStartEdit(a.id, a.text || '')}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => onUpdateAnnotation(a.id, { visible: !a.visible })}
                            >
                              {a.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => onDeleteAnnotation(a.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Stats Footer */}
      <div className="p-3 border-t bg-muted/30">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-primary">{measurements.length}</div>
            <div className="text-[10px] text-muted-foreground">Mediciones</div>
          </div>
          <div>
            <div className="text-lg font-bold text-primary">{annotations.length}</div>
            <div className="text-[10px] text-muted-foreground">Anotaciones</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Measurement Overlay Component for displaying measurements on the viewport
export const MeasurementOverlay = ({
  measurements,
  annotations,
  scale = 1,
  offset = { x: 0, y: 0 }
}: {
  measurements: Measurement[];
  annotations: Annotation[];
  scale?: number;
  offset?: { x: number; y: number };
}) => {
  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 30 }}>
      {/* Render Measurements */}
      {measurements.filter(m => m.visible).map((m) => {
        if (m.type === 'distance' && m.points.length >= 2) {
          const p1 = m.points[0];
          const p2 = m.points[1];
          const x1 = p1.x * scale + offset.x;
          const y1 = p1.y * scale + offset.y;
          const x2 = p2.x * scale + offset.x;
          const y2 = p2.y * scale + offset.y;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;

          return (
            <g key={m.id}>
              {/* Line */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={m.color}
                strokeWidth="2"
                strokeDasharray="4,2"
              />
              {/* Endpoints */}
              <circle cx={x1} cy={y1} r="5" fill={m.color} />
              <circle cx={x2} cy={y2} r="5" fill={m.color} />
              {/* Label */}
              <rect
                x={midX - 30}
                y={midY - 12}
                width="60"
                height="20"
                rx="4"
                fill="rgba(0,0,0,0.8)"
              />
              <text
                x={midX}
                y={midY + 4}
                fill={m.color}
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
              >
                {m.value.toFixed(1)} {m.unit}
              </text>
            </g>
          );
        }
        return null;
      })}

      {/* Render Annotations */}
      {annotations.filter(a => a.visible).map((a) => (
        <g key={a.id}>
          {a.type === 'point' && (
            <>
              <circle
                cx={a.position.x * scale + offset.x}
                cy={a.position.y * scale + offset.y}
                r="8"
                fill={a.color}
                stroke="white"
                strokeWidth="2"
              />
              {a.text && (
                <>
                  <rect
                    x={a.position.x * scale + offset.x + 12}
                    y={a.position.y * scale + offset.y - 10}
                    width={a.text.length * 7 + 10}
                    height="20"
                    rx="4"
                    fill="rgba(0,0,0,0.8)"
                  />
                  <text
                    x={a.position.x * scale + offset.x + 17}
                    y={a.position.y * scale + offset.y + 5}
                    fill="white"
                    fontSize="11"
                  >
                    {a.text}
                  </text>
                </>
              )}
            </>
          )}
          {a.type === 'text' && a.text && (
            <>
              <rect
                x={a.position.x * scale + offset.x - 5}
                y={a.position.y * scale + offset.y - 15}
                width={Math.min(a.text.length * 7 + 10, 200)}
                height="25"
                rx="4"
                fill={a.color}
                opacity={0.9}
              />
              <text
                x={a.position.x * scale + offset.x}
                y={a.position.y * scale + offset.y + 2}
                fill="white"
                fontSize="12"
                fontWeight="500"
              >
                {a.text.slice(0, 25)}
              </text>
            </>
          )}
        </g>
      ))}
    </svg>
  );
};

export default MeasurementTools;
