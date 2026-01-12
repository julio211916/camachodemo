import { useState } from "react";
import { motion, Reorder } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Layout,
  Type,
  Image,
  Square,
  Columns,
  GripVertical,
  Plus,
  Trash2,
  Copy,
  Eye,
  Save,
  Settings,
  Palette,
  Monitor,
  Smartphone,
  Tablet,
  Code,
  Upload,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Star,
  MessageSquare,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Users
} from "lucide-react";

interface PageBlock {
  id: string;
  type: 'hero' | 'text' | 'image' | 'services' | 'testimonials' | 'cta' | 'contact' | 'team' | 'gallery' | 'faq' | 'map' | 'form';
  content: Record<string, any>;
  styles: Record<string, any>;
  visible: boolean;
}

interface PageSettings {
  title: string;
  description: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  headerStyle: 'fixed' | 'static';
  footerEnabled: boolean;
}

const blockTemplates = [
  { id: 'hero', label: 'Hero Section', icon: Layout, description: 'Sección principal con título y CTA' },
  { id: 'text', label: 'Texto', icon: Type, description: 'Bloque de texto con formato' },
  { id: 'image', label: 'Imagen', icon: Image, description: 'Imagen con opciones de diseño' },
  { id: 'services', label: 'Servicios', icon: Square, description: 'Grid de servicios destacados' },
  { id: 'testimonials', label: 'Testimonios', icon: MessageSquare, description: 'Carrusel de testimonios' },
  { id: 'cta', label: 'Call to Action', icon: Star, description: 'Sección de llamada a la acción' },
  { id: 'contact', label: 'Contacto', icon: Mail, description: 'Información de contacto' },
  { id: 'team', label: 'Equipo', icon: Users, description: 'Miembros del equipo' },
  { id: 'gallery', label: 'Galería', icon: Image, description: 'Galería de imágenes' },
  { id: 'faq', label: 'FAQ', icon: MessageSquare, description: 'Preguntas frecuentes' },
  { id: 'map', label: 'Mapa', icon: MapPin, description: 'Mapa de ubicación' },
  { id: 'form', label: 'Formulario', icon: FileText, description: 'Formulario de contacto' }
];

const defaultBlockContent: Record<string, Record<string, any>> = {
  hero: {
    title: 'Bienvenido a NovellDent',
    subtitle: 'Tu sonrisa, nuestra pasión',
    buttonText: 'Agendar Cita',
    buttonLink: '/#citas',
    backgroundImage: '',
    overlay: true
  },
  text: {
    heading: 'Sobre Nosotros',
    content: 'Somos una clínica dental comprometida con la excelencia...',
    alignment: 'center'
  },
  services: {
    heading: 'Nuestros Servicios',
    items: [
      { title: 'Limpieza Dental', description: 'Limpieza profesional completa', icon: 'tooth' },
      { title: 'Ortodoncia', description: 'Brackets y alineadores', icon: 'smile' },
      { title: 'Implantes', description: 'Implantes dentales de titanio', icon: 'implant' }
    ]
  },
  testimonials: {
    heading: 'Lo que dicen nuestros pacientes',
    items: [
      { name: 'María García', text: 'Excelente atención y resultados', rating: 5 },
      { name: 'Carlos López', text: 'Muy profesionales', rating: 5 }
    ]
  },
  cta: {
    heading: '¿Listo para tu nueva sonrisa?',
    subheading: 'Agenda tu cita hoy',
    buttonText: 'Contactar',
    buttonLink: '/#contacto',
    backgroundColor: '#0891b2'
  },
  contact: {
    heading: 'Contáctanos',
    phone: '+52 55 1234 5678',
    email: 'info@novelldent.com',
    address: 'Av. Principal #123, Ciudad',
    hours: 'Lun-Vie: 9am-7pm, Sáb: 9am-2pm'
  },
  team: {
    heading: 'Nuestro Equipo',
    members: [
      { name: 'Dr. Juan Pérez', role: 'Director Médico', photo: '' },
      { name: 'Dra. Ana Martínez', role: 'Ortodoncista', photo: '' }
    ]
  },
  gallery: {
    heading: 'Galería',
    images: []
  },
  faq: {
    heading: 'Preguntas Frecuentes',
    items: [
      { question: '¿Cuáles son sus horarios?', answer: 'Atendemos de Lunes a Viernes de 9am a 7pm' },
      { question: '¿Aceptan seguros?', answer: 'Sí, trabajamos con las principales aseguradoras' }
    ]
  },
  map: {
    heading: 'Ubicación',
    embedUrl: '',
    address: 'Av. Principal #123, Ciudad'
  },
  form: {
    heading: 'Envíanos un mensaje',
    fields: ['name', 'email', 'phone', 'message'],
    buttonText: 'Enviar'
  }
};

