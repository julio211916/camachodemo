import { useState, useEffect } from "react";
import { NewHeader } from "@/components/NewHeader";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { OrderStatusBadge, PaymentStatusBadge, PaymentMethodBadge } from "@/components/ecommerce/OrderStatusBadge";
import { 
  Search, 
  Package, 
  Clock, 
  MapPin, 
  ChevronDown, 
  ChevronUp,
  Truck,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_type: string;
  total: number;
  created_at: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  shipping_city: string;
  items?: any[];
  status_history?: any[];
}

const MisPedidos = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const searchOrders = async () => {
    if (!searchQuery && !searchEmail) return;
    
    setLoading(true);
    setSearched(true);
    
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (searchQuery) {
      query = query.eq("order_number", searchQuery.toUpperCase());
    } else if (searchEmail) {
      query = query.eq("customer_email", searchEmail.toLowerCase());
    }

    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching orders:", error);
    } else {
      // Fetch order items for each order
      const ordersWithItems = await Promise.all((data || []).map(async (order) => {
        const { data: items } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", order.id);
        
        const { data: history } = await supabase
          .from("order_status_history")
          .select("*")
          .eq("order_id", order.id)
          .order("created_at", { ascending: true });

        return { ...order, items: items || [], status_history: history || [] };
      }));
      
      setOrders(ordersWithItems);
    }
    
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-5 h-5" />;
      case "confirmed": return <CheckCircle2 className="w-5 h-5" />;
      case "shipped": return <Truck className="w-5 h-5" />;
      case "delivered": return <Package className="w-5 h-5" />;
      case "cancelled": return <XCircle className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1f1a] text-white">
      <NewHeader />
      
      <main className="container mx-auto px-4 py-28">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Rastrear Pedido</h1>
            <p className="text-gray-400">
              Ingresa tu número de pedido o email para ver el estado de tu orden
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8"
          >
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Número de Pedido</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Ej: PC2601-ABC123"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchEmail("");
                    }}
                    className="pl-10 bg-white/5 border-white/10 uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">O buscar por Email</label>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={searchEmail}
                  onChange={(e) => {
                    setSearchEmail(e.target.value);
                    setSearchQuery("");
                  }}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            <Button 
              onClick={searchOrders} 
              disabled={loading || (!searchQuery && !searchEmail)}
              className="w-full"
            >
              {loading ? "Buscando..." : "Buscar Pedido"}
            </Button>
          </motion.div>

          {/* Results */}
          {searched && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 bg-white/5 rounded-2xl border border-white/10"
                >
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <h3 className="text-lg font-medium mb-2">No se encontraron pedidos</h3>
                  <p className="text-gray-400 text-sm">
                    Verifica el número de pedido o email e intenta de nuevo
                  </p>
                </motion.div>
              ) : (
                orders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
                  >
                    {/* Order Header */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-lg">{order.order_number}</p>
                          <p className="text-sm text-gray-400">
                            {format(new Date(order.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary text-xl">${order.total.toFixed(2)}</p>
                          {expandedOrder === order.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400 ml-auto" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 ml-auto" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <OrderStatusBadge status={order.status || "pending"} />
                        <PaymentStatusBadge status={order.payment_status || "pending"} />
                        <PaymentMethodBadge method={order.payment_type || "efectivo"} />
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedOrder === order.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="border-t border-white/10"
                      >
                        {/* Status Timeline */}
                        {order.status_history && order.status_history.length > 0 && (
                          <div className="p-4 border-b border-white/10">
                            <h4 className="font-medium mb-3">Historial de Estado</h4>
                            <div className="space-y-3">
                              {order.status_history.map((history: any, i: number) => (
                                <div key={i} className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    {getStatusIcon(history.status)}
                                  </div>
                                  <div>
                                    <p className="font-medium capitalize">{history.status}</p>
                                    <p className="text-xs text-gray-400">
                                      {format(new Date(history.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                                    </p>
                                    {history.notes && (
                                      <p className="text-sm text-gray-300 mt-1">{history.notes}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Order Items */}
                        <div className="p-4 border-b border-white/10">
                          <h4 className="font-medium mb-3">Productos ({order.items?.length || 0})</h4>
                          <div className="space-y-2">
                            {order.items?.map((item: any) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-300">
                                  {item.product_name} x{item.quantity}
                                </span>
                                <span>${item.total.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Shipping Info */}
                        <div className="p-4">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            Dirección de Envío
                          </h4>
                          <p className="text-sm text-gray-300">
                            {order.customer_name}<br />
                            {order.shipping_address}<br />
                            {order.shipping_city}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MisPedidos;
