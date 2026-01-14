import { useState, useRef } from "react";
import { motion, Reorder } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sanitizeHTML } from "@/lib/sanitize";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Type,
  Image,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Eye,
  Download,
  Upload,
  Palette,
  Layout,
  FileText,
  Settings,
  Copy,
  RotateCcw,
  Loader2
} from "lucide-react";

interface TemplateBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'image' | 'divider' | 'list' | 'table' | 'signature' | 'logo';
  content: string;
  styles: {
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    marginTop?: number;
    marginBottom?: number;
  };
  imageUrl?: string;
}

interface Template {
  id: string;
  name: string;
  category: string;
  blocks: TemplateBlock[];
  globalStyles: {
    fontFamily: string;
    primaryColor: string;
    secondaryColor: string;
    headerLogo?: string;
    footerText?: string;
  };
}

const defaultGlobalStyles = {
  fontFamily: 'Arial',
  primaryColor: '#0891b2',
  secondaryColor: '#64748b',
  footerText: 'NovellDent - Tu sonrisa, nuestra pasión'
};

const blockTypes = [
  { id: 'heading', label: 'Título', icon: Type },
  { id: 'paragraph', label: 'Párrafo', icon: AlignLeft },
  { id: 'image', label: 'Imagen', icon: Image },
  { id: 'divider', label: 'Separador', icon: Square },
  { id: 'list', label: 'Lista', icon: List },
  { id: 'signature', label: 'Firma', icon: FileText },
  { id: 'logo', label: 'Logo', icon: Layout }
];

const fontFamilies = [
  'Arial',
  'Times New Roman',
  'Helvetica',
  'Georgia',
  'Verdana',
  'Courier New'
];

