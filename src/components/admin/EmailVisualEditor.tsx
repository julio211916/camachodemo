import { useState, useCallback } from "react";
import { motion, Reorder, useDragControls } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Type,
  Image,
  Square,
  Minus,
  Link as LinkIcon,
  GripVertical,
  Trash2,
  Plus,
  Save,
  Eye,
  Undo2,
  Redo2,
  Settings,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Download,
  Copy,
  LayoutTemplate,
  Heading1,
  Heading2,
  List,
  Columns,
  CircleDot,
  Mail,
  Smartphone,
  Monitor,
} from "lucide-react";

// Block types
type BlockType = "heading" | "text" | "image" | "button" | "divider" | "spacer" | "columns" | "list" | "logo";

interface EmailBlock {
  id: string;
  type: BlockType;
  content: Record<string, any>;
  styles: Record<string, any>;
}

interface EmailTemplate {
  id: string;
  name: string;
  blocks: EmailBlock[];
  globalStyles: {
    backgroundColor: string;
    contentBackground: string;
    fontFamily: string;
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    width: number;
  };
}

// Default blocks configuration
const blockTypes: { type: BlockType; label: string; icon: React.ReactNode; defaultContent: Record<string, any>; defaultStyles: Record<string, any> }[] = [
  {
    type: "logo",
    label: "Logo",
    icon: <CircleDot className="w-4 h-4" />,
    defaultContent: { text: "NovellDent", emoji: "🦷" },
    defaultStyles: { alignment: "center", fontSize: 24, color: "#1e3a5f" },
  },
  {
    type: "heading",
    label: "Título",
    icon: <Heading1 className="w-4 h-4" />,
    defaultContent: { text: "Título de ejemplo" },
    defaultStyles: { fontSize: 24, fontWeight: "bold", color: "#1e3a5f", alignment: "center" },
  },
  {
    type: "text",
    label: "Texto",
    icon: <Type className="w-4 h-4" />,
    defaultContent: { text: "Este es un párrafo de texto que puedes personalizar. Agrega tu mensaje aquí." },
    defaultStyles: { fontSize: 14, color: "#374151", alignment: "left", lineHeight: 1.6 },
  },
  {
    type: "image",
    label: "Imagen",
    icon: <Image className="w-4 h-4" />,
    defaultContent: { src: "https://via.placeholder.com/600x200", alt: "Imagen" },
    defaultStyles: { width: 100, borderRadius: 8, alignment: "center" },
  },
  {
    type: "button",
    label: "Botón",
    icon: <Square className="w-4 h-4" />,
    defaultContent: { text: "Haz clic aquí", url: "#" },
    defaultStyles: { backgroundColor: "#3b82f6", color: "#ffffff", fontSize: 14, padding: 12, borderRadius: 8, alignment: "center" },
  },
  {
    type: "divider",
    label: "Separador",
    icon: <Minus className="w-4 h-4" />,
    defaultContent: {},
    defaultStyles: { color: "#e5e7eb", thickness: 1, width: 100, style: "solid" },
  },
  {
    type: "spacer",
    label: "Espaciador",
    icon: <Square className="w-4 h-4" />,
    defaultContent: {},
    defaultStyles: { height: 20 },
  },
  {
    type: "list",
    label: "Lista",
    icon: <List className="w-4 h-4" />,
    defaultContent: { items: ["Elemento 1", "Elemento 2", "Elemento 3"] },
    defaultStyles: { fontSize: 14, color: "#374151", bulletColor: "#3b82f6" },
  },
  {
    type: "columns",
    label: "Columnas",
    icon: <Columns className="w-4 h-4" />,
    defaultContent: { left: "Columna izquierda", right: "Columna derecha" },
    defaultStyles: { gap: 20, fontSize: 14, color: "#374151" },
  },
];

