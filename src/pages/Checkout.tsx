import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NewHeader } from "@/components/NewHeader";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion } from "framer-motion";
import { 
  ShoppingBag, 
  CreditCard, 
  Banknote, 
  Building2, 
  Truck,
  MapPin,
  User,
  Mail,
  Phone,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart, cartId } = useCart();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    shipping_address: "",
    shipping_city: "",
    shipping_state: "",
    shipping_postal_code: "",
    notes: "",
  });

  const shippingCost = subtotal >= 500 ? 0 : 99;
  const total = subtotal + shippingCost;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateOrderNumber = () => {
    const date = new Date();
    const prefix = "PC";
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `${prefix}${year}${month}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error("Tu carrito está vacío");
      return;
    }

    setLoading(true);
    
    try {
      const orderNumber = generateOrderNumber();
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          shipping_address: formData.shipping_address,
          shipping_city: formData.shipping_city,
          shipping_state: formData.shipping_state,
          shipping_postal_code: formData.shipping_postal_code,
          notes: formData.notes,
          subtotal,
          shipping_cost: shippingCost,
          total,
          payment_type: paymentMethod,
          payment_status: paymentMethod === "credito" ? "pending" : "pending",
          status: "pending",
        })
        .select("id")
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product?.name || "Producto",
        product_sku: item.product?.sku || "",
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.unit_price * item.quantity,
        total: item.unit_price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Add to order status history
      await supabase.from("order_status_history").insert({
        order_id: order.id,
        status: "pending",
        notes: "Pedido creado",
      });

      // Update cart status
      if (cartId) {
        await supabase
          .from("carts")
          .update({ status: "completed" })
          .eq("id", cartId);
      }

      await clearCart();
      setStep(3);
      toast.success("¡Pedido creado exitosamente!");

    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Error al crear el pedido");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen bg-[#1a1f1a] text-white">
        <NewHeader />
        <div className="container mx-auto px-4 py-32 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h1 className="text-2xl font-bold mb-4">Tu carrito está vacío</h1>
          <Button onClick={() => navigate("/productos")}>Ver Productos</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1f1a] text-white">
      <NewHeader />
      
      <main className="container mx-auto px-4 py-28">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[
            { num: 1, label: "Datos de Envío" },
            { num: 2, label: "Método de Pago" },
            { num: 3, label: "Confirmación" },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`flex items-center gap-2 ${step >= s.num ? "text-primary" : "text-gray-500"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step >= s.num ? "border-primary bg-primary text-white" : "border-gray-500"
                }`}>
                  {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                </div>
                <span className="hidden sm:inline text-sm">{s.label}</span>
              </div>
              {i < 2 && <div className={`w-12 h-0.5 mx-2 ${step > s.num ? "bg-primary" : "bg-gray-600"}`} />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 rounded-2xl p-6 border border-white/10"
              >
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Datos de Envío
                </h2>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name">Nombre Completo *</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="customer_name"
                        name="customer_name"
                        value={formData.customer_name}
                        onChange={handleInputChange}
                        required
                        className="pl-10 bg-white/5 border-white/10"
                        placeholder="Juan Pérez"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="customer_email">Email *</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="customer_email"
                        name="customer_email"
                        type="email"
                        value={formData.customer_email}
                        onChange={handleInputChange}
                        required
                        className="pl-10 bg-white/5 border-white/10"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="customer_phone">Teléfono *</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="customer_phone"
                        name="customer_phone"
                        value={formData.customer_phone}
                        onChange={handleInputChange}
                        required
                        className="pl-10 bg-white/5 border-white/10"
                        placeholder="55 1234 5678"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="shipping_postal_code">Código Postal *</Label>
                    <Input
                      id="shipping_postal_code"
                      name="shipping_postal_code"
                      value={formData.shipping_postal_code}
                      onChange={handleInputChange}
                      required
                      className="mt-1 bg-white/5 border-white/10"
                      placeholder="12345"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <Label htmlFor="shipping_address">Dirección *</Label>
                    <Input
                      id="shipping_address"
                      name="shipping_address"
                      value={formData.shipping_address}
                      onChange={handleInputChange}
                      required
                      className="mt-1 bg-white/5 border-white/10"
                      placeholder="Calle, número, colonia"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="shipping_city">Ciudad *</Label>
                    <Input
                      id="shipping_city"
                      name="shipping_city"
                      value={formData.shipping_city}
                      onChange={handleInputChange}
                      required
                      className="mt-1 bg-white/5 border-white/10"
                      placeholder="Ciudad de México"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="shipping_state">Estado *</Label>
                    <Input
                      id="shipping_state"
                      name="shipping_state"
                      value={formData.shipping_state}
                      onChange={handleInputChange}
                      required
                      className="mt-1 bg-white/5 border-white/10"
                      placeholder="Estado de México"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <Label htmlFor="notes">Notas adicionales</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="mt-1 bg-white/5 border-white/10"
                      placeholder="Instrucciones especiales de entrega..."
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button 
                    onClick={() => setStep(2)}
                    disabled={!formData.customer_name || !formData.customer_email || !formData.shipping_address}
                  >
                    Continuar al Pago
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.form
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleSubmit}
                className="bg-white/5 rounded-2xl p-6 border border-white/10"
              >
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Método de Pago
                </h2>
                
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === "efectivo" ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/20"
                  }`}>
                    <RadioGroupItem value="efectivo" id="efectivo" />
                    <Banknote className="w-6 h-6 text-green-400" />
                    <div>
                      <p className="font-medium">Efectivo contra entrega</p>
                      <p className="text-sm text-gray-400">Paga al recibir tu pedido</p>
                    </div>
                  </label>
                  
                  <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === "transferencia" ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/20"
                  }`}>
                    <RadioGroupItem value="transferencia" id="transferencia" />
                    <Building2 className="w-6 h-6 text-blue-400" />
                    <div>
                      <p className="font-medium">Transferencia bancaria</p>
                      <p className="text-sm text-gray-400">Recibirás los datos por email</p>
                    </div>
                  </label>
                  
                  <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === "credito" ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/20"
                  }`}>
                    <RadioGroupItem value="credito" id="credito" />
                    <CreditCard className="w-6 h-6 text-purple-400" />
                    <div>
                      <p className="font-medium">Crédito (solo distribuidores)</p>
                      <p className="text-sm text-gray-400">Requiere cuenta de distribuidor aprobada</p>
                    </div>
                  </label>
                </RadioGroup>
                
                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Procesando..." : "Confirmar Pedido"}
                  </Button>
                </div>
              </motion.form>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center"
              >
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold mb-4">¡Pedido Confirmado!</h2>
                <p className="text-gray-400 mb-6">
                  Recibirás un email con los detalles de tu pedido y las instrucciones de pago.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={() => navigate("/productos")}>
                    Seguir Comprando
                  </Button>
                  <Button onClick={() => navigate("/")}>
                    Ir al Inicio
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 sticky top-24">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Resumen del Pedido
              </h3>
              
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex-shrink-0 flex items-center justify-center">
                      {item.product?.images?.[0] ? (
                        <img src={item.product.images[0]} alt="" className="w-full h-full object-contain p-1" />
                      ) : (
                        <ShoppingBag className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-1">{item.product?.name}</p>
                      <p className="text-xs text-gray-400">x{item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">
                      ${(item.unit_price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Truck className="w-4 h-4" /> Envío
                  </span>
                  <span>{shippingCost === 0 ? "Gratis" : `$${shippingCost.toFixed(2)}`}</span>
                </div>
                {shippingCost === 0 && (
                  <p className="text-xs text-green-400">🎉 Envío gratis en compras mayores a $500</p>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                  <span>Total</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
