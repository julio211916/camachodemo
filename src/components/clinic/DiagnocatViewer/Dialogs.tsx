import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Download, Info, Box, Layers, MapPin, FileBox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExportOptions } from "./types";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export const UploadDialog = ({ open, onOpenChange, onFileSelect, isLoading }: UploadDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Subir Modelo 3D
          </DialogTitle>
          <DialogDescription>
            Sube archivos STL, OBJ, PLY o DRC
          </DialogDescription>
        </DialogHeader>

        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer 
            transition-all duration-200
            ${dragActive 
              ? 'border-primary bg-primary/10' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50'
            }
          `}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <motion.div
            animate={{ scale: dragActive ? 1.05 : 1 }}
            className="space-y-3"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Arrastra y suelta tu archivo aquí
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                o haz clic para seleccionar
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <FileBox className="w-3 h-3" />
              <span>STL, OBJ, PLY, DRC</span>
            </div>
          </motion.div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".stl,.obj,.ply,.drc"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
            {isLoading ? "Cargando..." : "Seleccionar archivo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => void;
}

export const ExportDialog = ({ open, onOpenChange, onExport }: ExportDialogProps) => {
  const [options, setOptions] = useState<ExportOptions>({
    teeth: true,
    anatomy: true,
    landmarks: false,
    mergeIntoOne: false,
    format: 'stl',
  });

  const handleExport = () => {
    onExport(options);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exportar archivos STL
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Items to export */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Elementos a exportar</Label>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="teeth"
                  checked={options.teeth}
                  onCheckedChange={(checked) => 
                    setOptions({ ...options, teeth: checked as boolean })
                  }
                />
                <label htmlFor="teeth" className="flex items-center gap-2 text-sm cursor-pointer">
                  <span>🦷</span>
                  Dientes
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anatomy"
                  checked={options.anatomy}
                  onCheckedChange={(checked) => 
                    setOptions({ ...options, anatomy: checked as boolean })
                  }
                />
                <label htmlFor="anatomy" className="flex items-center gap-2 text-sm cursor-pointer">
                  <Layers className="w-4 h-4" />
                  Anatomía
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="landmarks"
                  checked={options.landmarks}
                  onCheckedChange={(checked) => 
                    setOptions({ ...options, landmarks: checked as boolean })
                  }
                />
                <label htmlFor="landmarks" className="flex items-center gap-2 text-sm cursor-pointer">
                  <MapPin className="w-4 h-4" />
                  Landmarks
                </label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Merge option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="merge"
              checked={options.mergeIntoOne}
              onCheckedChange={(checked) => 
                setOptions({ ...options, mergeIntoOne: checked as boolean })
              }
            />
            <label htmlFor="merge" className="text-sm cursor-pointer">
              Fusionar en un solo archivo
            </label>
          </div>

          {/* Format selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Formato</Label>
            <Select
              value={options.format}
              onValueChange={(value) => 
                setOptions({ ...options, format: value as 'stl' | 'obj' | 'ply' })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stl">STL</SelectItem>
                <SelectItem value="obj">OBJ</SelectItem>
                <SelectItem value="ply">PLY</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport}>
            Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AboutDialog = ({ open, onOpenChange }: AboutDialogProps) => {
  const [country, setCountry] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Acerca del Visor 3D
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Box className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Visor 3D Dental</h3>
              <p className="text-sm text-muted-foreground">Versión 2.0</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="country">País</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar país" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mx">🇲🇽 México</SelectItem>
                <SelectItem value="us">🇺🇸 Estados Unidos</SelectItem>
                <SelectItem value="es">🇪🇸 España</SelectItem>
                <SelectItem value="ar">🇦🇷 Argentina</SelectItem>
                <SelectItem value="co">🇨🇴 Colombia</SelectItem>
                <SelectItem value="cl">🇨🇱 Chile</SelectItem>
                <SelectItem value="pe">🇵🇪 Perú</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">
            Módulo de visualización 3D avanzado para planificación de tratamientos dentales.
            Soporta modelos STL, OBJ, PLY y DRC con renderizado en tiempo real.
          </p>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Multi-viewport sincronizado (Axial, Coronal, Sagital)</p>
            <p>• Control de color y opacidad por elemento</p>
            <p>• Exportación en múltiples formatos</p>
            <p>• Integración con expediente clínico</p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
