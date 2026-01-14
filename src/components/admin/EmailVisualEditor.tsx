import { useState, useCallback, useEffect } from "react";
import { motion, Reorder, useDragControls } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { sanitizeEmailHTML } from "@/lib/sanitize";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Type,
  Image,
  Square,
  Minus,
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
  Download,
  Copy,
  LayoutTemplate,
  Heading1,
  List,
  Columns,
  CircleDot,
  Smartphone,
  Monitor,
  Send,
  Loader2,
  FolderOpen,
  Share2,
  FileText,
  Images,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  Globe,
  Link as LinkIcon,
  Clock,
  Calendar,
  CalendarClock,
  XCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Block types
type BlockType = "heading" | "text" | "image" | "button" | "divider" | "spacer" | "columns" | "list" | "logo" | "social" | "footer" | "gallery";

interface EmailBlock {
  id: string;
  type: BlockType;
  content: Record<string, any>;
  styles: Record<string, any>;
}

interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
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

interface SavedTemplate {
  id: string;
  name: string;
  description: string | null;
  blocks: EmailBlock[];
  global_styles: EmailTemplate["globalStyles"];
  category: string;
  is_default: boolean;
  created_at: string;
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
  {
    type: "social",
    label: "Redes",
    icon: <Share2 className="w-4 h-4" />,
    defaultContent: {
      facebook: "https://facebook.com",
      instagram: "https://instagram.com",
      twitter: "",
      linkedin: "",
      youtube: "",
      website: "",
    },
    defaultStyles: { alignment: "center", iconSize: 24, iconColor: "#3b82f6", spacing: 12 },
  },
  {
    type: "footer",
    label: "Footer",
    icon: <FileText className="w-4 h-4" />,
    defaultContent: {
      companyName: "NovellDent",
      address: "Av. Principal 123, Ciudad",
      phone: "+1 234 567 890",
      email: "info@novelldent.com",
      links: [
        { text: "Términos", url: "#" },
        { text: "Privacidad", url: "#" },
        { text: "Contacto", url: "#" },
      ],
      unsubscribeText: "Si no deseas recibir más emails, puedes darte de baja aquí",
    },
    defaultStyles: { backgroundColor: "#1e3a5f", textColor: "#ffffff", fontSize: 12, padding: 24 },
  },
  {
    type: "gallery",
    label: "Galería",
    icon: <Images className="w-4 h-4" />,
    defaultContent: {
      images: [
        { src: "https://via.placeholder.com/200x150", alt: "Imagen 1" },
        { src: "https://via.placeholder.com/200x150", alt: "Imagen 2" },
        { src: "https://via.placeholder.com/200x150", alt: "Imagen 3" },
      ],
    },
    defaultStyles: { columns: 3, gap: 10, borderRadius: 8 },
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

      {block.type === "social" && (
        <>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Facebook className="w-4 h-4" /> Facebook</Label>
            <Input value={block.content.facebook || ""} onChange={(e) => updateContent("facebook", e.target.value)} placeholder="URL de Facebook" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Instagram className="w-4 h-4" /> Instagram</Label>
            <Input value={block.content.instagram || ""} onChange={(e) => updateContent("instagram", e.target.value)} placeholder="URL de Instagram" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Twitter className="w-4 h-4" /> Twitter/X</Label>
            <Input value={block.content.twitter || ""} onChange={(e) => updateContent("twitter", e.target.value)} placeholder="URL de Twitter" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Linkedin className="w-4 h-4" /> LinkedIn</Label>
            <Input value={block.content.linkedin || ""} onChange={(e) => updateContent("linkedin", e.target.value)} placeholder="URL de LinkedIn" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Youtube className="w-4 h-4" /> YouTube</Label>
            <Input value={block.content.youtube || ""} onChange={(e) => updateContent("youtube", e.target.value)} placeholder="URL de YouTube" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Globe className="w-4 h-4" /> Website</Label>
            <Input value={block.content.website || ""} onChange={(e) => updateContent("website", e.target.value)} placeholder="URL del sitio web" />
          </div>
        </>
      )}

      {block.type === "footer" && (
        <>
          <div className="space-y-2">
            <Label>Nombre de empresa</Label>
            <Input value={block.content.companyName || ""} onChange={(e) => updateContent("companyName", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input value={block.content.address || ""} onChange={(e) => updateContent("address", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input value={block.content.phone || ""} onChange={(e) => updateContent("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={block.content.email || ""} onChange={(e) => updateContent("email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Texto de baja</Label>
            <Textarea value={block.content.unsubscribeText || ""} onChange={(e) => updateContent("unsubscribeText", e.target.value)} rows={2} />
          </div>
        </>
      )}

      {block.type === "gallery" && (
        <div className="space-y-2">
          <Label>URLs de imágenes (una por línea)</Label>
          <Textarea
            value={(block.content.images || []).map((img: any) => img.src).join("\n")}
            onChange={(e) => updateContent("images", e.target.value.split("\n").filter(Boolean).map((src, i) => ({ src, alt: `Imagen ${i + 1}` })))}
            rows={4}
          />
        </div>
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

        {block.styles.textColor !== undefined && (
          <div className="space-y-2 mb-3">
            <Label className="text-xs">Color de texto</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={block.styles.textColor}
                onChange={(e) => updateStyle("textColor", e.target.value)}
                className="w-12 h-8 p-1"
              />
              <Input
                value={block.styles.textColor}
                onChange={(e) => updateStyle("textColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        )}

        {block.styles.iconColor !== undefined && (
          <div className="space-y-2 mb-3">
            <Label className="text-xs">Color de iconos</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={block.styles.iconColor}
                onChange={(e) => updateStyle("iconColor", e.target.value)}
                className="w-12 h-8 p-1"
              />
              <Input
                value={block.styles.iconColor}
                onChange={(e) => updateStyle("iconColor", e.target.value)}
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
              max={48}
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

        {block.styles.iconSize !== undefined && (
          <div className="space-y-2 mb-3">
            <Label className="text-xs">Tamaño de iconos: {block.styles.iconSize}px</Label>
            <Slider
              value={[block.styles.iconSize]}
              onValueChange={([v]) => updateStyle("iconSize", v)}
              min={16}
              max={48}
              step={2}
            />
          </div>
        )}

        {block.styles.spacing !== undefined && (
          <div className="space-y-2 mb-3">
            <Label className="text-xs">Espaciado: {block.styles.spacing}px</Label>
            <Slider
              value={[block.styles.spacing]}
              onValueChange={([v]) => updateStyle("spacing", v)}
              min={4}
              max={32}
              step={2}
            />
          </div>
        )}

        {block.styles.columns !== undefined && (
          <div className="space-y-2 mb-3">
            <Label className="text-xs">Columnas: {block.styles.columns}</Label>
            <Slider
              value={[block.styles.columns]}
              onValueChange={([v]) => updateStyle("columns", v)}
              min={2}
              max={4}
              step={1}
            />
          </div>
        )}

        {block.styles.gap !== undefined && (
          <div className="space-y-2 mb-3">
            <Label className="text-xs">Gap: {block.styles.gap}px</Label>
            <Slider
              value={[block.styles.gap]}
              onValueChange={([v]) => updateStyle("gap", v)}
              min={4}
              max={32}
              step={2}
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

    case "social":
      const socialIcons = [
        { key: "facebook", icon: "📘", label: "Facebook" },
        { key: "instagram", icon: "📷", label: "Instagram" },
        { key: "twitter", icon: "🐦", label: "Twitter" },
        { key: "linkedin", icon: "💼", label: "LinkedIn" },
        { key: "youtube", icon: "📺", label: "YouTube" },
        { key: "website", icon: "🌐", label: "Website" },
      ];
      return (
        <div style={{ display: "flex", justifyContent: getAlignment(block.styles.alignment), gap: block.styles.spacing, padding: "12px 0" }}>
          {socialIcons.map(({ key, icon }) => {
            const url = block.content[key];
            if (!url) return null;
            return (
              <a
                key={key}
                href={url}
                style={{
                  fontSize: block.styles.iconSize,
                  textDecoration: "none",
                }}
              >
                {icon}
              </a>
            );
          })}
        </div>
      );

    case "footer":
      return (
        <div
          style={{
            backgroundColor: block.styles.backgroundColor,
            color: block.styles.textColor,
            padding: block.styles.padding,
            textAlign: "center",
            fontSize: block.styles.fontSize,
            borderRadius: 8,
            marginTop: 16,
          }}
        >
          <div style={{ fontWeight: "bold", fontSize: block.styles.fontSize + 2, marginBottom: 8 }}>
            {block.content.companyName}
          </div>
          <div style={{ marginBottom: 4 }}>{block.content.address}</div>
          <div style={{ marginBottom: 4 }}>{block.content.phone} | {block.content.email}</div>
          {block.content.links && (
            <div style={{ display: "flex", justifyContent: "center", gap: 16, margin: "12px 0" }}>
              {(block.content.links || []).map((link: any, i: number) => (
                <a key={i} href={link.url} style={{ color: block.styles.textColor, textDecoration: "underline" }}>
                  {link.text}
                </a>
              ))}
            </div>
          )}
          <div style={{ fontSize: block.styles.fontSize - 2, opacity: 0.8, marginTop: 12 }}>
            {block.content.unsubscribeText}
          </div>
        </div>
      );

    case "gallery":
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${block.styles.columns}, 1fr)`,
            gap: block.styles.gap,
            padding: "8px 0",
          }}
        >
          {(block.content.images || []).map((img: any, i: number) => (
            <img
              key={i}
              src={img.src}
              alt={img.alt}
              style={{
                width: "100%",
                borderRadius: block.styles.borderRadius,
              }}
            />
          ))}
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
            {block.type === "social" && <span>Redes sociales</span>}
            {block.type === "footer" && <span>Footer</span>}
            {block.type === "gallery" && <span>{(block.content.images || []).length} imágenes</span>}
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
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showScheduledList, setShowScheduledList] = useState(false);
  const [history, setHistory] = useState<EmailTemplate[]>([defaultTemplate]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [scheduledEmails, setScheduledEmails] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [targetEmails, setTargetEmails] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [scheduleName, setScheduleName] = useState("");

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
        case "social":
          const icons = [
            { key: "facebook", icon: "📘" },
            { key: "instagram", icon: "📷" },
            { key: "twitter", icon: "🐦" },
            { key: "linkedin", icon: "💼" },
            { key: "youtube", icon: "📺" },
            { key: "website", icon: "🌐" },
          ];
          const socialLinks = icons
            .filter(({ key }) => block.content[key])
            .map(({ key, icon }) => `<a href="${block.content[key]}" style="font-size: ${block.styles.iconSize}px; text-decoration: none; margin: 0 ${block.styles.spacing / 2}px;">${icon}</a>`)
            .join("");
          return `<div style="text-align: ${block.styles.alignment}; padding: 12px 0;">${socialLinks}</div>`;
        case "footer":
          const footerLinks = (block.content.links || [])
            .map((link: any) => `<a href="${link.url}" style="color: ${block.styles.textColor}; text-decoration: underline; margin: 0 8px;">${link.text}</a>`)
            .join("");
          return `<div style="background-color: ${block.styles.backgroundColor}; color: ${block.styles.textColor}; padding: ${block.styles.padding}px; text-align: center; font-size: ${block.styles.fontSize}px; border-radius: 8px; margin-top: 16px;">
            <div style="font-weight: bold; font-size: ${block.styles.fontSize + 2}px; margin-bottom: 8px;">${block.content.companyName}</div>
            <div style="margin-bottom: 4px;">${block.content.address}</div>
            <div style="margin-bottom: 4px;">${block.content.phone} | ${block.content.email}</div>
            <div style="margin: 12px 0;">${footerLinks}</div>
            <div style="font-size: ${block.styles.fontSize - 2}px; opacity: 0.8; margin-top: 12px;">${block.content.unsubscribeText}</div>
          </div>`;
        case "gallery":
          const galleryImages = (block.content.images || [])
            .map((img: any) => `<img src="${img.src}" alt="${img.alt}" style="width: calc(${100 / block.styles.columns}% - ${block.styles.gap}px); border-radius: ${block.styles.borderRadius}px; margin: ${block.styles.gap / 2}px;">`)
            .join("");
          return `<div style="display: flex; flex-wrap: wrap; justify-content: center; padding: 8px 0;">${galleryImages}</div>`;
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

  // Save template to database
  const saveTemplate = async () => {
    if (!templateName.trim()) {
      toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("email_templates").insert({
        name: templateName,
        description: templateDescription || null,
        blocks: template.blocks as any,
        global_styles: template.globalStyles as any,
        category: "custom",
      });

      if (error) throw error;

      toast({ title: "Guardado", description: "La plantilla ha sido guardada exitosamente" });
      setShowSaveModal(false);
      setTemplateName("");
      setTemplateDescription("");
    } catch (error) {
      console.error("Error saving template:", error);
      toast({ title: "Error", description: "No se pudo guardar la plantilla", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Load templates from database
  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setSavedTemplates((data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        blocks: item.blocks as EmailBlock[],
        global_styles: item.global_styles as EmailTemplate["globalStyles"],
        category: item.category,
        is_default: item.is_default,
        created_at: item.created_at,
      })));
    } catch (error) {
      console.error("Error loading templates:", error);
      toast({ title: "Error", description: "No se pudieron cargar las plantillas", variant: "destructive" });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadTemplate = (saved: SavedTemplate) => {
    const loadedTemplate: EmailTemplate = {
      id: saved.id,
      name: saved.name,
      description: saved.description || undefined,
      blocks: saved.blocks,
      globalStyles: saved.global_styles,
    };
    setTemplate(loadedTemplate);
    saveToHistory(loadedTemplate);
    setShowLoadModal(false);
    toast({ title: "Cargado", description: `Plantilla "${saved.name}" cargada` });
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase.from("email_templates").delete().eq("id", id);
      if (error) throw error;
      setSavedTemplates((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Eliminado", description: "La plantilla ha sido eliminada" });
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({ title: "Error", description: "No se pudo eliminar la plantilla", variant: "destructive" });
    }
  };

  // Send email with template
  const sendEmail = async () => {
    if (!emailSubject.trim()) {
      toast({ title: "Error", description: "El asunto es obligatorio", variant: "destructive" });
      return;
    }

    setIsSending(true);
    try {
      const emails = targetEmails.trim()
        ? targetEmails.split(",").map((e) => e.trim()).filter(Boolean)
        : undefined;

      const html = generateHTML();

      const { data, error } = await supabase.functions.invoke("send-referral-promo", {
        body: {
          targetEmails: emails,
          subject: emailSubject,
          customMessage: "",
          customHtml: html,
        },
      });

      if (error) throw error;

      toast({
        title: "Emails enviados",
        description: `Se enviaron ${data.sent} de ${data.total} emails correctamente`,
      });
      setShowSendModal(false);
      setTargetEmails("");
      setEmailSubject("");
    } catch (error) {
      console.error("Error sending emails:", error);
      toast({ title: "Error", description: "No se pudieron enviar los emails", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  // Schedule email
  const scheduleEmail = async () => {
    if (!emailSubject.trim() || !scheduledDate || !scheduledTime || !scheduleName.trim()) {
      toast({ title: "Error", description: "Nombre, asunto, fecha y hora son obligatorios", variant: "destructive" });
      return;
    }

    setIsScheduling(true);
    try {
      const emails = targetEmails.trim()
        ? targetEmails.split(",").map((e) => e.trim()).filter(Boolean)
        : null;

      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
      
      if (scheduledAt <= new Date()) {
        toast({ title: "Error", description: "La fecha debe ser futura", variant: "destructive" });
        setIsScheduling(false);
        return;
      }

      const html = generateHTML();

      const { error } = await supabase.from("scheduled_emails").insert({
        name: scheduleName,
        subject: emailSubject,
        html_content: html,
        target_emails: emails,
        scheduled_at: scheduledAt.toISOString(),
        template_id: template.id !== "new-template" ? template.id : null,
      });

      if (error) throw error;

      toast({
        title: "Email programado",
        description: `Se enviará el ${scheduledDate} a las ${scheduledTime}`,
      });
      setShowScheduleModal(false);
      setTargetEmails("");
      setEmailSubject("");
      setScheduledDate("");
      setScheduledTime("");
      setScheduleName("");
    } catch (error) {
      console.error("Error scheduling email:", error);
      toast({ title: "Error", description: "No se pudo programar el email", variant: "destructive" });
    } finally {
      setIsScheduling(false);
    }
  };

  // Load scheduled emails
  const loadScheduledEmails = async () => {
    setLoadingScheduled(true);
    try {
      const { data, error } = await supabase
        .from("scheduled_emails")
        .select("*")
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      setScheduledEmails(data || []);
    } catch (error) {
      console.error("Error loading scheduled emails:", error);
      toast({ title: "Error", description: "No se pudieron cargar los emails programados", variant: "destructive" });
    } finally {
      setLoadingScheduled(false);
    }
  };

  // Cancel scheduled email
  const cancelScheduledEmail = async (id: string) => {
    try {
      const { error } = await supabase
        .from("scheduled_emails")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;
      setScheduledEmails((prev) => prev.map((e) => e.id === id ? { ...e, status: "cancelled" } : e));
      toast({ title: "Cancelado", description: "El email programado ha sido cancelado" });
    } catch (error) {
      console.error("Error cancelling scheduled email:", error);
      toast({ title: "Error", description: "No se pudo cancelar el email", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (showLoadModal) {
      loadTemplates();
    }
  }, [showLoadModal]);

  useEffect(() => {
    if (showScheduledList) {
      loadScheduledEmails();
    }
  }, [showScheduledList]);

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
        
        <div className="flex items-center gap-2 flex-wrap">
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
          <Button variant="outline" size="sm" onClick={() => setShowLoadModal(true)}>
            <FolderOpen className="w-4 h-4 mr-1" />
            Cargar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSaveModal(true)}>
            <Save className="w-4 h-4 mr-1" />
            Guardar
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="outline" size="sm" onClick={() => setShowPreviewModal(true)}>
            <Eye className="w-4 h-4 mr-1" />
            Vista previa
          </Button>
          <Button variant="outline" size="sm" onClick={copyHTML}>
            <Copy className="w-4 h-4 mr-1" />
            HTML
          </Button>
          <Button variant="outline" size="sm" onClick={downloadHTML}>
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowScheduledList(true)}>
            <Clock className="w-4 h-4 mr-1" />
            Programados
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowScheduleModal(true)}>
            <Calendar className="w-4 h-4 mr-1" />
            Programar
          </Button>
          <Button size="sm" onClick={() => setShowSendModal(true)}>
            <Send className="w-4 h-4 mr-1" />
            Enviar
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
            dangerouslySetInnerHTML={{ __html: sanitizeEmailHTML(generateHTML()) }}
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

      {/* Save Modal */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              Guardar plantilla
            </DialogTitle>
            <DialogDescription>
              Guarda esta plantilla para usarla más tarde
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Mi plantilla personalizada"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Descripción opcional..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveModal(false)}>
              Cancelar
            </Button>
            <Button onClick={saveTemplate} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Modal */}
      <Dialog open={showLoadModal} onOpenChange={setShowLoadModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Cargar plantilla
            </DialogTitle>
            <DialogDescription>
              Selecciona una plantilla guardada
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            {loadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : savedTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay plantillas guardadas
              </div>
            ) : (
              <div className="space-y-2">
                {savedTemplates.map((saved) => (
                  <Card key={saved.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1" onClick={() => loadTemplate(saved)}>
                        <h4 className="font-medium">{saved.name}</h4>
                        {saved.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{saved.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(saved.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTemplate(saved.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Send Modal */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Enviar email
            </DialogTitle>
            <DialogDescription>
              Envía este email a tus pacientes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Asunto *</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="🎁 ¡Tenemos algo especial para ti!"
              />
            </div>
            <div className="space-y-2">
              <Label>Destinatarios</Label>
              <Input
                value={targetEmails}
                onChange={(e) => setTargetEmails(e.target.value)}
                placeholder="email1@ejemplo.com, email2@ejemplo.com"
              />
              <p className="text-xs text-muted-foreground">
                Deja vacío para enviar a todos los pacientes
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 text-primary" />
              <p className="text-xs text-muted-foreground">
                Se enviará el diseño actual del editor como email HTML
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendModal(false)}>
              Cancelar
            </Button>
            <Button onClick={sendEmail} disabled={isSending}>
              {isSending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5" />
              Programar envío
            </DialogTitle>
            <DialogDescription>
              Programa el envío de este email para una fecha y hora específica
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la campaña *</Label>
              <Input
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                placeholder="Campaña de bienvenida enero"
              />
            </div>
            <div className="space-y-2">
              <Label>Asunto *</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="🎁 ¡Tenemos algo especial para ti!"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora *</Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Destinatarios</Label>
              <Input
                value={targetEmails}
                onChange={(e) => setTargetEmails(e.target.value)}
                placeholder="email1@ejemplo.com, email2@ejemplo.com"
              />
              <p className="text-xs text-muted-foreground">
                Deja vacío para enviar a todos los pacientes
              </p>
            </div>
            <div className="bg-primary/5 rounded-lg p-3 flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 text-primary" />
              <p className="text-xs text-muted-foreground">
                El email se enviará automáticamente en la fecha y hora programada
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
              Cancelar
            </Button>
            <Button onClick={scheduleEmail} disabled={isScheduling}>
              {isScheduling ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Calendar className="w-4 h-4 mr-1" />}
              Programar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scheduled Emails List Modal */}
      <Dialog open={showScheduledList} onOpenChange={setShowScheduledList}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Emails programados
            </DialogTitle>
            <DialogDescription>
              Gestiona tus campañas de email programadas
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {loadingScheduled ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : scheduledEmails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay emails programados
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledEmails.map((scheduled) => (
                  <Card key={scheduled.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{scheduled.name}</h4>
                          <Badge
                            variant={
                              scheduled.status === "pending" ? "default" :
                              scheduled.status === "sent" ? "secondary" :
                              scheduled.status === "cancelled" ? "outline" : "destructive"
                            }
                            className="shrink-0"
                          >
                            {scheduled.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                            {scheduled.status === "sent" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {scheduled.status === "cancelled" && <XCircle className="w-3 h-3 mr-1" />}
                            {scheduled.status === "failed" && <AlertCircle className="w-3 h-3 mr-1" />}
                            {scheduled.status === "pending" ? "Pendiente" :
                             scheduled.status === "sent" ? "Enviado" :
                             scheduled.status === "cancelled" ? "Cancelado" : "Fallido"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{scheduled.subject}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(scheduled.scheduled_at).toLocaleString()}
                          </span>
                          {scheduled.target_emails ? (
                            <span>{scheduled.target_emails.length} destinatarios</span>
                          ) : (
                            <span>Todos los pacientes</span>
                          )}
                        </div>
                        {scheduled.result && scheduled.status === "sent" && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Enviados: {scheduled.result.sent} | Fallidos: {scheduled.result.failed || 0}
                          </p>
                        )}
                      </div>
                      {scheduled.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive shrink-0"
                          onClick={() => cancelScheduledEmail(scheduled.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduledList(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
