import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, ChevronRight, Eye, EyeOff, Folder, Box, 
  Circle, MapPin, Grid3x3
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SceneObject, COLOR_PALETTE } from "./types";
import { cn } from "@/lib/utils";

interface ColorPickerPopoverProps {
  color: string;
  opacity: number;
  onColorChange: (color: string) => void;
  onOpacityChange: (opacity: number) => void;
  onClose: () => void;
}

const ColorPickerPopover = ({ color, opacity, onColorChange, onOpacityChange, onClose }: ColorPickerPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, scale: 0.95, y: -5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -5 }}
      className="absolute right-0 top-8 z-50 p-3 bg-popover border border-border rounded-lg shadow-xl min-w-[180px]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Current Color Preview */}
      <div className="flex items-center gap-2 mb-3">
        <div 
          className="w-8 h-8 rounded-full border-2 border-border shadow-inner"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs text-muted-foreground">Color actual</span>
      </div>

      {/* Opacity Slider */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Opacidad</span>
          <span className="font-medium">{Math.round(opacity * 100)}%</span>
        </div>
        <Slider
          value={[opacity * 100]}
          onValueChange={([v]) => onOpacityChange(v / 100)}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
      </div>

      <Separator className="my-2" />

      {/* Color Palette */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {COLOR_PALETTE.map((presetColor) => (
          <button
            key={presetColor}
            className={cn(
              "w-7 h-7 rounded-full border-2 transition-all hover:scale-110",
              color === presetColor 
                ? "border-primary ring-2 ring-primary/30" 
                : "border-border/50 hover:border-border"
            )}
            style={{ backgroundColor: presetColor }}
            onClick={() => onColorChange(presetColor)}
          />
        ))}
      </div>

      {/* Custom Color Button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs h-7"
        onClick={() => {
          // Could open a full color picker modal
          onClose();
        }}
      >
        + Color personalizado
      </Button>
    </motion.div>
  );
};

interface ObjectTreeItemProps {
  object: SceneObject;
  level?: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onChangeColor: (id: string, color: string) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
}

export const ObjectTreeItem = ({
  object,
  level = 0,
  selectedId,
  onSelect,
  onToggleVisibility,
  onToggleExpand,
  onChangeColor,
  onChangeOpacity,
}: ObjectTreeItemProps) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const hasChildren = object.children && object.children.length > 0;
  const isSelected = selectedId === object.id;

  const getIcon = () => {
    if (object.type === 'landmark') {
      if (object.icon === 'tooth') return <span className="text-xs">🦷</span>;
      return <Circle className="w-3.5 h-3.5" />;
    }
    if (object.type === 'group') return <Folder className="w-3.5 h-3.5" />;
    return <Box className="w-3.5 h-3.5" />;
  };

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer transition-all",
          "hover:bg-secondary/60",
          isSelected && "bg-primary/20 text-primary"
        )}
        style={{ paddingLeft: `${level * 14 + 8}px` }}
        onClick={() => onSelect(object.id)}
      >
        {/* Expand/Collapse Arrow */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(object.id);
            }}
            className="p-0.5 hover:bg-secondary rounded transition-colors"
          >
            {object.expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Icon */}
        <span className="text-muted-foreground">{getIcon()}</span>

        {/* Name */}
        <span className="flex-1 text-sm truncate font-medium">{object.name}</span>

        {/* Color Picker Trigger */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPicker(!showColorPicker);
            }}
            className={cn(
              "w-4 h-4 rounded border border-border/50 hover:scale-125 transition-transform",
              "shadow-sm"
            )}
            style={{ backgroundColor: object.color }}
          />

          <AnimatePresence>
            {showColorPicker && (
              <ColorPickerPopover
                color={object.color}
                opacity={object.opacity}
                onColorChange={(color) => onChangeColor(object.id, color)}
                onOpacityChange={(opacity) => onChangeOpacity(object.id, opacity)}
                onClose={() => setShowColorPicker(false)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Visibility Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(object.id);
          }}
          className="p-0.5 hover:bg-secondary rounded transition-colors opacity-70 hover:opacity-100"
        >
          {object.visible ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && object.expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {object.children!.map((child) => (
              <ObjectTreeItem
                key={child.id}
                object={child}
                level={level + 1}
                selectedId={selectedId}
                onSelect={onSelect}
                onToggleVisibility={onToggleVisibility}
                onToggleExpand={onToggleExpand}
                onChangeColor={onChangeColor}
                onChangeOpacity={onChangeOpacity}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ObjectTreeProps {
  objects: SceneObject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onChangeColor: (id: string, color: string) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
}

export const ObjectTree = ({
  objects,
  selectedId,
  onSelect,
  onToggleVisibility,
  onToggleExpand,
  onChangeColor,
  onChangeOpacity,
}: ObjectTreeProps) => {
  return (
    <div className="py-1">
      {objects.map((object) => (
        <ObjectTreeItem
          key={object.id}
          object={object}
          selectedId={selectedId}
          onSelect={onSelect}
          onToggleVisibility={onToggleVisibility}
          onToggleExpand={onToggleExpand}
          onChangeColor={onChangeColor}
          onChangeOpacity={onChangeOpacity}
        />
      ))}
    </div>
  );
};

export default ObjectTree;
