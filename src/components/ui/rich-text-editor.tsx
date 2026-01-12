import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Minus,
  Upload,
  Loader2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const MenuButton = ({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "h-8 w-8 p-0",
      isActive && "bg-muted text-primary"
    )}
  >
    {children}
  </Button>
);

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const addLink = () => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
      setLinkUrl("");
    }
  };

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `blog/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("blog-images")
        .getPublicUrl(filePath);

      editor.chain().focus().setImage({ src: publicUrl }).run();
      toast.success("Imagen subida correctamente");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error al subir la imagen");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30 rounded-t-lg">
      {/* History */}
      <MenuButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Deshacer"
      >
        <Undo className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Rehacer"
      >
        <Redo className="h-4 w-4" />
      </MenuButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Headings */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        title="Título 1"
      >
        <Heading1 className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title="Título 2"
      >
        <Heading2 className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        title="Título 3"
      >
        <Heading3 className="h-4 w-4" />
      </MenuButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Text formatting */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Negrita"
      >
        <Bold className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Cursiva"
      >
        <Italic className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="Subrayado"
      >
        <UnderlineIcon className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Tachado"
      >
        <Strikethrough className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="Código"
      >
        <Code className="h-4 w-4" />
      </MenuButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Alignment */}
      <MenuButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        isActive={editor.isActive({ textAlign: "left" })}
        title="Alinear izquierda"
      >
        <AlignLeft className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        isActive={editor.isActive({ textAlign: "center" })}
        title="Centrar"
      >
        <AlignCenter className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        isActive={editor.isActive({ textAlign: "right" })}
        title="Alinear derecha"
      >
        <AlignRight className="h-4 w-4" />
      </MenuButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Lists */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Lista"
      >
        <List className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Lista numerada"
      >
        <ListOrdered className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Cita"
      >
        <Quote className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Línea horizontal"
      >
        <Minus className="h-4 w-4" />
      </MenuButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Link */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", editor.isActive("link") && "bg-muted text-primary")}
            title="Enlace"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="flex gap-2">
            <Input
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addLink()}
            />
            <Button size="sm" onClick={addLink}>
              Añadir
            </Button>
          </div>
          {editor.isActive("link") && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => editor.chain().focus().unsetLink().run()}
            >
              Quitar enlace
            </Button>
          )}
        </PopoverContent>
      </Popover>

      {/* Image */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Imagen"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="URL de la imagen..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addImage()}
              />
              <Button size="sm" onClick={addImage}>
                Añadir
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-popover px-2 text-muted-foreground">o</span>
              </div>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir imagen
                  </>
                )}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export const RichTextEditor = ({
  content,
  onChange,
  placeholder = "Escribe aquí...",
  className,
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg my-4",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none p-4 min-h-[200px] focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};
