import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Upload, Trash2, User, Loader2, Check, X } from "lucide-react";

interface ProfilePhotoUploadProps {
  userId: string;
  currentPhotoUrl?: string;
  userName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  userType: 'patient' | 'doctor';
  onPhotoChange?: (url: string | null) => void;
}

export const ProfilePhotoUpload = ({
  userId,
  currentPhotoUrl,
  userName,
  size = 'lg',
  userType,
  onPhotoChange
}: ProfilePhotoUploadProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };

  const getInitials = (name?: string): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Archivo inválido",
        description: "Por favor selecciona una imagen",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "La imagen debe ser menor a 5MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    setShowDialog(true);
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${userType}/${userId}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: (url) => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      toast({ title: "Foto actualizada", description: "Tu foto de perfil ha sido actualizada" });
      setShowDialog(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      onPhotoChange?.(url);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo subir la foto",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Delete from storage
      const fileName = `${userType}/${userId}/avatar`;
      await supabase.storage.from('avatars').remove([`${fileName}.jpg`, `${fileName}.png`, `${fileName}.jpeg`]);

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      toast({ title: "Foto eliminada", description: "Tu foto de perfil ha sido eliminada" });
      onPhotoChange?.(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la foto",
        variant: "destructive"
      });
    }
  });

  const cancelUpload = () => {
    setShowDialog(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <>
      <div className="relative group">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`relative ${sizeClasses[size]} cursor-pointer`}
          onClick={() => fileInputRef.current?.click()}
        >
          <Avatar className={`${sizeClasses[size]} border-4 border-background shadow-lg`}>
            <AvatarImage src={currentPhotoUrl || undefined} alt={userName} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          
          {/* Overlay */}
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className={`${iconSizes[size]} text-white`} />
          </div>

          {/* Edit Badge */}
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
            <Upload className="w-4 h-4 text-primary-foreground" />
          </div>
        </motion.div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Delete Button */}
        {currentPhotoUrl && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              deleteMutation.mutate();
            }}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
          </Button>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vista Previa</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-6 py-4">
            {/* Preview */}
            <div className="relative">
              <Avatar className="w-40 h-40 border-4 border-border">
                <AvatarImage src={previewUrl || undefined} alt="Preview" />
                <AvatarFallback>
                  <User className="w-16 h-16 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Esta será tu nueva foto de perfil
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={cancelUpload}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={() => uploadMutation.mutate()}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
