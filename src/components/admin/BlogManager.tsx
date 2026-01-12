import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff, Calendar, User } from "lucide-react";
import { PageHeader } from "@/components/layout/ContentCard";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  author_name: string | null;
  is_published: boolean;
  published_at: string | null;
  display_order: number;
  tags: string[] | null;
  created_at: string;
}

export const BlogManager = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image: "",
    tags: [] as string[],
    is_published: false,
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const maxOrder = posts.length > 0 ? Math.max(...posts.map(p => p.display_order)) + 1 : 1;
      const { error } = await supabase.from("blog_posts").insert({
        ...data,
        author_id: user?.id,
        author_name: profile?.full_name || user?.email,
        display_order: maxOrder,
        published_at: data.is_published ? new Date().toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Artículo creado");
      resetForm();
    },
    onError: (error: any) => toast.error(error.message || "Error al crear"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BlogPost> }) => {
      const updateData: any = { ...data };
      if (data.is_published && !editingPost?.published_at) {
        updateData.published_at = new Date().toISOString();
      }
      const { error } = await supabase.from("blog_posts").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Artículo actualizado");
      resetForm();
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Artículo eliminado");
    },
    onError: () => toast.error("Error al eliminar"),
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      for (const update of updates) {
        await supabase.from("blog_posts").update({ display_order: update.display_order }).eq("id", update.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
  });

  const resetForm = () => {
    setFormData({ title: "", slug: "", excerpt: "", content: "", cover_image: "", tags: [], is_published: false });
    setTagsInput("");
    setEditingPost(null);
    setIsDialogOpen(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: editingPost ? formData.slug : generateSlug(title),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: { ...formData, tags } });
    } else {
      createMutation.mutate({ ...formData, tags });
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      cover_image: post.cover_image || "",
      tags: post.tags || [],
      is_published: post.is_published,
    });
    setTagsInput(post.tags?.join(", ") || "");
    setIsDialogOpen(true);
  };

  const handleDragStart = (id: string) => setDraggedItem(id);
  const handleDragEnd = () => setDraggedItem(null);

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = posts.findIndex(p => p.id === draggedItem);
    const targetIndex = posts.findIndex(p => p.id === targetId);
    
    const newPosts = [...posts];
    const [removed] = newPosts.splice(draggedIndex, 1);
    newPosts.splice(targetIndex, 0, removed);

    const updates = newPosts.map((post, idx) => ({ id: post.id, display_order: idx + 1 }));
    reorderMutation.mutate(updates);
  };

  const togglePublish = (post: BlogPost) => {
    updateMutation.mutate({
      id: post.id,
      data: {
        is_published: !post.is_published,
        published_at: !post.is_published ? new Date().toISOString() : post.published_at,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Gestión del Blog" subtitle="Crea y administra artículos del blog" />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Artículo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPost ? "Editar Artículo" : "Nuevo Artículo"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Título del artículo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="titulo-del-articulo"
                />
              </div>
              <div className="space-y-2">
                <Label>Extracto</Label>
                <Textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Breve descripción del artículo..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Contenido *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Contenido completo del artículo..."
                  rows={10}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Imagen de Portada (URL)</Label>
                <Input
                  value={formData.cover_image}
                  onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Tags (separados por coma)</Label>
                <Input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="salud dental, ortodoncia, blanqueamiento"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label>Publicar inmediatamente</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingPost ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card
              key={post.id}
              draggable
              onDragStart={() => handleDragStart(post.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, post.id)}
              className={`transition-all ${draggedItem === post.id ? "opacity-50 scale-95" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab mt-1" />
                  {post.cover_image && (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="w-20 h-14 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{post.title}</h3>
                      <Badge variant={post.is_published ? "default" : "secondary"}>
                        {post.is_published ? "Publicado" : "Borrador"}
                      </Badge>
                    </div>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {post.author_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(post.created_at), "d MMM yyyy", { locale: es })}
                      </span>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex gap-1">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="bg-muted px-1.5 py-0.5 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePublish(post)}
                      title={post.is_published ? "Despublicar" : "Publicar"}
                    >
                      {post.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(post.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {posts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No hay artículos. Crea el primero.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
