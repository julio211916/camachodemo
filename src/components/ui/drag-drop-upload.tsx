import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileIcon, Image, File, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Progress } from "./progress";

interface FileWithPreview extends File {
  preview?: string;
  progress?: number;
  status?: 'uploading' | 'complete' | 'error';
}

interface DragDropUploadProps {
  onFilesSelected: (files: File[]) => void;
  onFileUpload?: (file: File) => Promise<string>;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
}

export function DragDropUpload({
  onFilesSelected,
  onFileUpload,
  accept = "*",
  multiple = true,
  maxFiles = 10,
  maxSize = 10,
  className,
  disabled = false
}: DragDropUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFiles = useCallback(async (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      if (file.size > maxSize * 1024 * 1024) {
        console.warn(`File ${file.name} exceeds ${maxSize}MB limit`);
        return false;
      }
      return true;
    }).slice(0, maxFiles - files.length);

    const filesWithPreview: FileWithPreview[] = validFiles.map(file => {
      const fileWithPreview = file as FileWithPreview;
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }
      fileWithPreview.status = 'uploading';
      fileWithPreview.progress = 0;
      return fileWithPreview;
    });

    setFiles(prev => [...prev, ...filesWithPreview]);
    onFilesSelected(validFiles);

    // Simulate upload progress if onFileUpload provided
    if (onFileUpload) {
      for (const file of filesWithPreview) {
        try {
          // Simulate progress
          for (let i = 0; i <= 100; i += 20) {
            await new Promise(r => setTimeout(r, 100));
            setFiles(prev => prev.map(f => 
              f.name === file.name ? { ...f, progress: i } : f
            ));
          }
          
          await onFileUpload(file);
          
          setFiles(prev => prev.map(f => 
            f.name === file.name ? { ...f, status: 'complete', progress: 100 } : f
          ));
        } catch (error) {
          setFiles(prev => prev.map(f => 
            f.name === file.name ? { ...f, status: 'error' } : f
          ));
        }
      }
    }
  }, [files.length, maxFiles, maxSize, onFilesSelected, onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, [disabled, processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      processFiles(selectedFiles);
    }
  }, [processFiles]);

  const removeFile = useCallback((fileName: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.name === fileName);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.name !== fileName);
    });
  }, []);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-5 h-5" />;
    return <FileIcon className="w-5 h-5" />;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          isDragging 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        animate={{ scale: isDragging ? 1.02 : 1 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
            isDragging ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            <Upload className="w-6 h-6" />
          </div>
          
          <div>
            <p className="font-medium">
              {isDragging ? "Suelta los archivos aquí" : "Arrastra y suelta archivos"}
            </p>
            <p className="text-sm text-muted-foreground">
              o haz clic para seleccionar (máx. {maxSize}MB)
            </p>
          </div>
        </div>
      </motion.div>

      {/* File List */}
      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((file) => (
              <motion.div
                key={file.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                {/* Preview or Icon */}
                {file.preview ? (
                  <img 
                    src={file.preview} 
                    alt={file.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                    {getFileIcon(file)}
                  </div>
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {file.status === 'uploading' && file.progress !== undefined && (
                    <Progress value={file.progress} className="h-1 mt-1" />
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {file.status === 'uploading' && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                  {file.status === 'complete' && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DragDropUpload;