// Default template
const defaultTemplate: EmailTemplate = {
  id: "new-template",
  name: "Nueva Plantilla",
  blocks: [
    {
      id: "logo-1",
      type: "logo",
      content: { text: "NovellDent", emoji: "🦷" },
      styles: { alignment: "center", fontSize: 24, color: "#1e3a5f" },
    },
    {
      id: "spacer-1",
      type: "spacer",
      content: {},
      styles: { height: 20 },
    },
    {
      id: "heading-1",
      type: "heading",
      content: { text: "¡Bienvenido a nuestro programa de referidos!" },
      styles: { fontSize: 22, fontWeight: "bold", color: "#1e3a5f", alignment: "center" },
    },
    {
      id: "spacer-2",
      type: "spacer",
      content: {},
      styles: { height: 16 },
    },
    {
      id: "text-1",
      type: "text",
      content: { text: "Nos alegra tenerte con nosotros. Ahora puedes referir amigos y ganar descuentos exclusivos en tus próximos tratamientos." },
      styles: { fontSize: 14, color: "#374151", alignment: "center", lineHeight: 1.6 },
    },
    {
      id: "spacer-3",
      type: "spacer",
      content: {},
      styles: { height: 24 },
    },
    {
      id: "button-1",
      type: "button",
      content: { text: "Obtener mi código de referido", url: "#" },
      styles: { backgroundColor: "#3b82f6", color: "#ffffff", fontSize: 14, padding: 14, borderRadius: 8, alignment: "center" },
    },
  ],
  globalStyles: {
    backgroundColor: "#f3f4f6",
    contentBackground: "#ffffff",
    fontFamily: "Arial, sans-serif",
    primaryColor: "#3b82f6",
    secondaryColor: "#1e3a5f",
    textColor: "#374151",
    width: 600,
  },
};

