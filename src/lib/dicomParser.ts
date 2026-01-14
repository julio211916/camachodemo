import dicomParser from 'dicom-parser';

export interface DicomImageData {
  pixelData: Uint8Array | Uint16Array | Int16Array;
  width: number;
  height: number;
  bitsAllocated: number;
  bitsStored: number;
  highBit: number;
  pixelRepresentation: number;
  samplesPerPixel: number;
  photometricInterpretation: string;
  windowCenter?: number;
  windowWidth?: number;
  rescaleSlope?: number;
  rescaleIntercept?: number;
  instanceNumber?: number;
  sliceLocation?: number;
  imagePositionPatient?: number[];
  imageOrientationPatient?: number[];
  patientName?: string;
  studyDescription?: string;
  seriesDescription?: string;
}

export interface DicomSeriesInfo {
  seriesInstanceUID: string;
  seriesDescription?: string;
  modality?: string;
  slices: DicomImageData[];
}

/**
 * Parse a DICOM file and extract image data and metadata
 */
export const parseDicomFile = async (file: File | ArrayBuffer): Promise<DicomImageData> => {
  const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
  const byteArray = new Uint8Array(arrayBuffer);
  
  // Parse the DICOM file
  const dataSet = dicomParser.parseDicom(byteArray);
  
  // Extract image dimensions
  const rows = dataSet.uint16('x00280010') || 0;
  const columns = dataSet.uint16('x00280011') || 0;
  const bitsAllocated = dataSet.uint16('x00280100') || 16;
  const bitsStored = dataSet.uint16('x00280101') || 12;
  const highBit = dataSet.uint16('x00280102') || 11;
  const pixelRepresentation = dataSet.uint16('x00280103') || 0;
  const samplesPerPixel = dataSet.uint16('x00280002') || 1;
  const photometricInterpretation = dataSet.string('x00280004') || 'MONOCHROME2';
  
  // Window/Level values
  const windowCenter = dataSet.floatString('x00281050');
  const windowWidth = dataSet.floatString('x00281051');
  const rescaleSlope = dataSet.floatString('x00281053') ?? 1;
  const rescaleIntercept = dataSet.floatString('x00281052') ?? 0;
  
  // Slice position info
  const instanceNumber = dataSet.intString('x00200013');
  const sliceLocation = dataSet.floatString('x00201041');
  
  // Image position and orientation
  const imagePositionPatientStr = dataSet.string('x00200032');
  const imageOrientationPatientStr = dataSet.string('x00200037');
  
  const imagePositionPatient = imagePositionPatientStr
    ? imagePositionPatientStr.split('\\').map(Number)
    : undefined;
  const imageOrientationPatient = imageOrientationPatientStr
    ? imageOrientationPatientStr.split('\\').map(Number)
    : undefined;
  
  // Patient and study info
  const patientName = dataSet.string('x00100010');
  const studyDescription = dataSet.string('x00081030');
  const seriesDescription = dataSet.string('x0008103e');
  
  // Get pixel data
  const pixelDataElement = dataSet.elements.x7fe00010;
  if (!pixelDataElement) {
    throw new Error('No pixel data found in DICOM file');
  }
  
  let pixelData: Uint8Array | Uint16Array | Int16Array;
  
  if (bitsAllocated === 8) {
    pixelData = new Uint8Array(
      byteArray.buffer,
      pixelDataElement.dataOffset,
      pixelDataElement.length
    );
  } else if (bitsAllocated === 16) {
    if (pixelRepresentation === 0) {
      pixelData = new Uint16Array(
        byteArray.buffer,
        pixelDataElement.dataOffset,
        pixelDataElement.length / 2
      );
    } else {
      pixelData = new Int16Array(
        byteArray.buffer,
        pixelDataElement.dataOffset,
        pixelDataElement.length / 2
      );
    }
  } else {
    throw new Error(`Unsupported bits allocated: ${bitsAllocated}`);
  }
  
  return {
    pixelData,
    width: columns,
    height: rows,
    bitsAllocated,
    bitsStored,
    highBit,
    pixelRepresentation,
    samplesPerPixel,
    photometricInterpretation,
    windowCenter,
    windowWidth,
    rescaleSlope,
    rescaleIntercept,
    instanceNumber,
    sliceLocation,
    imagePositionPatient,
    imageOrientationPatient,
    patientName,
    studyDescription,
    seriesDescription,
  };
};

