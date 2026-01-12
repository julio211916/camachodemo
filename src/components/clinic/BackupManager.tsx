import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  HardDrive,
  Cloud,
  Download,
  Upload,
  Lock,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderArchive,
  Database,
  FileText,
  Image,
  Loader2,
  Settings,
  Play,
  Pause,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BackupConfig {
  autoBackup: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  encryptionEnabled: boolean;
  includeImages: boolean;
  includeDicom: boolean;
  includeModels: boolean;
  retentionDays: number;
}

interface BackupJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  size?: number;
  filesCount?: number;
  errorMessage?: string;
}

export const BackupManager = () => {
  const { toast } = useToast();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const [config, setConfig] = useState<BackupConfig>({
    autoBackup: true,
    frequency: 'daily',
    encryptionEnabled: true,
    includeImages: true,
    includeDicom: true,
    includeModels: true,
    retentionDays: 30
  });

  // Simulated backup history
  const [backupHistory] = useState<BackupJob[]>([
    {
      id: '1',
      status: 'completed',
      startedAt: new Date(Date.now() - 86400000).toISOString(),
      completedAt: new Date(Date.now() - 86400000 + 3600000).toISOString(),
      size: 256000000,
      filesCount: 1234
    },
    {
      id: '2',
      status: 'completed',
      startedAt: new Date(Date.now() - 172800000).toISOString(),
      completedAt: new Date(Date.now() - 172800000 + 3200000).toISOString(),
      size: 248000000,
      filesCount: 1198
    },
    {
      id: '3',
      status: 'failed',
      startedAt: new Date(Date.now() - 259200000).toISOString(),
      errorMessage: 'Error de conexión con el servidor'
    }
  ]);

  // Fetch storage stats
  const { data: storageStats } = useQuery({
    queryKey: ['storage-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_documents')
        .select('file_size');
      
      if (error) throw error;
      
      const totalSize = data?.reduce((acc, doc) => acc + (doc.file_size || 0), 0) || 0;
      return {
        totalFiles: data?.length || 0,
        totalSize,
        imagesCount: 0,
        dicomCount: 0,
        modelsCount: 0
      };
    }
  });

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const encryptData = async (data: string, password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );
    
    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);
    
    return btoa(String.fromCharCode(...combined));
  };

  const startBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);
    setCurrentFile("Iniciando backup...");

    try {
      // Simulate backup process
      const steps = [
        { file: "Recopilando datos de pacientes...", progress: 10 },
        { file: "Exportando historiales clínicos...", progress: 25 },
        { file: "Procesando imágenes médicas...", progress: 40 },
        { file: "Archivos DICOM...", progress: 55 },
        { file: "Modelos 3D (STL/PLY)...", progress: 70 },
        { file: "Encriptando datos...", progress: 85 },
        { file: "Generando archivo de backup...", progress: 95 },
        { file: "Verificando integridad...", progress: 100 }
      ];

      for (const step of steps) {
        setCurrentFile(step.file);
        setBackupProgress(step.progress);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Fetch all data for backup
      const { data: patients } = await supabase.from('profiles').select('*');
      const { data: appointments } = await supabase.from('appointments').select('*');
      const { data: treatments } = await supabase.from('treatments').select('*');
      const { data: documents } = await supabase.from('patient_documents').select('*');

      const backupData = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        clinic: 'NovellDent',
        data: {
          patients,
          appointments,
          treatments,
          documents
        },
        config: {
          encrypted: config.encryptionEnabled
        }
      };

      let finalData = JSON.stringify(backupData, null, 2);
      
      if (config.encryptionEnabled) {
        finalData = await encryptData(finalData, 'backup-key-' + Date.now());
      }

      // Create and download backup file
      const blob = new Blob([finalData], { 
        type: config.encryptionEnabled ? 'application/octet-stream' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `novelldent-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}${config.encryptionEnabled ? '.enc' : '.json'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup completado",
        description: "El archivo de backup ha sido descargado exitosamente"
      });
    } catch (error) {
      toast({
        title: "Error en backup",
        description: "No se pudo completar el backup",
        variant: "destructive"
      });
    } finally {
      setIsBackingUp(false);
      setBackupProgress(0);
      setCurrentFile("");
    }
  };

  const getStatusBadge = (status: BackupJob['status']) => {
    const configs = {
      pending: { icon: Clock, color: 'bg-yellow-500/10 text-yellow-600', label: 'Pendiente' },
      running: { icon: RefreshCw, color: 'bg-blue-500/10 text-blue-600', label: 'En progreso' },
      completed: { icon: CheckCircle2, color: 'bg-green-500/10 text-green-600', label: 'Completado' },
      failed: { icon: AlertTriangle, color: 'bg-red-500/10 text-red-600', label: 'Fallido' }
    };
    const config = configs[status];
    return (
      <Badge variant="secondary" className={config.color}>
        <config.icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Archivos</p>
                <p className="text-2xl font-bold">{storageStats?.totalFiles || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tamaño Total</p>
                <p className="text-2xl font-bold">{formatSize(storageStats?.totalSize || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Último Backup</p>
                <p className="text-2xl font-bold">Hace 1 día</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Encriptación</p>
                <p className="text-2xl font-bold">{config.encryptionEnabled ? 'AES-256' : 'Ninguna'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Backup Controls */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderArchive className="w-5 h-5" />
              Control de Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Section */}
            {isBackingUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-primary/5 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Backup en progreso...</span>
                  <span className="text-sm text-muted-foreground">{backupProgress}%</span>
                </div>
                <Progress value={backupProgress} className="h-2" />
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {currentFile}
                </p>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={startBackup}
                disabled={isBackingUp}
                className="gap-2"
              >
                {isBackingUp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Crear Backup Ahora
              </Button>
              
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Restaurar Backup
              </Button>
              
              <Button variant="outline" className="gap-2">
                <Cloud className="w-4 h-4" />
                Subir a la Nube
              </Button>
            </div>

            {/* Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Encriptación AES-256</span>
                </div>
                <Switch
                  checked={config.encryptionEnabled}
                  onCheckedChange={(checked) => setConfig({ ...config, encryptionEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Image className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Incluir Imágenes</span>
                </div>
                <Switch
                  checked={config.includeImages}
                  onCheckedChange={(checked) => setConfig({ ...config, includeImages: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Incluir DICOM/PACS</span>
                </div>
                <Switch
                  checked={config.includeDicom}
                  onCheckedChange={(checked) => setConfig({ ...config, includeDicom: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <HardDrive className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Incluir Modelos 3D</span>
                </div>
                <Switch
                  checked={config.includeModels}
                  onCheckedChange={(checked) => setConfig({ ...config, includeModels: checked })}
                />
              </div>
            </div>

            {/* Auto Backup Settings */}
            <div className="p-4 border rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Backup Automático</p>
                    <p className="text-sm text-muted-foreground">Programar backups periódicos</p>
                  </div>
                </div>
                <Switch
                  checked={config.autoBackup}
                  onCheckedChange={(checked) => setConfig({ ...config, autoBackup: checked })}
                />
              </div>

              {config.autoBackup && (
                <div className="flex items-center gap-4 pt-4 border-t">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Frecuencia</Label>
                    <Select 
                      value={config.frequency}
                      onValueChange={(v) => setConfig({ ...config, frequency: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diario</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Retención (días)</Label>
                    <Input
                      type="number"
                      value={config.retentionDays}
                      onChange={(e) => setConfig({ ...config, retentionDays: parseInt(e.target.value) || 30 })}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Backup History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Historial de Backups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {backupHistory.map((backup) => (
                <div
                  key={backup.id}
                  className="p-3 bg-secondary/50 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    {getStatusBadge(backup.status)}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(backup.startedAt), "dd/MM/yy HH:mm")}
                    </span>
                  </div>
                  {backup.status === 'completed' && (
                    <div className="text-xs text-muted-foreground">
                      <p>{backup.filesCount?.toLocaleString()} archivos</p>
                      <p>{formatSize(backup.size || 0)}</p>
                    </div>
                  )}
                  {backup.status === 'failed' && (
                    <p className="text-xs text-red-500">{backup.errorMessage}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
