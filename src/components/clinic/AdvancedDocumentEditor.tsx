import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Image,
  Link,
  Table,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Minus,
  Undo,
  Redo,
  Save,
  Download,
  Upload,
  Eye,
  EyeOff,
  Palette,
  Type,
  Plus,
  Trash2,
  GripVertical,
  FileText,
  Copy,
  Scissors,
  ClipboardPaste,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DocumentBlock {
  id: string;
  type: "text" | "heading" | "image" | "list" | "table" | "divider" | "quote" | "code";
  content: string;
  level?: 1 | 2 | 3;
  alignment?: "left" | "center" | "right" | "justify";
  listType?: "bullet" | "number";
  imageUrl?: string;
  tableData?: string[][];
  styles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    fontSize?: string;
    color?: string;
  };
}

interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  blocks: DocumentBlock[];
}

const defaultBlocks: DocumentBlock[] = [
  {
    id: "1",
    type: "heading",
    content: "Título del Documento",
    level: 1,
    alignment: "center"
  },
  {
    id: "2",
    type: "text",
    content: "Escribe tu contenido aquí...",
    alignment: "left"
  }
];

const fontSizes = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px", "48px"];

const colors = [
  "#000000", "#333333", "#666666", "#999999", "#cccccc",
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e"
];

export const AdvancedDocumentEditor = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [blocks, setBlocks] = useState<DocumentBlock[]>(defaultBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [documentName, setDocumentName] = useState("Documento sin título");
  const [history, setHistory] = useState<DocumentBlock[][]>([defaultBlocks]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  const saveToHistory = useCallback((newBlocks: DocumentBlock[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBlocks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBlocks(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBlocks(history[historyIndex + 1]);
    }
  };

  const addBlock = (type: DocumentBlock["type"]) => {
    const newBlock: DocumentBlock = {
      id: Date.now().toString(),
      type,
      content: "",
      alignment: "left",
      level: type === "heading" ? 2 : undefined,
      listType: type === "list" ? "bullet" : undefined,
      tableData: type === "table" ? [["", ""], ["", ""]] : undefined
    };
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (id: string, updates: Partial<DocumentBlock>) => {
    const newBlocks = blocks.map(block =>
      block.id === id ? { ...block, ...updates } : block
    );
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
  };

  const deleteBlock = (id: string) => {
    if (blocks.length <= 1) {
      toast({
        title: "Error",
        description: "El documento debe tener al menos un bloque",
        variant: "destructive"
      });
      return;
    }
    const newBlocks = blocks.filter(block => block.id !== id);
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
    setSelectedBlockId(null);
  };

  const duplicateBlock = (id: string) => {
    const blockIndex = blocks.findIndex(b => b.id === id);
    if (blockIndex === -1) return;
    
    const duplicated = { ...blocks[blockIndex], id: Date.now().toString() };
    const newBlocks = [
      ...blocks.slice(0, blockIndex + 1),
      duplicated,
      ...blocks.slice(blockIndex + 1)
    ];
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedBlockId) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateBlock(selectedBlockId, {
          type: "image",
          imageUrl: event.target?.result as string,
          content: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragDrop = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateBlock(blockId, {
          type: "image",
          imageUrl: event.target?.result as string,
          content: files[0].name
        });
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const exportDocument = () => {
    const content = blocks.map(block => {
      switch (block.type) {
        case "heading":
          return `${"#".repeat(block.level || 1)} ${block.content}`;
        case "text":
          return block.content;
        case "quote":
          return `> ${block.content}`;
        case "code":
          return `\`\`\`\n${block.content}\n\`\`\``;
        case "divider":
          return "---";
        case "image":
          return `![${block.content}](${block.imageUrl})`;
        default:
          return block.content;
      }
    }).join("\n\n");

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentName}.md`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Documento exportado",
      description: "El documento se ha descargado correctamente"
    });
  };

  const renderBlockContent = (block: DocumentBlock) => {
    const isSelected = selectedBlockId === block.id;
    
    switch (block.type) {
      case "heading":
        const headingClass = cn(
          "font-bold outline-none",
          block.level === 1 && "text-3xl",
          block.level === 2 && "text-2xl",
          block.level === 3 && "text-xl",
          block.alignment === "center" && "text-center",
          block.alignment === "right" && "text-right",
          block.styles?.italic && "italic",
          block.styles?.underline && "underline"
        );
        const headingProps = {
          className: headingClass,
          contentEditable: !showPreview,
          suppressContentEditableWarning: true as const,
          onBlur: (e: React.FocusEvent<HTMLElement>) => updateBlock(block.id, { content: e.currentTarget.textContent || "" }),
          children: block.content
        };
        if (block.level === 1) return <h1 {...headingProps} />;
        if (block.level === 3) return <h3 {...headingProps} />;
        return <h2 {...headingProps} />;

      case "text":
        return (
          <p
            className={cn(
              "outline-none min-h-[1.5rem]",
              block.alignment === "center" && "text-center",
              block.alignment === "right" && "text-right",
              block.alignment === "justify" && "text-justify",
              block.styles?.bold && "font-bold",
              block.styles?.italic && "italic",
              block.styles?.underline && "underline"
            )}
            style={{
              fontSize: block.styles?.fontSize,
              color: block.styles?.color
            }}
            contentEditable={!showPreview}
            suppressContentEditableWarning
            onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
          >
            {block.content || (showPreview ? "" : "Escribe aquí...")}
          </p>
        );

      case "image":
        return block.imageUrl ? (
          <div className={cn(
            "relative",
            block.alignment === "center" && "flex justify-center",
            block.alignment === "right" && "flex justify-end"
          )}>
            <img
              src={block.imageUrl}
              alt={block.content}
              className="max-w-full h-auto rounded-lg shadow-md"
            />
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDragDrop(e, block.id)}
          >
            <Image className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Arrastra una imagen o haz clic para subir
            </p>
          </div>
        );

      case "list":
        const listItems = (block.content || "Elemento 1\nElemento 2").split("\n");
        return block.listType === "number" ? (
          <ol className="pl-6 space-y-1 list-decimal">
            {listItems.map((item, i) => (
              <li key={i} className="outline-none">{item}</li>
            ))}
          </ol>
        ) : (
          <ul className="pl-6 space-y-1 list-disc">
            {listItems.map((item, i) => (
              <li key={i} className="outline-none">{item}</li>
            ))}
          </ul>
        );

      case "quote":
        return (
          <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
            <p
              contentEditable={!showPreview}
              suppressContentEditableWarning
              onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
              className="outline-none"
            >
              {block.content || "Cita..."}
            </p>
          </blockquote>
        );

      case "code":
        return (
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
            <code
              contentEditable={!showPreview}
              suppressContentEditableWarning
              onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
              className="outline-none text-sm font-mono"
            >
              {block.content || "// Código aquí"}
            </code>
          </pre>
        );

      case "divider":
        return <hr className="my-4 border-t border-border" />;

      case "table":
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <tbody>
                {(block.tableData || [["", ""], ["", ""]]).map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className="border border-border p-2 outline-none min-w-[100px]"
                        contentEditable={!showPreview}
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const newTableData = [...(block.tableData || [])];
                          newTableData[i][j] = e.currentTarget.textContent || "";
                          updateBlock(block.id, { tableData: newTableData });
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full",
      isFullscreen && "fixed inset-0 z-50 bg-background"
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-card">
        <div className="flex items-center gap-1">
          <Input
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            className="w-48 h-8 font-medium"
          />
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <Button variant="ghost" size="icon" onClick={undo} disabled={historyIndex <= 0}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}>
            <Redo className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          {selectedBlock && selectedBlock.type !== "divider" && selectedBlock.type !== "image" && (
            <>
              <Toggle
                size="sm"
                pressed={selectedBlock?.styles?.bold}
                onPressedChange={(pressed) => 
                  updateBlock(selectedBlockId!, { styles: { ...selectedBlock?.styles, bold: pressed } })
                }
              >
                <Bold className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={selectedBlock?.styles?.italic}
                onPressedChange={(pressed) => 
                  updateBlock(selectedBlockId!, { styles: { ...selectedBlock?.styles, italic: pressed } })
                }
              >
                <Italic className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={selectedBlock?.styles?.underline}
                onPressedChange={(pressed) => 
                  updateBlock(selectedBlockId!, { styles: { ...selectedBlock?.styles, underline: pressed } })
                }
              >
                <Underline className="h-4 w-4" />
              </Toggle>
              
              <Separator orientation="vertical" className="h-6 mx-2" />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateBlock(selectedBlockId!, { alignment: "left" })}
                className={cn(selectedBlock?.alignment === "left" && "bg-accent")}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateBlock(selectedBlockId!, { alignment: "center" })}
                className={cn(selectedBlock?.alignment === "center" && "bg-accent")}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateBlock(selectedBlockId!, { alignment: "right" })}
                className={cn(selectedBlock?.alignment === "right" && "bg-accent")}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateBlock(selectedBlockId!, { alignment: "justify" })}
                className={cn(selectedBlock?.alignment === "justify" && "bg-accent")}
              >
                <AlignJustify className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-2" />

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Type className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-32">
                  <div className="space-y-2">
                    <Label className="text-xs">Tamaño</Label>
                    <Select
                      value={selectedBlock?.styles?.fontSize || "16px"}
                      onValueChange={(value) => 
                        updateBlock(selectedBlockId!, { styles: { ...selectedBlock?.styles, fontSize: value } })
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontSizes.map(size => (
                          <SelectItem key={size} value={size}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Palette className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="space-y-2">
                    <Label className="text-xs">Color de texto</Label>
                    <div className="grid grid-cols-5 gap-1">
                      {colors.map(color => (
                        <button
                          key={color}
                          className={cn(
                            "h-6 w-6 rounded border",
                            selectedBlock?.styles?.color === color && "ring-2 ring-primary"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => 
                            updateBlock(selectedBlockId!, { styles: { ...selectedBlock?.styles, color } })
                          }
                        />
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showPreview ? "Editar" : "Vista previa"}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <Button variant="ghost" size="sm" onClick={exportDocument}>
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
          <Button size="sm">
            <Save className="h-4 w-4 mr-1" />
            Guardar
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Blocks Panel */}
        {!showPreview && (
          <div className="w-48 border-r p-3 bg-muted/30">
            <Label className="text-xs font-medium text-muted-foreground mb-3 block">
              Agregar bloque
            </Label>
            <div className="space-y-1">
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => addBlock("heading")}>
                <Heading1 className="h-4 w-4 mr-2" />
                Título
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => addBlock("text")}>
                <Type className="h-4 w-4 mr-2" />
                Texto
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => addBlock("image")}>
                <Image className="h-4 w-4 mr-2" />
                Imagen
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => addBlock("list")}>
                <List className="h-4 w-4 mr-2" />
                Lista
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => addBlock("table")}>
                <Table className="h-4 w-4 mr-2" />
                Tabla
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => addBlock("quote")}>
                <Quote className="h-4 w-4 mr-2" />
                Cita
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => addBlock("code")}>
                <Code className="h-4 w-4 mr-2" />
                Código
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => addBlock("divider")}>
                <Minus className="h-4 w-4 mr-2" />
                Separador
              </Button>
            </div>
          </div>
        )}

        {/* Editor */}
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto p-8">
            <Reorder.Group
              axis="y"
              values={blocks}
              onReorder={(newOrder) => {
                setBlocks(newOrder);
                saveToHistory(newOrder);
              }}
              className="space-y-4"
            >
              <AnimatePresence>
                {blocks.map((block) => (
                  <Reorder.Item
                    key={block.id}
                    value={block}
                    className={cn(
                      "group relative rounded-lg transition-all",
                      selectedBlockId === block.id && !showPreview && "ring-2 ring-primary/50 bg-primary/5",
                      !showPreview && "hover:bg-muted/30 cursor-pointer"
                    )}
                    onClick={() => !showPreview && setSelectedBlockId(block.id)}
                  >
                    <div className="p-3">
                      {!showPreview && (
                        <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                        </div>
                      )}
                      
                      {renderBlockContent(block)}

                      {!showPreview && selectedBlockId === block.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateBlock(block.id);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBlock(block.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>

            {!showPreview && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-6 p-4 border-2 border-dashed border-muted-foreground/30 rounded-lg text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
                onClick={() => addBlock("text")}
              >
                <Plus className="h-5 w-5" />
                Agregar bloque
              </motion.button>
            )}
          </div>
        </ScrollArea>

        {/* Block Properties Panel */}
        {!showPreview && selectedBlock && (
          <div className="w-56 border-l p-3 bg-muted/30">
            <Label className="text-xs font-medium text-muted-foreground mb-3 block">
              Propiedades del bloque
            </Label>
            
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Tipo</Label>
                <Badge variant="outline" className="mt-1">
                  {selectedBlock.type}
                </Badge>
              </div>

              {selectedBlock.type === "heading" && (
                <div>
                  <Label className="text-xs">Nivel</Label>
                  <Select
                    value={String(selectedBlock.level || 1)}
                    onValueChange={(value) => 
                      updateBlock(selectedBlockId!, { level: parseInt(value) as 1 | 2 | 3 })
                    }
                  >
                    <SelectTrigger className="h-8 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">H1 - Principal</SelectItem>
                      <SelectItem value="2">H2 - Secundario</SelectItem>
                      <SelectItem value="3">H3 - Terciario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedBlock.type === "list" && (
                <div>
                  <Label className="text-xs">Tipo de lista</Label>
                  <Select
                    value={selectedBlock.listType || "bullet"}
                    onValueChange={(value) => 
                      updateBlock(selectedBlockId!, { listType: value as "bullet" | "number" })
                    }
                  >
                    <SelectTrigger className="h-8 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bullet">Viñetas</SelectItem>
                      <SelectItem value="number">Numerada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => duplicateBlock(selectedBlockId!)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => deleteBlock(selectedBlockId!)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};