/**
 * Render DICOM image data to an ImageData object for canvas display
 */
export const renderDicomToImageData = (
  dicomData: DicomImageData,
  windowCenter?: number,
  windowWidth?: number
): ImageData => {
  const { pixelData, width, height, photometricInterpretation, rescaleSlope = 1, rescaleIntercept = 0 } = dicomData;
  
  // Use provided window values or DICOM defaults or calculate from data
  const wc = windowCenter ?? dicomData.windowCenter ?? calculateDefaultWindowCenter(pixelData, rescaleSlope, rescaleIntercept);
  const ww = windowWidth ?? dicomData.windowWidth ?? calculateDefaultWindowWidth(pixelData, rescaleSlope, rescaleIntercept);
  
  const imageData = new ImageData(width, height);
  const data = imageData.data;
  
  const minValue = wc - ww / 2;
  const maxValue = wc + ww / 2;
  const range = maxValue - minValue;
  
  for (let i = 0; i < pixelData.length; i++) {
    // Apply rescale
    let value = pixelData[i] * rescaleSlope + rescaleIntercept;
    
    // Apply window/level
    let normalized: number;
    if (value <= minValue) {
      normalized = 0;
    } else if (value >= maxValue) {
      normalized = 255;
    } else {
      normalized = ((value - minValue) / range) * 255;
    }
    
    // Handle inverted photometric interpretation
    if (photometricInterpretation === 'MONOCHROME1') {
      normalized = 255 - normalized;
    }
    
    const pixelIndex = i * 4;
    data[pixelIndex] = normalized;     // R
    data[pixelIndex + 1] = normalized; // G
    data[pixelIndex + 2] = normalized; // B
    data[pixelIndex + 3] = 255;        // A
  }
  
  return imageData;
};

/**
 * Calculate default window center from pixel data
 */
const calculateDefaultWindowCenter = (
  pixelData: Uint8Array | Uint16Array | Int16Array,
  slope: number,
  intercept: number
): number => {
  let sum = 0;
  const sampleSize = Math.min(pixelData.length, 10000);
  const step = Math.floor(pixelData.length / sampleSize);
  
  for (let i = 0; i < pixelData.length; i += step) {
    sum += pixelData[i] * slope + intercept;
  }
  
  return sum / (pixelData.length / step);
};

/**
 * Calculate default window width from pixel data
 */
