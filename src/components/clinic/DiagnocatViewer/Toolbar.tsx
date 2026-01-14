import { motion } from "framer-motion";
import { 
  Grid3x3, Crosshair, Sun, Layers, Upload, Download, Info,
  Maximize2, X, RotateCw, Box, Settings, Ruler
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  patientName?: string;
  modelName?: string;
  gridEnabled: boolean;
  crosshairEnabled: boolean;
  lightingIntensity: number;
  objectsPanelOpen: boolean;
  wireframe: boolean;
  autoRotate: boolean;
  isFullscreen: boolean;
  onToggleGrid: () => void;
  onToggleCrosshair: () => void;
  onChangeLighting: (intensity: number) => void;
  onToggleObjectsPanel: () => void;
  onToggleWireframe: () => void;
  onToggleAutoRotate: () => void;
  onUpload: () => void;
  onExport: () => void;
  onAbout: () => void;
  onToggleFullscreen: () => void;
}

export const Toolbar = ({
  patientName,
  modelName,
  gridEnabled,
  crosshairEnabled,
  lightingIntensity,
  objectsPanelOpen,
  wireframe,
  autoRotate,
  isFullscreen,
  onToggleGrid,
  onToggleCrosshair,
  onChangeLighting,
  onToggleObjectsPanel,
  onToggleWireframe,
  onToggleAutoRotate,
  onUpload,
  onExport,
  onAbout,
  onToggleFullscreen,
}: ToolbarProps) => {
  return (
    <TooltipProvider>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between p-3 border-b bg-card/95 backdrop-blur-sm"
      >
        {/* Left: Title & Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Visor 3D Dental</h2>
          </div>
          
          {patientName && (
            <Badge variant="secondary" className="font-medium">
              {patientName}
            </Badge>
          )}
          
          {modelName && (
            <Badge variant="outline" className="text-xs">
              {modelName}
            </Badge>
          )}
        </div>

        {/* Center: Main Tools */}
        <div className="flex items-center gap-1">
          {/* Grid Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={gridEnabled ? "default" : "ghost"}
                size="icon"
                onClick={onToggleGrid}
                className={cn(
                  "w-9 h-9",
                  gridEnabled && "bg-primary/20 text-primary hover:bg-primary/30"
                )}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mostrar/Ocultar Grid</TooltipContent>
          </Tooltip>

          {/* Crosshair Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={crosshairEnabled ? "default" : "ghost"}
                size="icon"
                onClick={onToggleCrosshair}
                className={cn(
                  "w-9 h-9",
                  crosshairEnabled && "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                )}
              >
                <Crosshair className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Activar/Desactivar Crosshair</TooltipContent>
          </Tooltip>

          {/* Lighting Control */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={lightingIntensity > 1 ? "default" : "ghost"}
                size="icon"
                className={cn(
                  "w-9 h-9",
                  lightingIntensity > 1 && "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                )}
              >
                <Sun className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3" align="center">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Iluminación</span>
                  <span className="font-medium">{Math.round(lightingIntensity * 100)}%</span>
                </div>
                <Slider
                  value={[lightingIntensity * 100]}
                  onValueChange={([v]) => onChangeLighting(v / 100)}
                  min={20}
                  max={200}
                  step={10}
                />
              </div>
            </PopoverContent>
          </Popover>

          {/* Objects Panel Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={objectsPanelOpen ? "default" : "ghost"}
                size="icon"
                onClick={onToggleObjectsPanel}
                className={cn(
                  "w-9 h-9",
                  objectsPanelOpen && "bg-primary text-primary-foreground"
                )}
              >
                <Layers className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Panel de Objetos</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* Wireframe Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={wireframe ? "default" : "ghost"}
                size="icon"
                onClick={onToggleWireframe}
                className="w-9 h-9"
              >
                <Ruler className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Modo Wireframe</TooltipContent>
          </Tooltip>

          {/* Auto Rotate Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={autoRotate ? "default" : "ghost"}
                size="icon"
                onClick={onToggleAutoRotate}
                className={cn(
                  "w-9 h-9",
                  autoRotate && "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                )}
              >
                <RotateCw className={cn("w-4 h-4", autoRotate && "animate-spin")} style={{ animationDuration: '3s' }} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Auto Rotación</TooltipContent>
          </Tooltip>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onUpload}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Subir 3D
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>

          <Separator orientation="vertical" className="h-6 mx-2" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onAbout}>
                <Info className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Acerca de</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onToggleFullscreen}>
                {isFullscreen ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>
    </TooltipProvider>
  );
};

export default Toolbar;
