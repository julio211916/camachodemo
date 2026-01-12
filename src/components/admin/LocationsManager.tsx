import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, MapPin, Phone, GripVertical, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/ContentCard";

interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  city: string | null;
  state: string | null;
  map_url: string | null;
  directions_url: string | null;
  is_active: boolean;
  display_order: number;
}

export const LocationsManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    city: "",
    state: "",
    map_url: "",
    directions_url: "",
    is_active: true,
  });

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["admin-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Location[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<Location, "id" | "display_order">) => {
      const maxOrder = locations.length > 0 ? Math.max(...locations.map(l => l.display_order)) + 1 : 1;
      const { error } = await supabase.from("locations").insert({
        ...data,
        display_order: maxOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-locations"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Sucursal creada");
      resetForm();
    },
    onError: () => toast.error("Error al crear sucursal"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Location> }) => {
      const { error } = await supabase.from("locations").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-locations"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Sucursal actualizada");
      resetForm();
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("locations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-locations"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Sucursal eliminada");
    },
    onError: () => toast.error("Error al eliminar"),
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      for (const update of updates) {
        await supabase.from("locations").update({ display_order: update.display_order }).eq("id", update.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-locations"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", address: "", phone: "", city: "", state: "", map_url: "", directions_url: "", is_active: true });
    setEditingLocation(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLocation) {
      updateMutation.mutate({ id: editingLocation.id, data: formData });
    } else {
      createMutation.mutate(formData as any);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      phone: location.phone,
      city: location.city || "",
      state: location.state || "",
      map_url: location.map_url || "",
      directions_url: location.directions_url || "",
      is_active: location.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDragStart = (id: string) => setDraggedItem(id);
  const handleDragEnd = () => setDraggedItem(null);

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = locations.findIndex(l => l.id === draggedItem);
    const targetIndex = locations.findIndex(l => l.id === targetId);
    
    const newLocations = [...locations];
    const [removed] = newLocations.splice(draggedIndex, 1);
    newLocations.splice(targetIndex, 0, removed);

    const updates = newLocations.map((loc, idx) => ({ id: loc.id, display_order: idx + 1 }));
    reorderMutation.mutate(updates);
  };

  const toggleActive = (location: Location) => {
    updateMutation.mutate({ id: location.id, data: { is_active: !location.is_active } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Gestión de Sucursales" subtitle="Administra las ubicaciones de NovellDent" />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Sucursal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLocation ? "Editar Sucursal" : "Nueva Sucursal"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="NovellDent Centro"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="311-123-4567"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dirección *</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Av. México 123, Col. Centro"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Tepic"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Nayarit"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>URL del Mapa (embed)</Label>
                <Input
                  value={formData.map_url}
                  onChange={(e) => setFormData({ ...formData, map_url: e.target.value })}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                />
              </div>
              <div className="space-y-2">
                <Label>URL de Direcciones</Label>
                <Input
                  value={formData.directions_url}
                  onChange={(e) => setFormData({ ...formData, directions_url: e.target.value })}
                  placeholder="https://maps.google.com/?q=..."
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Activa (visible en el sitio)</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingLocation ? "Actualizar" : "Crear"}
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
          {locations.map((location) => (
            <Card
              key={location.id}
              draggable
              onDragStart={() => handleDragStart(location.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, location.id)}
              className={`transition-all ${draggedItem === location.id ? "opacity-50 scale-95" : ""} ${!location.is_active ? "opacity-60" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{location.name}</h3>
                      {!location.is_active && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">Inactiva</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {location.address}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {location.phone}
                      </span>
                      {location.city && location.state && (
                        <span>{location.city}, {location.state}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={location.is_active}
                      onCheckedChange={() => toggleActive(location)}
                    />
                    {location.directions_url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={location.directions_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(location)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(location.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {locations.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No hay sucursales. Crea la primera.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
