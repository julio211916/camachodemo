import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  Plus,
  User,
  FileText,
  DollarSign,
  Calendar,
  Image,
  Save,
  Printer,
  Trash2
} from "lucide-react";
import { motion } from "framer-motion";

interface FacialZone {
  id: string;
  name: string;
  treatments: string[];
}

interface TreatmentItem {
  id: string;
  zone: string;
  treatment: string;
  units?: number;
  price: number;
  notes: string;
}

const facialZones: FacialZone[] = [
  { id: "forehead", name: "Frente", treatments: ["Botox", "Ácido Hialurónico", "Mesoterapia"] },
  { id: "glabella", name: "Entrecejo", treatments: ["Botox", "Relleno"] },
  { id: "crows_feet", name: "Patas de gallo", treatments: ["Botox", "Peeling"] },
  { id: "cheeks", name: "Pómulos", treatments: ["Ácido Hialurónico", "Hilos tensores"] },
  { id: "nasolabial", name: "Surcos nasogenianos", treatments: ["Ácido Hialurónico", "Relleno"] },
  { id: "lips", name: "Labios", treatments: ["Ácido Hialurónico", "Hidratación"] },
  { id: "chin", name: "Mentón", treatments: ["Ácido Hialurónico", "Botox"] },
  { id: "jawline", name: "Línea mandibular", treatments: ["Hilos tensores", "Radiofrecuencia"] },
  { id: "neck", name: "Cuello", treatments: ["Botox", "Hilos tensores", "Mesoterapia"] }
];

const treatmentPrices: Record<string, number> = {
  "Botox": 250,
  "Ácido Hialurónico": 400,
  "Mesoterapia": 180,
  "Relleno": 350,
  "Peeling": 150,
  "Hilos tensores": 800,
  "Hidratación": 120,
  "Radiofrecuencia": 200
};

interface FacialAestheticsModuleProps {
  patientId?: string;
  patientName?: string;
}

