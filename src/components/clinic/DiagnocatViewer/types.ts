// Types for Diagnocat-style 3D Dental Viewer

export interface SceneObject {
  id: string;
  name: string;
  type: 'group' | 'mesh' | 'landmark';
  visible: boolean;
  color: string;
  opacity: number;
  children?: SceneObject[];
  expanded?: boolean;
  icon?: string;
  modelUrl?: string;
}

export interface Viewport {
  id: string;
  name: string;
  type: 'perspective' | 'axial' | 'coronal' | 'sagittal';
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
  isActive?: boolean;
}

export interface ColorPickerState {
  isOpen: boolean;
  objectId: string | null;
  position: { x: number; y: number };
}

export interface Annotation {
  id: string;
  position: [number, number, number];
  label: string;
  description: string;
  color: string;
  type: 'point' | 'measurement';
  endPosition?: [number, number, number];
  distance?: number;
}

export interface ToolbarState {
  gridEnabled: boolean;
  crosshairEnabled: boolean;
  lightingIntensity: number;
  objectsPanelOpen: boolean;
}

export interface ExportOptions {
  teeth: boolean;
  anatomy: boolean;
  landmarks: boolean;
  mergeIntoOne: boolean;
  format: 'stl' | 'obj' | 'ply';
}

export const COLOR_PALETTE = [
  '#ffffff', // White
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#ec4899', // Pink
] as const;

export const ANATOMY_COLORS: Record<string, string> = {
  'soft-tissue': '#fca5a5',
  'cranial': '#e0e0e0',
  'sinus': '#00b4d8',
  'incisive-canal': '#ff7043',
  'maxilla': '#bb86fc',
  'mandible': '#64b5f6',
  'mandibular-canal': '#ffa726',
  'airways': '#90a4ae',
  'teeth-upper': '#f5f5dc',
  'teeth-lower': '#f5f5dc',
  'pulp': '#ef4444',
  'landmarks': '#06b6d4',
};

export const DEFAULT_SCENE_HIERARCHY: SceneObject[] = [
  {
    id: 'upper-jaw',
    name: 'Upper jaw',
    type: 'group',
    visible: true,
    color: '#a855f7',
    opacity: 1,
    expanded: true,
    children: [],
  },
  {
    id: 'lower-jaw',
    name: 'Lower jaw',
    type: 'group',
    visible: true,
    color: '#3b82f6',
    opacity: 1,
    expanded: true,
    children: [],
  },
  {
    id: 'teeth',
    name: 'Teeth',
    type: 'group',
    visible: true,
    color: '#f5f5dc',
    opacity: 1,
    expanded: true,
    children: [
      { id: 'teeth-upper', name: 'Upper', type: 'mesh', visible: true, color: '#f5f5dc', opacity: 1 },
      { id: 'teeth-lower', name: 'Lower', type: 'mesh', visible: true, color: '#f5f5dc', opacity: 1 },
      { id: 'teeth-upper-pulp', name: 'Upper Pulp', type: 'mesh', visible: true, color: '#ef4444', opacity: 0.75 },
      { id: 'teeth-lower-pulp', name: 'Lower Pulp', type: 'mesh', visible: true, color: '#ef4444', opacity: 0.75 },
    ],
  },
  {
    id: 'anatomy',
    name: 'Anatomy',
    type: 'group',
    visible: true,
    color: '#94a3b8',
    opacity: 0.67,
    expanded: false,
    children: [
      { id: 'soft-tissue', name: 'SoftTissue', type: 'mesh', visible: false, color: '#fca5a5', opacity: 0.6 },
      { id: 'cranial', name: 'Cranial', type: 'mesh', visible: false, color: '#e0e0e0', opacity: 0.4 },
      { id: 'sinus', name: 'Sinus', type: 'mesh', visible: true, color: '#00b4d8', opacity: 0.5 },
      { id: 'incisive-canal', name: 'IncisiveCanal', type: 'mesh', visible: true, color: '#ff7043', opacity: 0.8 },
      { id: 'maxilla', name: 'Maxilla', type: 'mesh', visible: true, color: '#bb86fc', opacity: 0.75 },
      { id: 'mandible', name: 'Mandible', type: 'mesh', visible: true, color: '#64b5f6', opacity: 0.75 },
      { id: 'mandibular-canal', name: 'Mandibular canal', type: 'mesh', visible: true, color: '#ffa726', opacity: 0.8 },
      { id: 'airways', name: 'Airways', type: 'mesh', visible: false, color: '#90a4ae', opacity: 0.4 },
    ],
  },
  {
    id: 'landmarks',
    name: 'Landmarks',
    type: 'group',
    visible: true,
    color: '#06b6d4',
    opacity: 1,
    expanded: false,
    children: [
      { id: 'landmarks-teeth', name: 'Teeth', type: 'landmark', visible: true, color: '#22c55e', opacity: 1, icon: 'tooth' },
      { id: 'landmarks-cephalometric', name: 'Cephalometric', type: 'landmark', visible: true, color: '#f97316', opacity: 1, icon: 'circle' },
    ],
  },
];

export const DEFAULT_VIEWPORTS: Viewport[] = [
  { id: 'main', name: 'Main 3D', type: 'perspective', position: [5, 5, 5], target: [0, 0, 0], zoom: 1 },
  { id: 'axial', name: 'Axial', type: 'axial', position: [0, 10, 0], target: [0, 0, 0], zoom: 0.75 },
  { id: 'coronal', name: 'Coronal', type: 'coronal', position: [0, 0, 10], target: [0, 0, 0], zoom: 0.67 },
  { id: 'sagittal', name: 'Sagittal', type: 'sagittal', position: [10, 0, 0], target: [0, 0, 0], zoom: 0.67 },
];