export const TemplateEditor = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [blocks, setBlocks] = useState<TemplateBlock[]>([
    {
      id: '1',
      type: 'logo',
      content: 'Logo de la Clínica',
      styles: { textAlign: 'center', marginBottom: 20 }
    },
    {
      id: '2',
      type: 'heading',
      content: 'CONSENTIMIENTO INFORMADO',
      styles: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 }
    },
    {
      id: '3',
      type: 'paragraph',
      content: 'Yo, {{NOMBRE_PACIENTE}}, identificado con documento {{DOCUMENTO}}, declaro que he sido informado(a) sobre el tratamiento propuesto.',
      styles: { fontSize: 12, textAlign: 'left', marginBottom: 12 }
    }
  ]);
  
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [globalStyles, setGlobalStyles] = useState(defaultGlobalStyles);
  const [templateName, setTemplateName] = useState('Nueva Plantilla');
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');

  const addBlock = (type: TemplateBlock['type']) => {
    const newBlock: TemplateBlock = {
      id: Date.now().toString(),
      type,
      content: type === 'heading' ? 'Nuevo Título' : 
               type === 'paragraph' ? 'Nuevo párrafo de texto...' :
               type === 'list' ? '• Elemento 1\n• Elemento 2\n• Elemento 3' :
               type === 'signature' ? 'Firma: _______________' :
               type === 'logo' ? 'Logo' :
               type === 'divider' ? '' : '',
      styles: {
        fontSize: type === 'heading' ? 18 : 12,
        fontWeight: type === 'heading' ? 'bold' : 'normal',
        textAlign: 'left',
        marginTop: 8,
        marginBottom: 8
      }
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlock(newBlock.id);
  };

  const updateBlock = (id: string, updates: Partial<TemplateBlock>) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id));
    if (selectedBlock === id) setSelectedBlock(null);
  };

  const duplicateBlock = (id: string) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;
    
    const newBlock = {
      ...block,
      id: Date.now().toString()
    };
    const index = blocks.findIndex(b => b.id === id);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
  };

  const handleImageUpload = async (blockId: string, file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateBlock(blockId, { imageUrl: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la imagen",
        variant: "destructive"
      });
    }
  };

  const saveTemplate = useMutation({
    mutationFn: async () => {
      const template: Template = {
        id: Date.now().toString(),
        name: templateName,
        category: 'custom',
        blocks,
        globalStyles
      };

      const { error } = await supabase.from('email_templates').insert({
        name: templateName,
        category: 'document',
        blocks: blocks as any,
        global_styles: globalStyles as any,
        description: 'Plantilla de documento personalizada'
      });

      if (error) throw error;
      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({ title: "Plantilla guardada", description: "La plantilla ha sido guardada correctamente" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo guardar la plantilla", variant: "destructive" });
    }
  });

  const generateHTML = (): string => {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: ${globalStyles.fontFamily}, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 40px;
            line-height: 1.6;
          }
          .block { margin: 10px 0; }
          .divider { border-top: 1px solid #ccc; margin: 20px 0; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
    `;

    blocks.forEach(block => {
      const style = `
        font-size: ${block.styles.fontSize || 12}px;
        font-weight: ${block.styles.fontWeight || 'normal'};
        font-style: ${block.styles.fontStyle || 'normal'};
        text-align: ${block.styles.textAlign || 'left'};
        color: ${block.styles.color || '#000'};
        margin-top: ${block.styles.marginTop || 0}px;
        margin-bottom: ${block.styles.marginBottom || 0}px;
      `;

      switch (block.type) {
        case 'heading':
          html += `<h2 class="block" style="${style}">${block.content}</h2>`;
          break;
        case 'paragraph':
          html += `<p class="block" style="${style}">${block.content}</p>`;
          break;
        case 'image':
          html += `<div class="block" style="${style}"><img src="${block.imageUrl || ''}" alt="Image" /></div>`;
          break;
        case 'divider':
          html += `<div class="divider"></div>`;
          break;
        case 'list':
          html += `<ul class="block" style="${style}">${block.content.split('\n').map(item => `<li>${item.replace('• ', '')}</li>`).join('')}</ul>`;
          break;
        case 'signature':
          html += `<div class="block" style="${style}; margin-top: 40px;">${block.content}</div>`;
          break;
        case 'logo':
          html += `<div class="block" style="${style}"><img src="${block.imageUrl || '/logo.png'}" alt="Logo" style="max-height: 80px;" /></div>`;
          break;
      }
    });

    if (globalStyles.footerText) {
      html += `<footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center; color: ${globalStyles.secondaryColor}; font-size: 10px;">${globalStyles.footerText}</footer>`;
    }

    html += '</body></html>';
    return html;
  };

  const downloadTemplate = () => {
    const html = generateHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedBlockData = blocks.find(b => b.id === selectedBlock);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="text-lg font-semibold w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Vista Previa
          </Button>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Descargar
          </Button>
          <Button 
            onClick={() => saveTemplate.mutate()}
            disabled={saveTemplate.isPending}
          >
            {saveTemplate.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Block Palette */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Bloques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {blockTypes.map((type) => (
              <motion.button
                key={type.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left"
                onClick={() => addBlock(type.id as TemplateBlock['type'])}
              >
                <type.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{type.label}</span>
                <Plus className="w-4 h-4 ml-auto text-muted-foreground" />
              </motion.button>
            ))}
          </CardContent>
        </Card>

        {/* Editor Canvas */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Editor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[500px] p-4 bg-white dark:bg-gray-900 rounded-lg border">
              <Reorder.Group axis="y" values={blocks} onReorder={setBlocks}>
                {blocks.map((block) => (
                  <Reorder.Item key={block.id} value={block}>
                    <motion.div
                      className={`group relative p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                        selectedBlock === block.id
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-secondary/50'
                      }`}
                      onClick={() => setSelectedBlock(block.id)}
                    >
                      {/* Drag Handle */}
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </div>

                      {/* Block Content Preview */}
                      <div
                        className="pl-6"
                        style={{
                          fontSize: block.styles.fontSize,
                          fontWeight: block.styles.fontWeight,
                          fontStyle: block.styles.fontStyle,
                          textAlign: block.styles.textAlign,
                          color: block.styles.color
                        }}
                      >
                        {block.type === 'divider' ? (
                          <hr className="border-t border-gray-300" />
                        ) : block.type === 'image' || block.type === 'logo' ? (
                          block.imageUrl ? (
                            <img src={block.imageUrl} alt="" className="max-h-20 object-contain" />
                          ) : (
                            <div className="h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                              <Image className="w-8 h-8" />
                            </div>
                          )
                        ) : (
                          <p className="line-clamp-2">{block.content}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </motion.div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>

              {blocks.length === 0 && (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Layout className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Arrastra bloques aquí para construir tu plantilla</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Properties Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Propiedades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="editor" className="flex-1">Bloque</TabsTrigger>
                <TabsTrigger value="styles" className="flex-1">Global</TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-4 mt-4">
                {selectedBlockData ? (
                  <>
                    {/* Content */}
                    {selectedBlockData.type !== 'divider' && selectedBlockData.type !== 'image' && selectedBlockData.type !== 'logo' && (
                      <div className="space-y-2">
                        <Label>Contenido</Label>
                        <Textarea
                          value={selectedBlockData.content}
                          onChange={(e) => updateBlock(selectedBlockData.id, { content: e.target.value })}
                          rows={4}
                        />
                      </div>
                    )}

                    {/* Image Upload */}
                    {(selectedBlockData.type === 'image' || selectedBlockData.type === 'logo') && (
                      <div className="space-y-2">
                        <Label>Imagen</Label>
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(selectedBlockData.id, file);
                          }}
                        />
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Subir Imagen
                        </Button>
                      </div>
                    )}

                    {/* Font Size */}
                    <div className="space-y-2">
                      <Label>Tamaño de Fuente</Label>
                      <Select
                        value={String(selectedBlockData.styles.fontSize || 12)}
                        onValueChange={(v) => updateBlock(selectedBlockData.id, {
                          styles: { ...selectedBlockData.styles, fontSize: parseInt(v) }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(size => (
                            <SelectItem key={size} value={String(size)}>{size}px</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Text Formatting */}
                    <div className="space-y-2">
                      <Label>Formato</Label>
                      <div className="flex gap-1">
                        <Button
                          variant={selectedBlockData.styles.fontWeight === 'bold' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateBlock(selectedBlockData.id, {
                            styles: { ...selectedBlockData.styles, fontWeight: selectedBlockData.styles.fontWeight === 'bold' ? 'normal' : 'bold' }
                          })}
                        >
                          <Bold className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={selectedBlockData.styles.fontStyle === 'italic' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateBlock(selectedBlockData.id, {
                            styles: { ...selectedBlockData.styles, fontStyle: selectedBlockData.styles.fontStyle === 'italic' ? 'normal' : 'italic' }
                          })}
                        >
                          <Italic className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Alignment */}
                    <div className="space-y-2">
                      <Label>Alineación</Label>
                      <div className="flex gap-1">
                        {(['left', 'center', 'right'] as const).map((align) => (
                          <Button
                            key={align}
                            variant={selectedBlockData.styles.textAlign === align ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateBlock(selectedBlockData.id, {
                              styles: { ...selectedBlockData.styles, textAlign: align }
                            })}
                          >
                            {align === 'left' && <AlignLeft className="w-4 h-4" />}
                            {align === 'center' && <AlignCenter className="w-4 h-4" />}
                            {align === 'right' && <AlignRight className="w-4 h-4" />}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Color */}
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Input
                        type="color"
                        value={selectedBlockData.styles.color || '#000000'}
                        onChange={(e) => updateBlock(selectedBlockData.id, {
                          styles: { ...selectedBlockData.styles, color: e.target.value }
                        })}
                        className="h-10 cursor-pointer"
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Selecciona un bloque para editar sus propiedades
                  </p>
                )}
              </TabsContent>

              <TabsContent value="styles" className="space-y-4 mt-4">
                {/* Font Family */}
                <div className="space-y-2">
                  <Label>Tipografía</Label>
                  <Select
                    value={globalStyles.fontFamily}
                    onValueChange={(v) => setGlobalStyles({ ...globalStyles, fontFamily: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontFamilies.map(font => (
                        <SelectItem key={font} value={font}>{font}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Primary Color */}
                <div className="space-y-2">
                  <Label>Color Primario</Label>
                  <Input
                    type="color"
                    value={globalStyles.primaryColor}
                    onChange={(e) => setGlobalStyles({ ...globalStyles, primaryColor: e.target.value })}
                    className="h-10 cursor-pointer"
                  />
                </div>

                {/* Secondary Color */}
                <div className="space-y-2">
                  <Label>Color Secundario</Label>
                  <Input
                    type="color"
                    value={globalStyles.secondaryColor}
                    onChange={(e) => setGlobalStyles({ ...globalStyles, secondaryColor: e.target.value })}
                    className="h-10 cursor-pointer"
                  />
                </div>

                {/* Footer Text */}
                <div className="space-y-2">
                  <Label>Pie de Página</Label>
                  <Input
                    value={globalStyles.footerText}
                    onChange={(e) => setGlobalStyles({ ...globalStyles, footerText: e.target.value })}
                    placeholder="Texto del pie de página"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa: {templateName}</DialogTitle>
          </DialogHeader>
          <div 
            className="bg-white p-8 rounded-lg border"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(generateHTML()) }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cerrar
            </Button>
            <Button onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