export const CMSBuilder = () => {
  const { toast } = useToast();
  const [blocks, setBlocks] = useState<PageBlock[]>([
    { id: '1', type: 'hero', content: defaultBlockContent.hero, styles: {}, visible: true },
    { id: '2', type: 'services', content: defaultBlockContent.services, styles: {}, visible: true },
    { id: '3', type: 'testimonials', content: defaultBlockContent.testimonials, styles: {}, visible: true },
    { id: '4', type: 'cta', content: defaultBlockContent.cta, styles: {}, visible: true },
    { id: '5', type: 'contact', content: defaultBlockContent.contact, styles: {}, visible: true }
  ]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<PageSettings>({
    title: 'NovellDent - Clínica Dental',
    description: 'La mejor clínica dental de la ciudad',
    favicon: '/favicon.ico',
    primaryColor: '#0891b2',
    secondaryColor: '#64748b',
    fontFamily: 'Inter',
    headerStyle: 'fixed',
    footerEnabled: true
  });

  const addBlock = (type: PageBlock['type']) => {
    const newBlock: PageBlock = {
      id: Date.now().toString(),
      type,
      content: { ...defaultBlockContent[type] },
      styles: {},
      visible: true
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlock(newBlock.id);
    setShowAddBlock(false);
  };

  const updateBlock = (id: string, updates: Partial<PageBlock>) => {
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
    const newBlock = { ...block, id: Date.now().toString() };
    const index = blocks.findIndex(b => b.id === id);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === id);
    if (direction === 'up' && index > 0) {
      const newBlocks = [...blocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      setBlocks(newBlocks);
    } else if (direction === 'down' && index < blocks.length - 1) {
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      setBlocks(newBlocks);
    }
  };

  const generatePreviewHTML = () => {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${settings.title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: ${settings.fontFamily}, sans-serif; }
          .section { padding: 60px 20px; }
          .container { max-width: 1200px; margin: 0 auto; }
          .hero { 
            min-height: 80vh; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            background: linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor}); 
            color: white; 
            text-align: center; 
          }
          .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
          .hero p { font-size: 1.25rem; opacity: 0.9; }
          .btn { 
            display: inline-block; 
            padding: 12px 24px; 
            background: white; 
            color: ${settings.primaryColor}; 
            text-decoration: none; 
            border-radius: 8px; 
            margin-top: 20px; 
            font-weight: bold; 
          }
          .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
          .service-card { padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .testimonial { padding: 24px; background: #f8f9fa; border-radius: 12px; margin-bottom: 16px; }
          .cta { background: ${settings.primaryColor}; color: white; text-align: center; }
        </style>
      </head>
      <body>
        ${blocks.filter(b => b.visible).map(block => {
          switch (block.type) {
            case 'hero':
              return `
                <section class="hero">
                  <div class="container">
                    <h1>${block.content.title}</h1>
                    <p>${block.content.subtitle}</p>
                    <a href="${block.content.buttonLink}" class="btn">${block.content.buttonText}</a>
                  </div>
                </section>
              `;
            case 'services':
              return `
                <section class="section">
                  <div class="container">
                    <h2 style="text-align: center; margin-bottom: 40px;">${block.content.heading}</h2>
                    <div class="services-grid">
                      ${block.content.items?.map((item: any) => `
                        <div class="service-card">
                          <h3>${item.title}</h3>
                          <p>${item.description}</p>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </section>
              `;
            case 'cta':
              return `
                <section class="section cta">
                  <div class="container">
                    <h2>${block.content.heading}</h2>
                    <p>${block.content.subheading}</p>
                    <a href="${block.content.buttonLink}" class="btn">${block.content.buttonText}</a>
                  </div>
                </section>
              `;
            default:
              return `<section class="section"><div class="container"><p>Block: ${block.type}</p></div></section>`;
          }
        }).join('\n')}
      </body>
      </html>
    `;
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage or backend
      localStorage.setItem('cms-blocks', JSON.stringify(blocks));
      localStorage.setItem('cms-settings', JSON.stringify(settings));
      toast({ title: "Cambios guardados", description: "Los cambios han sido guardados correctamente" });
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron guardar los cambios", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedBlockData = blocks.find(b => b.id === selectedBlock);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-card rounded-xl border">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowAddBlock(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Agregar Bloque
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Device Preview */}
          <div className="flex items-center bg-secondary/50 rounded-lg p-1">
            <Button
              variant={previewMode === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('desktop')}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={previewMode === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('tablet')}
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={previewMode === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('mobile')}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="outline" onClick={() => setShowPreview(true)} className="gap-2">
            <Eye className="w-4 h-4" />
            Vista Previa
          </Button>
          
          <Button onClick={saveChanges} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Block List */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Estructura de la Página
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Reorder.Group axis="y" values={blocks} onReorder={setBlocks} className="space-y-2">
              {blocks.map((block, index) => (
                <Reorder.Item key={block.id} value={block}>
                  <motion.div
                    className={`group relative p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedBlock === block.id
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-secondary/30 hover:bg-secondary/50'
                    } ${!block.visible ? 'opacity-50' : ''}`}
                    onClick={() => setSelectedBlock(block.id)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Drag Handle */}
                      <div className="cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </div>

                      {/* Block Icon */}
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {(() => {
                          const template = blockTemplates.find(t => t.id === block.type);
                          return template ? <template.icon className="w-5 h-5 text-primary" /> : null;
                        })()}
                      </div>

                      {/* Block Info */}
                      <div className="flex-1">
                        <p className="font-medium">
                          {blockTemplates.find(t => t.id === block.type)?.label}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {block.content?.heading || block.content?.title || 'Sin título'}
                        </p>
                      </div>

                      {/* Visibility Toggle */}
                      <Switch
                        checked={block.visible}
                        onCheckedChange={(checked) => updateBlock(block.id, { visible: checked })}
                        onClick={(e) => e.stopPropagation()}
                      />

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }}
                          disabled={index === 0}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }}
                          disabled={index === blocks.length - 1}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </Reorder.Item>
              ))}
            </Reorder.Group>

            {blocks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Layout className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay bloques. Agrega uno para comenzar.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Properties Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Propiedades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="block">
              <TabsList className="w-full">
                <TabsTrigger value="block" className="flex-1">Bloque</TabsTrigger>
                <TabsTrigger value="page" className="flex-1">Página</TabsTrigger>
              </TabsList>

              <TabsContent value="block" className="space-y-4 mt-4">
                {selectedBlockData ? (
                  <>
                    {/* Dynamic content editor based on block type */}
                    {selectedBlockData.type === 'hero' && (
                      <>
                        <div className="space-y-2">
                          <Label>Título</Label>
                          <Input
                            value={selectedBlockData.content.title}
                            onChange={(e) => updateBlock(selectedBlockData.id, {
                              content: { ...selectedBlockData.content, title: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Subtítulo</Label>
                          <Input
                            value={selectedBlockData.content.subtitle}
                            onChange={(e) => updateBlock(selectedBlockData.id, {
                              content: { ...selectedBlockData.content, subtitle: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Texto del Botón</Label>
                          <Input
                            value={selectedBlockData.content.buttonText}
                            onChange={(e) => updateBlock(selectedBlockData.id, {
                              content: { ...selectedBlockData.content, buttonText: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Enlace del Botón</Label>
                          <Input
                            value={selectedBlockData.content.buttonLink}
                            onChange={(e) => updateBlock(selectedBlockData.id, {
                              content: { ...selectedBlockData.content, buttonLink: e.target.value }
                            })}
                          />
                        </div>
                      </>
                    )}

                    {selectedBlockData.type === 'text' && (
                      <>
                        <div className="space-y-2">
                          <Label>Encabezado</Label>
                          <Input
                            value={selectedBlockData.content.heading}
                            onChange={(e) => updateBlock(selectedBlockData.id, {
                              content: { ...selectedBlockData.content, heading: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Contenido</Label>
                          <Textarea
                            value={selectedBlockData.content.content}
                            onChange={(e) => updateBlock(selectedBlockData.id, {
                              content: { ...selectedBlockData.content, content: e.target.value }
                            })}
                            rows={6}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Alineación</Label>
                          <div className="flex gap-1">
                            {(['left', 'center', 'right'] as const).map((align) => (
                              <Button
                                key={align}
                                variant={selectedBlockData.content.alignment === align ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateBlock(selectedBlockData.id, {
                                  content: { ...selectedBlockData.content, alignment: align }
                                })}
                              >
                                {align === 'left' && <AlignLeft className="w-4 h-4" />}
                                {align === 'center' && <AlignCenter className="w-4 h-4" />}
                                {align === 'right' && <AlignRight className="w-4 h-4" />}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Generic heading for other blocks */}
                    {!['hero', 'text'].includes(selectedBlockData.type) && selectedBlockData.content.heading && (
                      <div className="space-y-2">
                        <Label>Título de la Sección</Label>
                        <Input
                          value={selectedBlockData.content.heading}
                          onChange={(e) => updateBlock(selectedBlockData.id, {
                            content: { ...selectedBlockData.content, heading: e.target.value }
                          })}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Selecciona un bloque para editar sus propiedades
                  </p>
                )}
              </TabsContent>

              <TabsContent value="page" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Título de la Página</Label>
                  <Input
                    value={settings.title}
                    onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={settings.description}
                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color Primario</Label>
                  <Input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="h-10 cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fuente</Label>
                  <Select
                    value={settings.fontFamily}
                    onValueChange={(v) => setSettings({ ...settings, fontFamily: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Add Block Dialog */}
      <Dialog open={showAddBlock} onOpenChange={setShowAddBlock}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Bloque</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 py-4">
            {blockTemplates.map((template) => (
              <motion.button
                key={template.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                onClick={() => addBlock(template.id as PageBlock['type'])}
              >
                <template.icon className="w-8 h-8 text-primary mb-2" />
                <p className="font-medium">{template.label}</p>
                <p className="text-xs text-muted-foreground">{template.description}</p>
              </motion.button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Vista Previa</DialogTitle>
          </DialogHeader>
          <div 
            className={`bg-white rounded-lg overflow-hidden mx-auto ${
              previewMode === 'mobile' ? 'w-[375px]' : 
              previewMode === 'tablet' ? 'w-[768px]' : 'w-full'
            }`}
            style={{ height: 'calc(90vh - 120px)' }}
          >
            <iframe
              srcDoc={generatePreviewHTML()}
              className="w-full h-full border-0"
              title="Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
