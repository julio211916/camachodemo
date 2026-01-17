import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Phone, MapPin, Clock, User, Mail, Building2, Package, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const WholesaleCallSection = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    businessName: "",
    city: "",
    state: "",
    address: "",
    preferredDate: "",
    preferredTime: "",
    productInterest: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create a lead entry for the wholesale inquiry
      const { error } = await supabase.from("leads").insert({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        source: "wholesale_call",
        source_detail: "Formulario de Mayoreo - Landing Page",
        interest: `Interés en: ${formData.productInterest}`,
        notes: `
          Empresa: ${formData.businessName}
          Dirección: ${formData.address}, ${formData.city}, ${formData.state}
          Fecha preferida: ${formData.preferredDate}
          Horario preferido: ${formData.preferredTime}
          Notas adicionales: ${formData.notes}
        `,
        status: "new",
      });

      if (error) throw error;

      toast.success("¡Solicitud enviada!", {
        description: "Nos pondremos en contacto contigo pronto para agendar tu llamada.",
      });

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        businessName: "",
        city: "",
        state: "",
        address: "",
        preferredDate: "",
        preferredTime: "",
        productInterest: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Error al enviar", {
        description: "Hubo un problema. Por favor intenta de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <section id="mayoreo" className="py-20 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
                <Package className="h-4 w-4" />
                Venta por Mayoreo
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                ¿Te interesaría comprar<br />
                <span className="text-primary">por mayoreo?</span>
              </h2>
            </div>

            <p className="text-lg text-muted-foreground max-w-md">
              Déjanos tus datos y dirección. Agenda una llamada con nuestro equipo de ventas 
              para conocer nuestros precios especiales y beneficios para distribuidores.
            </p>

            {/* Benefits */}
            <div className="space-y-4">
              {[
                "Precios especiales para distribuidores",
                "Envío a toda la República Mexicana",
                "Asesoría personalizada",
                "Amplio catálogo de productos naturales",
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </motion.div>
              ))}
            </div>

            {/* Contact Info */}
            <div className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">O contáctanos directamente:</p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="tel:+525558357715"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">55 5835 7715</span>
                </a>
                <a
                  href="https://wa.me/525558357715"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(142,70%,45%)] text-white hover:bg-[hsl(142,70%,40%)] transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span className="text-sm font-medium">WhatsApp</span>
                </a>
              </div>
            </div>
          </motion.div>

          {/* Right - Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <form
              onSubmit={handleSubmit}
              className="bg-card rounded-2xl shadow-xl border border-border p-8 space-y-6"
            >
              <div className="text-center mb-6">
                <Calendar className="h-10 w-10 mx-auto text-primary mb-3" />
                <h3 className="text-2xl font-bold text-foreground">Agenda una Llamada</h3>
                <p className="text-muted-foreground text-sm">Completa el formulario y te contactaremos</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Nombre completo *
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Nombre del negocio
                  </Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="Tu empresa"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Correo electrónico *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Teléfono *
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="55 1234 5678"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Dirección completa
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Calle, número, colonia"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Tu ciudad"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Tu estado"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferredDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Fecha preferida *
                  </Label>
                  <Input
                    id="preferredDate"
                    name="preferredDate"
                    type="date"
                    value={formData.preferredDate}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredTime" className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Horario preferido *
                  </Label>
                  <Select
                    value={formData.preferredTime}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, preferredTime: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona horario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9:00-11:00">9:00 - 11:00 AM</SelectItem>
                      <SelectItem value="11:00-13:00">11:00 - 1:00 PM</SelectItem>
                      <SelectItem value="13:00-15:00">1:00 - 3:00 PM</SelectItem>
                      <SelectItem value="15:00-17:00">3:00 - 5:00 PM</SelectItem>
                      <SelectItem value="17:00-19:00">5:00 - 7:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productInterest">¿Qué productos te interesan?</Label>
                <Select
                  value={formData.productInterest}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, productInterest: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aceites">Aceites Naturales</SelectItem>
                    <SelectItem value="lociones">Lociones</SelectItem>
                    <SelectItem value="pomadas">Pomadas</SelectItem>
                    <SelectItem value="jarabes">Jarabes</SelectItem>
                    <SelectItem value="quimicos">Productos Químicos</SelectItem>
                    <SelectItem value="todos">Todos los productos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas adicionales</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="¿Algo más que debamos saber?"
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Agendar Llamada
                  </span>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Al enviar este formulario, aceptas nuestros términos y condiciones.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
