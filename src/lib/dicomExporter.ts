/**
 * DICOM Exporter - Creates DICOM files from image data with patient metadata
 * Based on DICOM PS3.3 standard for Secondary Capture Image
 */

interface PatientMetadata {
  patientId: string;
  patientName: string;
  patientBirthDate?: string;
  patientSex?: string;
  studyDescription?: string;
  seriesDescription?: string;
  institutionName?: string;
  modality?: string;
}

interface DicomTag {
  tag: string;
  vr: string;
  value: string | number | number[];
}

// DICOM UIDs
const IMPLEMENTATION_CLASS_UID = '1.2.826.0.1.3680043.8.498.1';
const IMPLEMENTATION_VERSION_NAME = 'LOVABLE_DENTAL_1.0';

// Generate a unique UID based on timestamp and random
const generateUID = (): string => {
  const root = '1.2.826.0.1.3680043.8.498';
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `${root}.${timestamp}.${random}`;
};

// Format date for DICOM (YYYYMMDD)
const formatDicomDate = (date: Date = new Date()): string => {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
};

// Format time for DICOM (HHMMSS.FFFFFF)
const formatDicomTime = (date: Date = new Date()): string => {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${h}${m}${s}.${ms}000`;
};

// Pad name for DICOM format
const formatDicomName = (name: string): string => {
  // Convert "First Last" to "Last^First"
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    const lastName = parts[parts.length - 1];
    const firstName = parts.slice(0, -1).join(' ');
    return `${lastName}^${firstName}`;
  }
  return name;
};

// Write a DICOM tag to buffer
const writeDicomTag = (
  view: DataView,
  offset: number,
  group: number,
  element: number,
  vr: string,
  value: string | number | Uint8Array | Uint16Array
): number => {
  // Write tag (group, element) in little endian
  view.setUint16(offset, group, true);
  view.setUint16(offset + 2, element, true);
  offset += 4;

  if (typeof value === 'string') {
    // Explicit VR string
    const encoder = new TextEncoder();
    const encoded = encoder.encode(value);
    let length = encoded.length;
    
    // Pad to even length
    if (length % 2 !== 0) {
      length += 1;
    }

    // Write VR
    view.setUint8(offset, vr.charCodeAt(0));
    view.setUint8(offset + 1, vr.charCodeAt(1));
    offset += 2;

    // For VRs with 2-byte length
    if (['OB', 'OW', 'OF', 'SQ', 'UC', 'UN', 'UR', 'UT'].includes(vr)) {
      // Reserved bytes
      view.setUint16(offset, 0, true);
      offset += 2;
      // 4-byte length
      view.setUint32(offset, length, true);
      offset += 4;
    } else {
      // 2-byte length
      view.setUint16(offset, length, true);
      offset += 2;
    }

    // Write value
    for (let i = 0; i < encoded.length; i++) {
      view.setUint8(offset + i, encoded[i]);
    }
    // Pad with space for string VRs
    if (encoded.length < length) {
      view.setUint8(offset + encoded.length, 0x20);
    }
    offset += length;
  } else if (typeof value === 'number') {
    // Numeric value
    if (vr === 'US') {
      view.setUint8(offset, 'U'.charCodeAt(0));
      view.setUint8(offset + 1, 'S'.charCodeAt(0));
      view.setUint16(offset + 2, 2, true);
      view.setUint16(offset + 4, value, true);
      offset += 6;
    } else if (vr === 'UL') {
      view.setUint8(offset, 'U'.charCodeAt(0));
      view.setUint8(offset + 1, 'L'.charCodeAt(0));
      view.setUint16(offset + 2, 4, true);
      view.setUint32(offset + 4, value, true);
      offset += 8;
    } else if (vr === 'SS') {
      view.setUint8(offset, 'S'.charCodeAt(0));
      view.setUint8(offset + 1, 'S'.charCodeAt(0));
      view.setUint16(offset + 2, 2, true);
      view.setInt16(offset + 4, value, true);
      offset += 6;
    }
  } else if (value instanceof Uint8Array) {
    // Pixel data (OW)
    view.setUint8(offset, 'O'.charCodeAt(0));
    view.setUint8(offset + 1, 'W'.charCodeAt(0));
    view.setUint16(offset + 2, 0, true); // Reserved
    view.setUint32(offset + 4, value.length, true);
    offset += 8;
    
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset + i, value[i]);
    }
    offset += value.length;
    
    // Pad to even length
    if (value.length % 2 !== 0) {
      view.setUint8(offset, 0);
      offset += 1;
    }
  } else if (value instanceof Uint16Array) {
    // 16-bit pixel data
    const byteLength = value.length * 2;
    view.setUint8(offset, 'O'.charCodeAt(0));
    view.setUint8(offset + 1, 'W'.charCodeAt(0));
    view.setUint16(offset + 2, 0, true); // Reserved
    view.setUint32(offset + 4, byteLength, true);
    offset += 8;
    
    for (let i = 0; i < value.length; i++) {
      view.setUint16(offset + i * 2, value[i], true);
    }
    offset += byteLength;
  }

  return offset;
};

/**
 * Export canvas as DICOM file with patient metadata
 */
export const exportCanvasToDicom = async (
  canvas: HTMLCanvasElement,
  metadata: PatientMetadata
): Promise<Blob> => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get canvas context');

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  
  // Convert RGBA to grayscale 16-bit for better quality
  const pixelData = new Uint16Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = imageData.data[i * 4];
    const g = imageData.data[i * 4 + 1];
    const b = imageData.data[i * 4 + 2];
    // Convert to 16-bit grayscale (0-65535)
    const gray = Math.round((r * 0.299 + g * 0.587 + b * 0.114) * 257);
    pixelData[i] = gray;
  }

  // Generate UIDs
  const sopInstanceUID = generateUID();
  const studyInstanceUID = generateUID();
  const seriesInstanceUID = generateUID();
  const now = new Date();

  // Calculate buffer size (estimate)
  const headerSize = 132; // Preamble + DICM
  const metadataSize = 2048; // Generous estimate for metadata
  const pixelDataSize = pixelData.length * 2 + 12; // Include tag header
  const totalSize = headerSize + metadataSize + pixelDataSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let offset = 0;

  // DICOM Preamble (128 bytes of zeros)
  for (let i = 0; i < 128; i++) {
    view.setUint8(offset + i, 0);
  }
  offset += 128;

  // DICM prefix
  view.setUint8(offset, 'D'.charCodeAt(0));
  view.setUint8(offset + 1, 'I'.charCodeAt(0));
  view.setUint8(offset + 2, 'C'.charCodeAt(0));
  view.setUint8(offset + 3, 'M'.charCodeAt(0));
  offset += 4;

  // File Meta Information
  // (0002,0001) File Meta Information Version
  offset = writeDicomTag(view, offset, 0x0002, 0x0001, 'OB', new Uint8Array([0x00, 0x01]));
  
  // (0002,0002) Media Storage SOP Class UID - Secondary Capture
  offset = writeDicomTag(view, offset, 0x0002, 0x0002, 'UI', '1.2.840.10008.5.1.4.1.1.7');
  
  // (0002,0003) Media Storage SOP Instance UID
  offset = writeDicomTag(view, offset, 0x0002, 0x0003, 'UI', sopInstanceUID);
  
  // (0002,0010) Transfer Syntax UID - Explicit VR Little Endian
  offset = writeDicomTag(view, offset, 0x0002, 0x0010, 'UI', '1.2.840.10008.1.2.1');
  
  // (0002,0012) Implementation Class UID
  offset = writeDicomTag(view, offset, 0x0002, 0x0012, 'UI', IMPLEMENTATION_CLASS_UID);
  
  // (0002,0013) Implementation Version Name
  offset = writeDicomTag(view, offset, 0x0002, 0x0013, 'SH', IMPLEMENTATION_VERSION_NAME);

  // Patient Module
  // (0010,0010) Patient's Name
  offset = writeDicomTag(view, offset, 0x0010, 0x0010, 'PN', formatDicomName(metadata.patientName));
  
  // (0010,0020) Patient ID
  offset = writeDicomTag(view, offset, 0x0010, 0x0020, 'LO', metadata.patientId);
  
  // (0010,0030) Patient's Birth Date
  offset = writeDicomTag(view, offset, 0x0010, 0x0030, 'DA', metadata.patientBirthDate || '');
  
  // (0010,0040) Patient's Sex
  offset = writeDicomTag(view, offset, 0x0010, 0x0040, 'CS', metadata.patientSex || 'O');

  // Study Module
  // (0020,000D) Study Instance UID
  offset = writeDicomTag(view, offset, 0x0020, 0x000D, 'UI', studyInstanceUID);
  
  // (0008,0020) Study Date
  offset = writeDicomTag(view, offset, 0x0008, 0x0020, 'DA', formatDicomDate(now));
  
  // (0008,0030) Study Time
  offset = writeDicomTag(view, offset, 0x0008, 0x0030, 'TM', formatDicomTime(now));
  
  // (0008,1030) Study Description
  offset = writeDicomTag(view, offset, 0x0008, 0x1030, 'LO', metadata.studyDescription || 'Dental Panoramic');

  // Series Module
  // (0020,000E) Series Instance UID
  offset = writeDicomTag(view, offset, 0x0020, 0x000E, 'UI', seriesInstanceUID);
  
  // (0008,0060) Modality
  offset = writeDicomTag(view, offset, 0x0008, 0x0060, 'CS', metadata.modality || 'OT');
  
  // (0008,103E) Series Description
  offset = writeDicomTag(view, offset, 0x0008, 0x103E, 'LO', metadata.seriesDescription || 'Panoramic from CBCT');

  // General Equipment Module
  // (0008,0080) Institution Name
  offset = writeDicomTag(view, offset, 0x0008, 0x0080, 'LO', metadata.institutionName || 'Dental Clinic');
  
  // (0008,1090) Manufacturer's Model Name
  offset = writeDicomTag(view, offset, 0x0008, 0x1090, 'LO', 'Lovable Dental Panoramic Generator');

  // Image Module
  // (0028,0002) Samples per Pixel
  offset = writeDicomTag(view, offset, 0x0028, 0x0002, 'US', 1);
  
  // (0028,0004) Photometric Interpretation
  offset = writeDicomTag(view, offset, 0x0028, 0x0004, 'CS', 'MONOCHROME2');
  
  // (0028,0010) Rows
  offset = writeDicomTag(view, offset, 0x0028, 0x0010, 'US', height);
  
  // (0028,0011) Columns
  offset = writeDicomTag(view, offset, 0x0028, 0x0011, 'US', width);
  
  // (0028,0100) Bits Allocated
  offset = writeDicomTag(view, offset, 0x0028, 0x0100, 'US', 16);
  
  // (0028,0101) Bits Stored
  offset = writeDicomTag(view, offset, 0x0028, 0x0101, 'US', 16);
  
  // (0028,0102) High Bit
  offset = writeDicomTag(view, offset, 0x0028, 0x0102, 'US', 15);
  
  // (0028,0103) Pixel Representation
  offset = writeDicomTag(view, offset, 0x0028, 0x0103, 'US', 0);

  // SOP Common Module
  // (0008,0016) SOP Class UID - Secondary Capture
  offset = writeDicomTag(view, offset, 0x0008, 0x0016, 'UI', '1.2.840.10008.5.1.4.1.1.7');
  
  // (0008,0018) SOP Instance UID
  offset = writeDicomTag(view, offset, 0x0008, 0x0018, 'UI', sopInstanceUID);

  // Pixel Data
  // (7FE0,0010) Pixel Data
  offset = writeDicomTag(view, offset, 0x7FE0, 0x0010, 'OW', pixelData);

  // Create final blob with exact size
  return new Blob([buffer.slice(0, offset)], { type: 'application/dicom' });
};

/**
 * Download DICOM file
 */
export const downloadDicom = async (
  canvas: HTMLCanvasElement,
  metadata: PatientMetadata,
  filename?: string
): Promise<void> => {
  const blob = await exportCanvasToDicom(canvas, metadata);
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${metadata.patientName.replace(/\s+/g, '_')}_panoramic.dcm`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};
