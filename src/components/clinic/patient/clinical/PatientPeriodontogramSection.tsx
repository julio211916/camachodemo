import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, Printer, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientPeriodontogramSectionProps {
  patientId: string;
  patientName: string;
}

interface ToothPerioData {
  pocket_depth_vestibular: number[];
  pocket_depth_lingual: number[];
  recession_vestibular: number[];
  recession_lingual: number[];
  bleeding: boolean;
  suppuration: boolean;
  mobility: number;
  furcation: number;
}

const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const defaultPerioData: ToothPerioData = {
  pocket_depth_vestibular: [0, 0, 0],
  pocket_depth_lingual: [0, 0, 0],
  recession_vestibular: [0, 0, 0],
  recession_lingual: [0, 0, 0],
  bleeding: false,
  suppuration: false,
  mobility: 0,
  furcation: 0
};

export const PatientPeriodontogramSection = ({ patientId, patientName }: PatientPeriodontogramSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [perioData, setPerioData] = useState<{ [tooth: number]: ToothPerioData }>({});
  const [selectedVersion, setSelectedVersion] = useState<string>('current');

  // Fetch periodontogram data
  const { data: fetchedData = [], isLoading } = useQuery({
    queryKey: ['periodontogram', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('periodontogram')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch history versions
  const { data: versions = [] } = useQuery({
    queryKey: ['periodontogram-history', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('periodontogram_history')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Transform fetched data
  useEffect(() => {
    const newPerioData: { [tooth: number]: ToothPerioData } = {};
    
    // Initialize all teeth with default data
    [...upperTeeth, ...lowerTeeth].forEach(tooth => {
      newPerioData[tooth] = { ...defaultPerioData };
    });

    // Override with fetched data
    fetchedData.forEach((record: any) => {
      newPerioData[record.tooth_number] = {
        pocket_depth_vestibular: record.pocket_depth_vestibular || [0, 0, 0],
        pocket_depth_lingual: record.pocket_depth_lingual || [0, 0, 0],
        recession_vestibular: record.recession_vestibular || [0, 0, 0],
        recession_lingual: record.recession_lingual || [0, 0, 0],
        bleeding: record.bleeding || false,
        suppuration: record.suppuration || false,
        mobility: record.mobility || 0,
        furcation: record.furcation || 0
      };
    });

    setPerioData(newPerioData);
  }, [fetchedData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Save history version first
      const historyData = Object.entries(perioData).map(([tooth, data]) => ({
        tooth_number: parseInt(tooth),
        ...data
      }));

      await supabase.from('periodontogram_history').insert({
        patient_id: patientId,
        data: historyData,
        version_number: (versions.length || 0) + 1
      });

      // Delete existing records
      await supabase.from('periodontogram').delete().eq('patient_id', patientId);

      // Insert new records
      const records = Object.entries(perioData).map(([tooth, data]) => ({
        patient_id: patientId,
        tooth_number: parseInt(tooth),
        pocket_depth_vestibular: data.pocket_depth_vestibular,
        pocket_depth_lingual: data.pocket_depth_lingual,
        recession_vestibular: data.recession_vestibular,
        recession_lingual: data.recession_lingual,
        bleeding: data.bleeding,
        suppuration: data.suppuration,
        mobility: data.mobility,
        furcation: data.furcation
      }));

      const { error } = await supabase.from('periodontogram').insert(records);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodontogram', patientId] });
      queryClient.invalidateQueries({ queryKey: ['periodontogram-history', patientId] });
      toast({ title: "Periodontograma guardado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateToothData = (
    tooth: number, 
    field: keyof ToothPerioData, 
    value: any, 
    index?: number
  ) => {
    setPerioData(prev => {
      const current = prev[tooth] || { ...defaultPerioData };
      
      if (index !== undefined && Array.isArray(current[field])) {
        const newArr = [...(current[field] as number[])];
        newArr[index] = value;
        return { ...prev, [tooth]: { ...current, [field]: newArr } };
      }
      
      return { ...prev, [tooth]: { ...current, [field]: value } };
    });
  };

  const calculateNIC = (pocketDepth: number[], recession: number[]): number[] => {
    return pocketDepth.map((pd, i) => pd + recession[i]);
  };

  const getPocketClass = (value: number): string => {
    if (value <= 3) return "text-green-600";
    if (value <= 5) return "text-yellow-600";
    return "text-red-600";
  };

  // Tooth Row Component
  const ToothRow = ({ tooth, isUpper }: { tooth: number; isUpper: boolean }) => {
    const data = perioData[tooth] || { ...defaultPerioData };
    const nicVest = calculateNIC(data.pocket_depth_vestibular, data.recession_vestibular);
    const nicLing = calculateNIC(data.pocket_depth_lingual, data.recession_lingual);

    return (
      <div className="grid grid-cols-12 gap-1 items-center py-1 border-b text-sm">
        {/* Tooth Number */}
        <div className="col-span-1 font-medium text-center">{tooth}</div>

        {/* Vestibular Pocket Depth */}
        <div className="col-span-2 flex gap-1">
          {[0, 1, 2].map(i => (
            <Input
              key={`pd-v-${i}`}
              type="number"
              min="0"
              max="15"
              value={data.pocket_depth_vestibular[i]}
              onChange={(e) => updateToothData(tooth, 'pocket_depth_vestibular', parseInt(e.target.value) || 0, i)}
              className={cn("w-10 h-7 text-center p-0", getPocketClass(data.pocket_depth_vestibular[i]))}
            />
          ))}
        </div>

        {/* Vestibular Recession */}
        <div className="col-span-2 flex gap-1">
          {[0, 1, 2].map(i => (
            <Input
              key={`rec-v-${i}`}
              type="number"
              min="0"
              max="15"
              value={data.recession_vestibular[i]}
              onChange={(e) => updateToothData(tooth, 'recession_vestibular', parseInt(e.target.value) || 0, i)}
              className="w-10 h-7 text-center p-0"
            />
          ))}
        </div>

        {/* Vestibular NIC (calculated) */}
        <div className="col-span-2 flex gap-1">
          {nicVest.map((n, i) => (
            <div key={i} className="w-10 h-7 flex items-center justify-center text-xs bg-muted rounded">
              {n}
            </div>
          ))}
        </div>

        {/* Furcation */}
        <div className="col-span-1">
          <Select
            value={data.furcation.toString()}
            onValueChange={(v) => updateToothData(tooth, 'furcation', parseInt(v))}
          >
            <SelectTrigger className="h-7 w-12 p-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3].map(f => (
                <SelectItem key={f} value={f.toString()}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bleeding */}
        <div className="col-span-1 flex justify-center">
          <Checkbox
            checked={data.bleeding}
            onCheckedChange={(v) => updateToothData(tooth, 'bleeding', !!v)}
          />
        </div>

        {/* Suppuration */}
        <div className="col-span-1 flex justify-center">
          <Checkbox
            checked={data.suppuration}
            onCheckedChange={(v) => updateToothData(tooth, 'suppuration', !!v)}
          />
        </div>

        {/* Mobility */}
        <div className="col-span-1">
          <Select
            value={data.mobility.toString()}
            onValueChange={(v) => updateToothData(tooth, 'mobility', parseInt(v))}
          >
            <SelectTrigger className="h-7 w-12 p-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3].map(m => (
                <SelectItem key={m} value={m.toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Periodontograma</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedVersion} onValueChange={setSelectedVersion}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Versión actual" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Versión actual</SelectItem>
                {versions.map((v: any, i: number) => (
                  <SelectItem key={v.id} value={v.id}>
                    Versión {versions.length - i} - {new Date(v.recorded_at).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => window.print()}>
              <Printer className="w-4 h-4" />
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Guardar</>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[600px]">
          {/* Header */}
          <div className="grid grid-cols-12 gap-1 items-center py-2 bg-muted rounded-t-lg text-xs font-medium sticky top-0">
            <div className="col-span-1 text-center">Pieza</div>
            <div className="col-span-2 text-center">Prof. Surco (V)</div>
            <div className="col-span-2 text-center">Recesión (V)</div>
            <div className="col-span-2 text-center">NIC</div>
            <div className="col-span-1 text-center">Furca</div>
            <div className="col-span-1 text-center">Sang.</div>
            <div className="col-span-1 text-center">Sup.</div>
            <div className="col-span-1 text-center">Mov.</div>
          </div>

          {/* Upper Arch */}
          <div className="mb-6">
            <h4 className="font-medium my-2 text-sm text-muted-foreground">Maxilar Superior</h4>
            {upperTeeth.map(tooth => (
              <ToothRow key={tooth} tooth={tooth} isUpper={true} />
            ))}
          </div>

          {/* Lower Arch */}
          <div>
            <h4 className="font-medium my-2 text-sm text-muted-foreground">Maxilar Inferior</h4>
            {lowerTeeth.map(tooth => (
              <ToothRow key={tooth} tooth={tooth} isUpper={false} />
            ))}
          </div>
        </ScrollArea>

        {/* Legend */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs">
          <div className="flex flex-wrap gap-4">
            <span><strong>Prof. Surco:</strong> Profundidad del surco (mm)</span>
            <span><strong>NIC:</strong> Nivel de inserción clínica (calculado)</span>
            <span><strong>Furca:</strong> Grado de furcación (0-3)</span>
            <span><strong>Sang.:</strong> Sangrado al sondaje</span>
            <span><strong>Sup.:</strong> Supuración</span>
            <span><strong>Mov.:</strong> Movilidad (0-3)</span>
          </div>
          <div className="flex gap-4 mt-2">
            <span className="text-green-600">● Normal (≤3mm)</span>
            <span className="text-yellow-600">● Moderado (4-5mm)</span>
            <span className="text-red-600">● Severo (≥6mm)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