// Block Editor Component
const BlockEditor = ({ block, onUpdate }: { block: EmailBlock; onUpdate: (updates: Partial<EmailBlock>) => void }) => {
  const updateContent = (key: string, value: any) => {
    onUpdate({ content: { ...block.content, [key]: value } });
  };

  const updateStyle = (key: string, value: any) => {
    onUpdate({ styles: { ...block.styles, [key]: value } });
  };

  return (
    <div className="space-y-4 p-4">
      {/* Content editors based on block type */}
      {block.type === "logo" && (
        <>
          <div className="space-y-2">
            <Label>Emoji</Label>
            <Input value={block.content.emoji} onChange={(e) => updateContent("emoji", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Texto</Label>
            <Input value={block.content.text} onChange={(e) => updateContent("text", e.target.value)} />
          </div>
        </>
      )}

      {block.type === "heading" && (
        <div className="space-y-2">
          <Label>Título</Label>
          <Input value={block.content.text} onChange={(e) => updateContent("text", e.target.value)} />
        </div>
      )}

      {block.type === "text" && (
        <div className="space-y-2">
          <Label>Texto</Label>
          <Textarea value={block.content.text} onChange={(e) => updateContent("text", e.target.value)} rows={4} />
        </div>
      )}

      {block.type === "image" && (
        <>
          <div className="space-y-2">
            <Label>URL de imagen</Label>
            <Input value={block.content.src} onChange={(e) => updateContent("src", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Texto alternativo</Label>
            <Input value={block.content.alt} onChange={(e) => updateContent("alt", e.target.value)} />
          </div>
        </>
      )}

      {block.type === "button" && (
        <>
          <div className="space-y-2">
            <Label>Texto del botón</Label>
            <Input value={block.content.text} onChange={(e) => updateContent("text", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>URL de enlace</Label>
            <Input value={block.content.url} onChange={(e) => updateContent("url", e.target.value)} />
          </div>
        </>
      )}

      {block.type === "list" && (
        <div className="space-y-2">
          <Label>Elementos (uno por línea)</Label>
          <Textarea
            value={(block.content.items || []).join("\n")}
            onChange={(e) => updateContent("items", e.target.value.split("\n").filter(Boolean))}
            rows={4}
          />
        </div>
      )}

      {block.type === "columns" && (
        <>
          <div className="space-y-2">
            <Label>Columna izquierda</Label>
            <Textarea value={block.content.left} onChange={(e) => updateContent("left", e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Columna derecha</Label>
            <Textarea value={block.content.right} onChange={(e) => updateContent("right", e.target.value)} rows={2} />
          </div>
        </>
      )}

      {/* Style editors */}
      <div className="border-t pt-4 mt-4">
        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Estilos
        </h4>

        {block.styles.fontSize !== undefined && (
          <div className="space-y-2 mb-3">
            <Label className="text-xs">Tamaño de fuente: {block.styles.fontSize}px</Label>
            <Slider
              value={[block.styles.fontSize]}
              onValueChange={([v]) => updateStyle("fontSize", v)}
              min={10}
              max={48}
              step={1}
            />
          </div>
        )}

        {block.styles.color !== undefined && (
          <div className="space-y-2 mb-3">
            <Label className="text-xs">Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={block.styles.color}
                onChange={(e) => updateStyle("color", e.target.value)}
                className="w-12 h-8 p-1"
              />
              <Input
                value={block.styles.color}
                onChange={(e) => updateStyle("color", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        )}

        {block.styles.backgroundColor !== undefined && (
          <div className="space-y-2 mb-3">
            <Label className="text-xs">Color de fondo</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={block.styles.backgroundColor}
                onChange={(e) => updateStyle("backgroundColor", e.target.value)}
                className="w-12 h-8 p-1"
              />
              <Input
                value={block.styles.backgroundColor}
                onChange={(e) => updateStyle("backgroundColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        )}

        {block.styles.alignment !== undefined && (
          <div className="space-y-2 mb-3">
            <Label className="text-xs">Alineación</Label>
            <div className="flex gap-1">
              {["left", "center", "right"].map((align) => (
                <Button
                  key={align}
                  type="button"
                  size="sm"
                  variant={block.styles.alignment === align ? "default" : "outline"}
                  onClick={() => updateStyle("alignment", align)}
                >
                  {align === "left" && <AlignLeft className="w-4 h-4" />}
                  {align === "center" && <AlignCenter className="w-4 h-4" />}
                  {align === "right" && <AlignRight className="w-4 h-4" />}
                </Button>
              ))}
            </div>
          </div>
        )}

        {block.styles.borderRadius !== undefined && (
          <div className="space-y-2 mb-3">
            <Label className="text-xs">Radio de bordes: {block.styles.borderRadius}px</Label>
            <Slider
              value={[block.styles.borderRadius]}
              onValueChange={([v]) => updateStyle("borderRadius", v)}
              min={0}
              max={32}
              step={1}
            />
          </div>
        )}

        {block.styles.padding !== undefined && (
          <div className="space-y-2 mb-3">
            <Label className="text-xs">Padding: {block.styles.padding}px</Label>
            <Slider
              value={[block.styles.padding]}
              onValueChange={([v]) => updateStyle("padding", v)}
              min={4}
              max={32}
              step={2}
            />
          </div>
        )}

        {block.styles.height !== undefined && (
          <div className="space-y-2 mb-3">
            <Label className="text-xs">Altura: {block.styles.height}px</Label>
            <Slider
              value={[block.styles.height]}
              onValueChange={([v]) => updateStyle("height", v)}
              min={8}
              max={100}
              step={4}
            />
          </div>
        )}

        {block.styles.width !== undefined && (
          <div className="space-y-2 mb-3">
            <Label className="text-xs">Ancho: {block.styles.width}%</Label>
            <Slider
              value={[block.styles.width]}
              onValueChange={([v]) => updateStyle("width", v)}
              min={20}
              max={100}
              step={5}
            />
          </div>
        )}

        {block.styles.thickness !== undefined && (
          <div className="space-y-2 mb-3">
            <Label className="text-xs">Grosor: {block.styles.thickness}px</Label>
            <Slider
              value={[block.styles.thickness]}
              onValueChange={([v]) => updateStyle("thickness", v)}
              min={1}
              max={8}
              step={1}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Block Renderer for Preview
const BlockRenderer = ({ block, globalStyles }: { block: EmailBlock; globalStyles: EmailTemplate["globalStyles"] }) => {
  const getAlignment = (align: string) => {
    switch (align) {
      case "left": return "flex-start";
      case "right": return "flex-end";
      default: return "center";
    }
  };

  switch (block.type) {
    case "logo":
      return (
        <div style={{ textAlign: block.styles.alignment || "center", padding: "10px 0" }}>
          <span style={{ fontSize: block.styles.fontSize * 1.5 }}>{block.content.emoji}</span>
          <div style={{ fontSize: block.styles.fontSize, color: block.styles.color, fontWeight: "bold" }}>
            {block.content.text}
          </div>
        </div>
      );

    case "heading":
      return (
        <div
          style={{
            fontSize: block.styles.fontSize,
            fontWeight: block.styles.fontWeight,
            color: block.styles.color,
            textAlign: block.styles.alignment,
            padding: "8px 0",
          }}
        >
          {block.content.text}
        </div>
      );

    case "text":
      return (
        <p
          style={{
            fontSize: block.styles.fontSize,
            color: block.styles.color,
            textAlign: block.styles.alignment,
            lineHeight: block.styles.lineHeight,
            margin: "8px 0",
          }}
        >
          {block.content.text}
        </p>
      );

    case "image":
      return (
        <div style={{ display: "flex", justifyContent: getAlignment(block.styles.alignment) }}>
          <img
            src={block.content.src}
            alt={block.content.alt}
            style={{
              width: `${block.styles.width}%`,
              maxWidth: "100%",
              borderRadius: block.styles.borderRadius,
            }}
          />
        </div>
      );

    case "button":
      return (
        <div style={{ display: "flex", justifyContent: getAlignment(block.styles.alignment), padding: "8px 0" }}>
          <a
            href={block.content.url}
            style={{
              backgroundColor: block.styles.backgroundColor,
              color: block.styles.color,
              fontSize: block.styles.fontSize,
              padding: `${block.styles.padding}px ${block.styles.padding * 2}px`,
              borderRadius: block.styles.borderRadius,
              textDecoration: "none",
              display: "inline-block",
              fontWeight: 500,
            }}
          >
            {block.content.text}
          </a>
        </div>
      );

    case "divider":
      return (
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0" }}>
          <hr
            style={{
              width: `${block.styles.width}%`,
              border: "none",
              borderTop: `${block.styles.thickness}px ${block.styles.style} ${block.styles.color}`,
              margin: 0,
            }}
          />
        </div>
      );

    case "spacer":
      return <div style={{ height: block.styles.height }} />;

    case "list":
      return (
        <ul style={{ fontSize: block.styles.fontSize, color: block.styles.color, paddingLeft: 24 }}>
          {(block.content.items || []).map((item: string, i: number) => (
            <li key={i} style={{ marginBottom: 6 }}>{item}</li>
          ))}
        </ul>
      );

    case "columns":
      return (
        <div style={{ display: "flex", gap: block.styles.gap }}>
          <div style={{ flex: 1, fontSize: block.styles.fontSize, color: block.styles.color }}>
            {block.content.left}
          </div>
          <div style={{ flex: 1, fontSize: block.styles.fontSize, color: block.styles.color }}>
            {block.content.right}
          </div>
        </div>
      );

    default:
      return null;
  }
};

// Draggable Block Item
const DraggableBlock = ({
  block,
  isSelected,
  onSelect,
  onDelete,
}: {
  block: EmailBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) => {
  const controls = useDragControls();
  const blockConfig = blockTypes.find((b) => b.type === block.type);

  return (
    <Reorder.Item
      value={block}
      id={block.id}
      dragListener={false}
      dragControls={controls}
      className={`group relative border rounded-lg transition-all ${
        isSelected ? "ring-2 ring-primary border-primary" : "border-transparent hover:border-muted-foreground/30"
      }`}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab opacity-0 group-hover:opacity-100 transition-opacity bg-muted/50 rounded-l-lg"
        onPointerDown={(e) => controls.start(e)}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className="pl-8 pr-10" onClick={onSelect}>
        <div className="py-2 cursor-pointer">
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            {blockConfig?.icon}
            {blockConfig?.label}
          </div>
          <div className="text-sm">
            {block.type === "heading" && block.content.text}
            {block.type === "text" && <span className="line-clamp-1">{block.content.text}</span>}
            {block.type === "button" && <span className="text-primary">[{block.content.text}]</span>}
            {block.type === "image" && <span className="text-muted-foreground">Imagen</span>}
            {block.type === "divider" && <hr className="my-1" />}
            {block.type === "spacer" && <div className="h-2 bg-muted rounded" />}
            {block.type === "logo" && <span>{block.content.emoji} {block.content.text}</span>}
            {block.type === "list" && <span>{(block.content.items || []).length} elementos</span>}
            {block.type === "columns" && <span>2 columnas</span>}
          </div>
        </div>
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 h-7 w-7 text-destructive hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </Reorder.Item>
  );
};

// Main Component
export const EmailVisualEditor = () => {
  const { toast } = useToast();
  const [template, setTemplate] = useState<EmailTemplate>(defaultTemplate);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [history, setHistory] = useState<EmailTemplate[]>([defaultTemplate]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const selectedBlock = template.blocks.find((b) => b.id === selectedBlockId);

  const saveToHistory = useCallback((newTemplate: EmailTemplate) => {
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), newTemplate]);
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTemplate(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTemplate(history[historyIndex + 1]);
    }
  };

  const addBlock = (type: BlockType) => {
    const blockConfig = blockTypes.find((b) => b.type === type);
    if (!blockConfig) return;

    const newBlock: EmailBlock = {
      id: `${type}-${Date.now()}`,
      type,
      content: { ...blockConfig.defaultContent },
      styles: { ...blockConfig.defaultStyles },
    };

    const newTemplate = {
      ...template,
      blocks: [...template.blocks, newBlock],
    };
    setTemplate(newTemplate);
    saveToHistory(newTemplate);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (blockId: string, updates: Partial<EmailBlock>) => {
    const newTemplate = {
      ...template,
      blocks: template.blocks.map((b) =>
        b.id === blockId ? { ...b, ...updates } : b
      ),
    };
    setTemplate(newTemplate);
  };

  const deleteBlock = (blockId: string) => {
    const newTemplate = {
      ...template,
      blocks: template.blocks.filter((b) => b.id !== blockId),
    };
    setTemplate(newTemplate);
    saveToHistory(newTemplate);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const reorderBlocks = (newOrder: EmailBlock[]) => {
    const newTemplate = { ...template, blocks: newOrder };
    setTemplate(newTemplate);
    saveToHistory(newTemplate);
  };

  const updateGlobalStyle = (key: string, value: any) => {
    const newTemplate = {
      ...template,
      globalStyles: { ...template.globalStyles, [key]: value },
    };
    setTemplate(newTemplate);
  };

  const generateHTML = () => {
    const { globalStyles } = template;
    const blocksHTML = template.blocks.map((block) => {
      // Generate HTML for each block
      switch (block.type) {
        case "logo":
          return `<div style="text-align: ${block.styles.alignment}; padding: 10px 0;">
            <span style="font-size: ${block.styles.fontSize * 1.5}px;">${block.content.emoji}</span>
            <div style="font-size: ${block.styles.fontSize}px; color: ${block.styles.color}; font-weight: bold;">${block.content.text}</div>
          </div>`;
        case "heading":
          return `<h1 style="font-size: ${block.styles.fontSize}px; font-weight: ${block.styles.fontWeight}; color: ${block.styles.color}; text-align: ${block.styles.alignment}; margin: 8px 0;">${block.content.text}</h1>`;
        case "text":
          return `<p style="font-size: ${block.styles.fontSize}px; color: ${block.styles.color}; text-align: ${block.styles.alignment}; line-height: ${block.styles.lineHeight}; margin: 8px 0;">${block.content.text}</p>`;
        case "button":
          return `<div style="text-align: ${block.styles.alignment}; padding: 8px 0;">
            <a href="${block.content.url}" style="background-color: ${block.styles.backgroundColor}; color: ${block.styles.color}; font-size: ${block.styles.fontSize}px; padding: ${block.styles.padding}px ${block.styles.padding * 2}px; border-radius: ${block.styles.borderRadius}px; text-decoration: none; display: inline-block;">${block.content.text}</a>
          </div>`;
        case "divider":
          return `<hr style="width: ${block.styles.width}%; border: none; border-top: ${block.styles.thickness}px ${block.styles.style} ${block.styles.color}; margin: 10px auto;">`;
        case "spacer":
          return `<div style="height: ${block.styles.height}px;"></div>`;
        case "image":
          return `<div style="text-align: ${block.styles.alignment};"><img src="${block.content.src}" alt="${block.content.alt}" style="width: ${block.styles.width}%; max-width: 100%; border-radius: ${block.styles.borderRadius}px;"></div>`;
        case "list":
          return `<ul style="font-size: ${block.styles.fontSize}px; color: ${block.styles.color}; padding-left: 24px;">${(block.content.items || []).map((item: string) => `<li style="margin-bottom: 6px;">${item}</li>`).join("")}</ul>`;
        case "columns":
          return `<table width="100%"><tr><td style="width: 50%; font-size: ${block.styles.fontSize}px; color: ${block.styles.color}; padding-right: ${block.styles.gap / 2}px;">${block.content.left}</td><td style="width: 50%; font-size: ${block.styles.fontSize}px; color: ${block.styles.color}; padding-left: ${block.styles.gap / 2}px;">${block.content.right}</td></tr></table>`;
        default:
          return "";
      }
    }).join("\n");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: ${globalStyles.backgroundColor}; font-family: ${globalStyles.fontFamily};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${globalStyles.backgroundColor};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="${globalStyles.width}" cellpadding="0" cellspacing="0" style="background-color: ${globalStyles.contentBackground}; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 32px;">
              ${blocksHTML}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const copyHTML = () => {
    const html = generateHTML();
    navigator.clipboard.writeText(html);
    toast({ title: "HTML copiado", description: "El código HTML ha sido copiado al portapapeles" });
  };

  const downloadHTML = () => {
    const html = generateHTML();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Descargado", description: "El archivo HTML ha sido descargado" });
  };

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b p-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-primary" />
          <Input
            value={template.name}
            onChange={(e) => setTemplate({ ...template, name: e.target.value })}
            className="w-48 h-8 font-medium"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex === 0}>
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex === history.length - 1}>
            <Redo2 className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="outline" size="sm" onClick={() => setPreviewMode("desktop")} className={previewMode === "desktop" ? "bg-accent" : ""}>
            <Monitor className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPreviewMode("mobile")} className={previewMode === "mobile" ? "bg-accent" : ""}>
            <Smartphone className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="outline" size="sm" onClick={() => setShowPreviewModal(true)}>
            <Eye className="w-4 h-4 mr-1" />
            Vista previa
          </Button>
          <Button variant="outline" size="sm" onClick={copyHTML}>
            <Copy className="w-4 h-4 mr-1" />
            Copiar HTML
          </Button>
          <Button size="sm" onClick={downloadHTML}>
            <Download className="w-4 h-4 mr-1" />
            Descargar
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Block List */}
        <div className="w-64 border-r flex flex-col bg-muted/20">
          <div className="p-3 border-b">
            <h3 className="font-medium text-sm mb-2">Agregar bloque</h3>
            <div className="grid grid-cols-3 gap-1">
              {blockTypes.map((block) => (
                <Button
                  key={block.type}
                  variant="outline"
                  size="sm"
                  className="h-auto py-2 flex flex-col gap-1"
                  onClick={() => addBlock(block.type)}
                >
                  {block.icon}
                  <span className="text-[10px]">{block.label}</span>
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <div className="p-3 border-b">
              <h3 className="font-medium text-sm">Estructura</h3>
            </div>
            <ScrollArea className="h-full">
              <div className="p-2">
                <Reorder.Group axis="y" values={template.blocks} onReorder={reorderBlocks} className="space-y-1">
                  {template.blocks.map((block) => (
                    <DraggableBlock
                      key={block.id}
                      block={block}
                      isSelected={selectedBlockId === block.id}
                      onSelect={() => setSelectedBlockId(block.id)}
                      onDelete={() => deleteBlock(block.id)}
                    />
                  ))}
                </Reorder.Group>
                {template.blocks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Agrega bloques para comenzar
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Center - Preview */}
        <div className="flex-1 overflow-auto p-6 bg-muted/50">
          <div
            className="mx-auto transition-all duration-300"
            style={{
              width: previewMode === "mobile" ? 375 : template.globalStyles.width,
              backgroundColor: template.globalStyles.backgroundColor,
              padding: 20,
              borderRadius: 8,
            }}
          >
            <div
              style={{
                backgroundColor: template.globalStyles.contentBackground,
                padding: 32,
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                fontFamily: template.globalStyles.fontFamily,
              }}
            >
              {template.blocks.map((block) => (
                <div
                  key={block.id}
                  className={`cursor-pointer rounded transition-all ${
                    selectedBlockId === block.id ? "ring-2 ring-primary ring-offset-2" : "hover:bg-primary/5"
                  }`}
                  onClick={() => setSelectedBlockId(block.id)}
                >
                  <BlockRenderer block={block} globalStyles={template.globalStyles} />
                </div>
              ))}
              {template.blocks.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Agrega bloques desde el panel izquierdo</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Block Editor / Global Styles */}
        <div className="w-72 border-l bg-background">
          <Tabs defaultValue="block" className="h-full flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b h-10 p-0 bg-transparent">
              <TabsTrigger value="block" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                <Settings className="w-4 h-4 mr-1" />
                Bloque
              </TabsTrigger>
              <TabsTrigger value="global" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                <Palette className="w-4 h-4 mr-1" />
                Global
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="block" className="flex-1 overflow-auto m-0">
              {selectedBlock ? (
                <BlockEditor
                  block={selectedBlock}
                  onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
                />
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Selecciona un bloque para editar
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="global" className="flex-1 overflow-auto m-0 p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Color de fondo</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={template.globalStyles.backgroundColor}
                    onChange={(e) => updateGlobalStyle("backgroundColor", e.target.value)}
                    className="w-12 h-8 p-1"
                  />
                  <Input
                    value={template.globalStyles.backgroundColor}
                    onChange={(e) => updateGlobalStyle("backgroundColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Fondo del contenido</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={template.globalStyles.contentBackground}
                    onChange={(e) => updateGlobalStyle("contentBackground", e.target.value)}
                    className="w-12 h-8 p-1"
                  />
                  <Input
                    value={template.globalStyles.contentBackground}
                    onChange={(e) => updateGlobalStyle("contentBackground", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Color primario</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={template.globalStyles.primaryColor}
                    onChange={(e) => updateGlobalStyle("primaryColor", e.target.value)}
                    className="w-12 h-8 p-1"
                  />
                  <Input
                    value={template.globalStyles.primaryColor}
                    onChange={(e) => updateGlobalStyle("primaryColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Ancho del email: {template.globalStyles.width}px</Label>
                <Slider
                  value={[template.globalStyles.width]}
                  onValueChange={([v]) => updateGlobalStyle("width", v)}
                  min={400}
                  max={800}
                  step={20}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Fuente</Label>
                <Select
                  value={template.globalStyles.fontFamily}
                  onValueChange={(v) => updateGlobalStyle("fontFamily", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                    <SelectItem value="Tahoma, sans-serif">Tahoma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Full Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Vista previa del email
            </DialogTitle>
          </DialogHeader>
          <div
            dangerouslySetInnerHTML={{ __html: generateHTML() }}
            className="border rounded-lg overflow-hidden"
          />
          <DialogFooter>
            <Button variant="outline" onClick={copyHTML}>
              <Copy className="w-4 h-4 mr-1" />
              Copiar HTML
            </Button>
            <Button onClick={downloadHTML}>
              <Download className="w-4 h-4 mr-1" />
              Descargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
