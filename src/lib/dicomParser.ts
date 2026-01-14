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
 * Create coronal and sagittal views from axial slices (MPR)
 */
export const createMPRViews = (
  axialSlices: DicomImageData[]
): { coronal: ImageData | null; sagittal: ImageData | null } => {
  if (axialSlices.length === 0) {
    return { coronal: null, sagittal: null };
  }
  
  const sortedSlices = sortDicomSlices(axialSlices);
  const width = sortedSlices[0].width;
  const height = sortedSlices[0].height;
  const depth = sortedSlices.length;
  
  // For now, return null - full MPR requires 3D volume reconstruction
  // This would need to be implemented with proper interpolation
  return { coronal: null, sagittal: null };
};
