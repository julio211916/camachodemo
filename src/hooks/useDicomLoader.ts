import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getSignedUrl } from '@/hooks/useSignedUrl';
import { parseDicomFile, DicomImageData, renderDicomToImageData, sortDicomSlices } from '@/lib/dicomParser';
import { useToast } from '@/hooks/use-toast';

export interface DicomStudy {
  id: string;
  name: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
  documentType: string;
}

export interface LoadedDicomSeries {
  study: DicomStudy;
  slices: DicomImageData[];
  renderedImages: ImageData[];
}

export const useDicomLoader = (patientId?: string) => {
  const { toast } = useToast();
  const [loadingStudy, setLoadingStudy] = useState<string | null>(null);
  const [loadedSeries, setLoadedSeries] = useState<LoadedDicomSeries | null>(null);
  const [windowCenter, setWindowCenter] = useState<number | undefined>();
  const [windowWidth, setWindowWidth] = useState<number | undefined>();

  // Fetch available DICOM studies for the patient
  const { data: studies = [], isLoading: loadingStudies, refetch } = useQuery({
    queryKey: ['patient-dicom-studies', patientId],
    queryFn: async () => {
      if (!patientId) return [];

      const { data, error } = await supabase
        .from('patient_documents')
        .select('id, file_name, file_url, description, created_at, document_type')
        .eq('patient_id', patientId)
        .in('document_type', ['dicom', 'xray', 'cbct', 'radiograph'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((doc) => ({
        id: doc.id,
        name: doc.description || doc.file_name,
        fileUrl: doc.file_url,
        fileName: doc.file_name,
        createdAt: doc.created_at,
        documentType: doc.document_type,
      }));
    },
    enabled: !!patientId,
  });

  // Load and parse a DICOM file from URL
  const loadStudy = useCallback(async (study: DicomStudy) => {
    setLoadingStudy(study.id);
    
    try {
      // Resolve private storage paths to signed URLs
      const resolvedUrl = (study.fileUrl.startsWith('http://') || study.fileUrl.startsWith('https://'))
        ? study.fileUrl
        : await getSignedUrl('patient-files', study.fileUrl);

      if (!resolvedUrl) throw new Error('Failed to generate signed URL');

      // Fetch the file
      const response = await fetch(resolvedUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch DICOM file');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Check if it's a real DICOM file (starts with DICM at byte 128)
      const headerCheck = new Uint8Array(arrayBuffer, 128, 4);
      const isDicom = String.fromCharCode(...headerCheck) === 'DICM';
      
      if (isDicom) {
        // Parse as DICOM
        const dicomData = await parseDicomFile(arrayBuffer);
        const sortedSlices = [dicomData]; // Single file = single slice for now
        
        // Set initial window values from DICOM
        if (dicomData.windowCenter !== undefined) {
          setWindowCenter(dicomData.windowCenter);
        }
        if (dicomData.windowWidth !== undefined) {
          setWindowWidth(dicomData.windowWidth);
        }
        
        // Render slices
        const renderedImages = sortedSlices.map((slice) =>
          renderDicomToImageData(slice, windowCenter, windowWidth)
        );
        
        setLoadedSeries({
          study,
          slices: sortedSlices,
          renderedImages,
        });
        
        toast({
          title: 'DICOM cargado',
          description: `${dicomData.patientName || study.name} - ${dicomData.width}x${dicomData.height}`,
        });
      } else {
        // It's a regular image, not DICOM
        // Load as regular image and create pseudo-DICOM data
        const blob = new Blob([arrayBuffer]);
        const imageUrl = URL.createObjectURL(blob);
        
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = imageUrl;
        });
        
        // Create canvas to get image data
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        URL.revokeObjectURL(imageUrl);
        
        // Create pseudo-DICOM data for regular images
        const pseudoDicomData: DicomImageData = {
          pixelData: new Uint8Array(img.width * img.height),
          width: img.width,
          height: img.height,
          bitsAllocated: 8,
          bitsStored: 8,
          highBit: 7,
          pixelRepresentation: 0,
          samplesPerPixel: 1,
          photometricInterpretation: 'MONOCHROME2',
          studyDescription: study.name,
        };
        
        setLoadedSeries({
          study,
          slices: [pseudoDicomData],
          renderedImages: [imageData],
        });
        
        toast({
          title: 'Imagen cargada',
          description: `${study.name} - ${img.width}x${img.height}`,
        });
      }
    } catch (error) {
      console.error('Error loading DICOM:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el archivo DICOM',
        variant: 'destructive',
      });
    } finally {
      setLoadingStudy(null);
    }
  }, [toast, windowCenter, windowWidth]);

  // Upload DICOM files
  const uploadDicomFiles = useCallback(async (files: File[]) => {
    if (!patientId) {
      toast({
        title: 'Error',
        description: 'Seleccione un paciente primero',
        variant: 'destructive',
      });
      return;
    }

    const uploadedStudies: DicomStudy[] = [];

    for (const file of files) {
      try {
        const fileName = `${patientId}/${Date.now()}-${file.name}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('patient-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Determine document type
        const isDcm = file.name.toLowerCase().endsWith('.dcm');
        const docType = isDcm ? 'dicom' : 'xray';

        // Save document record (store path only)
        const { data: docData, error: docError } = await supabase
          .from('patient_documents')
          .insert({
            patient_id: patientId,
            file_name: file.name,
            file_url: fileName,
            document_type: docType,
            mime_type: file.type || (isDcm ? 'application/dicom' : 'image/unknown'),
            file_size: file.size,
            description: file.name.replace(/\.[^/.]+$/, ''),
          })
          .select()
          .single();

        if (docError) throw docError;

        uploadedStudies.push({
          id: docData.id,
          name: docData.description,
          fileUrl: docData.file_url,
          fileName: file.name,
          createdAt: docData.created_at,
          documentType: docType,
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        toast({
          title: 'Error',
          description: `No se pudo cargar ${file.name}`,
          variant: 'destructive',
        });
      }
    }

    if (uploadedStudies.length > 0) {
      refetch();
      toast({
        title: 'Archivos cargados',
        description: `${uploadedStudies.length} archivo(s) guardados`,
      });
      
      // Auto-load first uploaded study
      if (uploadedStudies.length === 1) {
        loadStudy(uploadedStudies[0]);
      }
    }
  }, [patientId, toast, refetch, loadStudy]);

  // Update window/level and re-render
  const updateWindowLevel = useCallback((center: number, width: number) => {
    setWindowCenter(center);
    setWindowWidth(width);
    
    if (loadedSeries) {
      const renderedImages = loadedSeries.slices.map((slice) =>
        renderDicomToImageData(slice, center, width)
      );
      setLoadedSeries((prev) => prev ? { ...prev, renderedImages } : null);
    }
  }, [loadedSeries]);

  return {
    studies,
    loadingStudies,
    loadingStudy,
    loadedSeries,
    loadStudy,
    uploadDicomFiles,
    windowCenter,
    windowWidth,
    updateWindowLevel,
    refetch,
  };
};