export const FacialAestheticsModule = ({ patientId, patientName }: FacialAestheticsModuleProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("scheme");
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [selectedTreatment, setSelectedTreatment] = useState<string>("");
  const [units, setUnits] = useState<string>("1");
  const [notes, setNotes] = useState("");
  const [treatmentItems, setTreatmentItems] = useState<TreatmentItem[]>([]);

  const addTreatment = () => {
    if (!selectedZone || !selectedTreatment) {
      toast({
        title: "Campos requeridos",
        description: "Selecciona una zona y un tratamiento.",
        variant: "destructive"
      });
      return;
    }

    const zone = facialZones.find(z => z.id === selectedZone);
    const price = treatmentPrices[selectedTreatment] || 0;
    const quantity = parseInt(units) || 1;

    const newItem: TreatmentItem = {
      id: Date.now().toString(),
      zone: zone?.name || selectedZone,
      treatment: selectedTreatment,
      units: quantity,
      price: price * quantity,
      notes: notes
    };

    setTreatmentItems(prev => [...prev, newItem]);
    setSelectedZone("");
    setSelectedTreatment("");
    setUnits("1");
    setNotes("");

    toast({
      title: "Tratamiento agregado",
      description: `${selectedTreatment} en ${zone?.name} añadido al presupuesto.`
    });
  };

  const removeTreatment = (id: string) => {
    setTreatmentItems(prev => prev.filter(item => item.id !== id));
  };

  const totalPrice = treatmentItems.reduce((acc, item) => acc + item.price, 0);

  const selectedZoneData = facialZones.find(z => z.id === selectedZone);

  const saveBudget = () => {
    if (treatmentItems.length === 0) {
      toast({
        title: "Presupuesto vacío",
        description: "Agrega al menos un tratamiento.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Presupuesto guardado",
      description: `Presupuesto de ${totalPrice.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} guardado exitosamente.`
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Estética Facial
            </CardTitle>
            <CardDescription>
              Crea presupuestos con esquema facial completo
              {patientName && <span className="ml-2">• Paciente: {patientName}</span>}
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-pink-500/10 text-pink-600 border-pink-500/30">
            Nuevo
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="scheme" className="gap-2">
              <Image className="w-4 h-4" />
              Esquema Facial
            </TabsTrigger>
            <TabsTrigger value="budget" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Presupuesto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scheme" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Facial Diagram */}
              <div className="space-y-4">
                <Label>Selecciona la zona a tratar</Label>
                <div className="relative bg-secondary/30 rounded-xl p-6 aspect-square flex items-center justify-center">
                  {/* Simplified face diagram with clickable zones */}
                  <div className="relative w-full h-full max-w-[280px]">
                    {/* Face outline */}
                    <div className="absolute inset-0 border-2 border-muted-foreground/20 rounded-[50%_50%_45%_45%]" />
                    
                    {/* Clickable zones */}
                    {facialZones.map((zone, index) => {
                      const positions: Record<string, { top: string; left: string }> = {
                        forehead: { top: "10%", left: "50%" },
                        glabella: { top: "22%", left: "50%" },
                        crows_feet: { top: "30%", left: "15%" },
                        cheeks: { top: "45%", left: "20%" },
                        nasolabial: { top: "55%", left: "35%" },
                        lips: { top: "65%", left: "50%" },
                        chin: { top: "80%", left: "50%" },
                        jawline: { top: "70%", left: "20%" },
                        neck: { top: "95%", left: "50%" }
                      };
                      const pos = positions[zone.id];
                      
                      return (
                        <motion.button
                          key={zone.id}
                          onClick={() => setSelectedZone(zone.id)}
                          className={`absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all ${
                            selectedZone === zone.id
                              ? "bg-primary border-primary scale-110"
                              : treatmentItems.some(t => t.zone === zone.name)
                              ? "bg-green-500 border-green-500"
                              : "bg-secondary border-muted-foreground/30 hover:border-primary/50"
                          }`}
                          style={{ top: pos.top, left: pos.left }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          title={zone.name}
                        >
                          <span className="text-[10px] font-medium text-foreground">
                            {index + 1}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Zone Legend */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {facialZones.map((zone, index) => (
                    <button
                      key={zone.id}
                      onClick={() => setSelectedZone(zone.id)}
                      className={`p-2 rounded-lg text-left transition-colors ${
                        selectedZone === zone.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-secondary"
                      }`}
                    >
                      <span className="font-medium">{index + 1}.</span> {zone.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Treatment Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Zona seleccionada</Label>
                  <Select value={selectedZone} onValueChange={setSelectedZone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una zona" />
                    </SelectTrigger>
                    <SelectContent>
                      {facialZones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedZoneData && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label>Tratamiento</Label>
                      <Select value={selectedTreatment} onValueChange={setSelectedTreatment}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tratamiento" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedZoneData.treatments.map((treatment) => (
                            <SelectItem key={treatment} value={treatment}>
                              {treatment} - {treatmentPrices[treatment]?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Unidades / Sesiones</Label>
                      <Input
                        type="number"
                        min="1"
                        value={units}
                        onChange={(e) => setUnits(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Notas</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Observaciones del tratamiento..."
                        className="min-h-[80px]"
                      />
                    </div>

                    <Button onClick={addTreatment} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar al Presupuesto
                    </Button>
                  </motion.div>
                )}

                {/* Quick Summary */}
                {treatmentItems.length > 0 && (
                  <div className="bg-secondary/50 rounded-lg p-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Tratamientos agregados</span>
                      <Badge>{treatmentItems.length}</Badge>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {totalPrice.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            {treatmentItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>No hay tratamientos en el presupuesto</p>
                <Button 
                  variant="link" 
                  onClick={() => setActiveTab("scheme")}
                >
                  Agregar tratamientos
                </Button>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {treatmentItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 rounded-xl border border-border"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{item.zone}</Badge>
                            <span className="font-medium">{item.treatment}</span>
                          </div>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.units} unidad(es)
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold">
                            {item.price.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTreatment(item.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Total */}
                <div className="bg-primary/10 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">Total del Presupuesto</span>
                    <span className="text-3xl font-bold text-primary">
                      {totalPrice.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1">
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button onClick={saveBudget} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Presupuesto
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