const calculateDefaultWindowWidth = (
  pixelData: Uint8Array | Uint16Array | Int16Array,
  slope: number,
  intercept: number
): number => {
  let min = Infinity;
  let max = -Infinity;
  const sampleSize = Math.min(pixelData.length, 10000);
  const step = Math.floor(pixelData.length / sampleSize);
  
  for (let i = 0; i < pixelData.length; i += step) {
    const value = pixelData[i] * slope + intercept;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  
  return (max - min) * 0.8; // Use 80% of range for better contrast
};

/**
 * Sort DICOM slices by instance number or slice location
 */
export const sortDicomSlices = (slices: DicomImageData[]): DicomImageData[] => {
  return [...slices].sort((a, b) => {
    // First try slice location
    if (a.sliceLocation !== undefined && b.sliceLocation !== undefined) {
      return a.sliceLocation - b.sliceLocation;
    }
    // Fall back to instance number
    if (a.instanceNumber !== undefined && b.instanceNumber !== undefined) {
      return a.instanceNumber - b.instanceNumber;
    }
    // Use image position patient Z coordinate
    if (a.imagePositionPatient && b.imagePositionPatient) {
      return a.imagePositionPatient[2] - b.imagePositionPatient[2];
    }
    return 0;
  });
};

/**
 * Create coronal and sagittal views from axial slices (Full MPR implementation)
 * This reconstructs orthogonal views from a volume of axial slices
 */
export const createMPRViews = (
  axialSlices: DicomImageData[],
  windowCenter?: number,
  windowWidth?: number
): { coronal: ImageData[]; sagittal: ImageData[] } => {
  if (axialSlices.length < 2) {
    return { coronal: [], sagittal: [] };
  }
  
  const sortedSlices = sortDicomSlices(axialSlices);
  const width = sortedSlices[0].width;
  const height = sortedSlices[0].height;
  const depth = sortedSlices.length;
  
  // Create 3D volume from axial slices
  const volume = createVolumeFromSlices(sortedSlices);
  
  // Get window/level values
  const wc = windowCenter ?? sortedSlices[0].windowCenter ?? calculateDefaultWindowCenter(sortedSlices[0].pixelData, sortedSlices[0].rescaleSlope ?? 1, sortedSlices[0].rescaleIntercept ?? 0);
  const ww = windowWidth ?? sortedSlices[0].windowWidth ?? calculateDefaultWindowWidth(sortedSlices[0].pixelData, sortedSlices[0].rescaleSlope ?? 1, sortedSlices[0].rescaleIntercept ?? 0);
  const rescaleSlope = sortedSlices[0].rescaleSlope ?? 1;
  const rescaleIntercept = sortedSlices[0].rescaleIntercept ?? 0;
  const photometricInterpretation = sortedSlices[0].photometricInterpretation;
  
  // Generate coronal views (one for each row of the axial image)
  const coronalViews: ImageData[] = [];
  for (let coronalY = 0; coronalY < height; coronalY++) {
    const coronalImage = new ImageData(width, depth);
    
    for (let z = 0; z < depth; z++) {
      for (let x = 0; x < width; x++) {
        const volumeIndex = z * (width * height) + coronalY * width + x;
        const value = volume[volumeIndex] * rescaleSlope + rescaleIntercept;
        
        // Apply window/level
        let normalized = applyWindowLevel(value, wc, ww, photometricInterpretation);
        
        const pixelIndex = (z * width + x) * 4;
        coronalImage.data[pixelIndex] = normalized;
        coronalImage.data[pixelIndex + 1] = normalized;
        coronalImage.data[pixelIndex + 2] = normalized;
        coronalImage.data[pixelIndex + 3] = 255;
      }
    }
    
    coronalViews.push(coronalImage);
  }
  
  // Generate sagittal views (one for each column of the axial image)
  const sagittalViews: ImageData[] = [];
  for (let sagittalX = 0; sagittalX < width; sagittalX++) {
    const sagittalImage = new ImageData(height, depth);
    
    for (let z = 0; z < depth; z++) {
      for (let y = 0; y < height; y++) {
        const volumeIndex = z * (width * height) + y * width + sagittalX;
        const value = volume[volumeIndex] * rescaleSlope + rescaleIntercept;
        
        // Apply window/level
        let normalized = applyWindowLevel(value, wc, ww, photometricInterpretation);
        
        const pixelIndex = (z * height + y) * 4;
        sagittalImage.data[pixelIndex] = normalized;
        sagittalImage.data[pixelIndex + 1] = normalized;
        sagittalImage.data[pixelIndex + 2] = normalized;
        sagittalImage.data[pixelIndex + 3] = 255;
      }
    }
    
    sagittalViews.push(sagittalImage);
  }
  
  return { coronal: coronalViews, sagittal: sagittalViews };
};

/**
 * Helper to apply window/level transformation
 */
const applyWindowLevel = (
  value: number,
  windowCenter: number,
  windowWidth: number,
  photometricInterpretation: string
): number => {
  const minValue = windowCenter - windowWidth / 2;
  const maxValue = windowCenter + windowWidth / 2;
  const range = maxValue - minValue;
  
  let normalized: number;
  if (value <= minValue) {
    normalized = 0;
  } else if (value >= maxValue) {
    normalized = 255;
  } else {
    normalized = ((value - minValue) / range) * 255;
  }
  
  if (photometricInterpretation === 'MONOCHROME1') {
    normalized = 255 - normalized;
  }
  
  return normalized;
};

/**
 * Create a 3D volume array from sorted axial slices
 */
const createVolumeFromSlices = (slices: DicomImageData[]): Float32Array => {
  const width = slices[0].width;
  const height = slices[0].height;
  const depth = slices.length;
  
  const volume = new Float32Array(width * height * depth);
  
  for (let z = 0; z < depth; z++) {
    const slice = slices[z];
    const offset = z * width * height;
    
    for (let i = 0; i < slice.pixelData.length; i++) {
      volume[offset + i] = slice.pixelData[i];
    }
  }
  
  return volume;
};

/**
 * Get a specific slice from MPR views at given position
 */
export const getMPRSlice = (
  axialSlices: DicomImageData[],
  plane: 'axial' | 'coronal' | 'sagittal',
  sliceIndex: number,
  windowCenter?: number,
  windowWidth?: number
): ImageData | null => {
  if (axialSlices.length === 0) return null;
  
  const sortedSlices = sortDicomSlices(axialSlices);
  const width = sortedSlices[0].width;
  const height = sortedSlices[0].height;
  const depth = sortedSlices.length;
  
  // For axial, just return the rendered slice
  if (plane === 'axial') {
    const validIndex = Math.max(0, Math.min(sliceIndex, depth - 1));
    return renderDicomToImageData(sortedSlices[validIndex], windowCenter, windowWidth);
  }
  
  // For coronal/sagittal, we need to reconstruct
  const volume = createVolumeFromSlices(sortedSlices);
  
  const wc = windowCenter ?? sortedSlices[0].windowCenter ?? 40;
  const ww = windowWidth ?? sortedSlices[0].windowWidth ?? 400;
  const rescaleSlope = sortedSlices[0].rescaleSlope ?? 1;
  const rescaleIntercept = sortedSlices[0].rescaleIntercept ?? 0;
  const photometricInterpretation = sortedSlices[0].photometricInterpretation;
  
  if (plane === 'coronal') {
    const validY = Math.max(0, Math.min(sliceIndex, height - 1));
    const coronalImage = new ImageData(width, depth);
    
    for (let z = 0; z < depth; z++) {
      for (let x = 0; x < width; x++) {
        const volumeIndex = z * (width * height) + validY * width + x;
        const value = volume[volumeIndex] * rescaleSlope + rescaleIntercept;
        const normalized = applyWindowLevel(value, wc, ww, photometricInterpretation);
        
        const pixelIndex = (z * width + x) * 4;
        coronalImage.data[pixelIndex] = normalized;
        coronalImage.data[pixelIndex + 1] = normalized;
        coronalImage.data[pixelIndex + 2] = normalized;
        coronalImage.data[pixelIndex + 3] = 255;
      }
    }
    
    return coronalImage;
  }
  
  if (plane === 'sagittal') {
    const validX = Math.max(0, Math.min(sliceIndex, width - 1));
    const sagittalImage = new ImageData(height, depth);
    
    for (let z = 0; z < depth; z++) {
      for (let y = 0; y < height; y++) {
        const volumeIndex = z * (width * height) + y * width + validX;
        const value = volume[volumeIndex] * rescaleSlope + rescaleIntercept;
        const normalized = applyWindowLevel(value, wc, ww, photometricInterpretation);
        
        const pixelIndex = (z * height + y) * 4;
        sagittalImage.data[pixelIndex] = normalized;
        sagittalImage.data[pixelIndex + 1] = normalized;
        sagittalImage.data[pixelIndex + 2] = normalized;
        sagittalImage.data[pixelIndex + 3] = 255;
      }
    }
    
    return sagittalImage;
  }
  
  return null;
};
