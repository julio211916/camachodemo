import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Gift, 
  Percent, 
  CheckCircle2, 
  Clock, 
  Calendar,
  TrendingUp,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ReferralDiscount {
  id: string;
  referred_email: string;
  referral_code: string;
  status: string;
  discount_percentage: number | null;
  discount_amount: number | null;
  discount_applied_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface DiscountStats {
  totalEarned: number;
  totalApplied: number;
  pendingDiscounts: number;
  availableBalance: number;
}

export const DiscountHistory = () => {
  const { user, profile } = useAuth();
  const [discounts, setDiscounts] = useState<ReferralDiscount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DiscountStats>({
    totalEarned: 0,
    totalApplied: 0,
    pendingDiscounts: 0,
    availableBalance: 0,
  });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (profile?.email) {
      fetchDiscountHistory();
    }
  }, [profile?.email]);

  const fetchDiscountHistory = async () => {
    if (!profile?.email) return;

    setIsLoading(true);
    try {
      // Fetch all referrals where user is the referrer
      const { data: referrals, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_email", profile.email)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const discountData = referrals as ReferralDiscount[];
      setDiscounts(discountData);

      // Calculate stats
      const completed = discountData.filter(
        (d) => d.status === "completed" || d.status === "discount_applied"
      );
      const applied = discountData.filter((d) => d.status === "discount_applied");
      const pending = discountData.filter((d) => d.status === "pending");
      const available = discountData.filter((d) => d.status === "completed");

      const totalEarnedAmount = completed.reduce(
        (acc, d) => acc + (d.discount_amount || 0),
        0
      );
      const totalAppliedAmount = applied.reduce(
        (acc, d) => acc + (d.discount_amount || 0),
        0
      );

      setStats({
        totalEarned: completed.length * 5, // 5% per referral
        totalApplied: totalAppliedAmount,
        pendingDiscounts: pending.length,
        availableBalance: available.length * 5, // Available discounts not yet applied
      });
    } catch (error) {
      console.error("Error fetching discount history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Pendiente",
          variant: "outline" as const,
          icon: Clock,
          color: "text-yellow-500",
        };
      case "completed":
        return {
          label: "Disponible",
          variant: "secondary" as const,
          icon: CheckCircle2,
          color: "text-green-500",
        };
      case "discount_applied":
        return {
          label: "Aplicado",
          variant: "default" as const,
          icon: Sparkles,
          color: "text-primary",
        };
      default:
        return {
          label: status,
          variant: "outline" as const,
          icon: Clock,
          color: "text-muted-foreground",
        };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const displayedDiscounts = expanded ? discounts : discounts.slice(0, 5);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b">
        <CardTitle className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Percent className="w-6 h-6 text-green-600" />
          </motion.div>
          <div>
            <h3 className="text-xl font-semibold">Historial de Descuentos</h3>
            <p className="text-sm font-normal text-muted-foreground">
              Descuentos ganados por referidos
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl p-4 border border-green-500/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Total Ganado</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.totalEarned}%</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl p-4 border border-blue-500/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Disponible</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.availableBalance}%</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl p-4 border border-purple-500/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-muted-foreground">Aplicados</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">${stats.totalApplied.toFixed(0)}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-xl p-4 border border-yellow-500/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-muted-foreground">Pendientes</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingDiscounts}</p>
          </motion.div>
        </div>

        {/* Available Discount Banner */}
        {stats.availableBalance > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-xl p-4 border border-primary/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    ¡Tienes {stats.availableBalance}% de descuento disponible!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Se aplicará automáticamente en tu próximo tratamiento
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <Separator />

        {/* Discount List */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            Historial de Referidos
          </h4>

          {discounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aún no tienes descuentos por referidos</p>
              <p className="text-sm mt-1">
                Comparte tu código y gana 5% por cada amigo
              </p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-2">
                {displayedDiscounts.map((discount, index) => {
                  const statusInfo = getStatusInfo(discount.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <motion.div
                      key={discount.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${statusInfo.color}`}
                        >
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{discount.referred_email}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {format(new Date(discount.created_at), "d MMM yyyy", {
                                locale: es,
                              })}
                            </span>
                            {discount.completed_at && (
                              <>
                                <span>•</span>
                                <span>
                                  Completado:{" "}
                                  {format(
                                    new Date(discount.completed_at),
                                    "d MMM yyyy",
                                    { locale: es }
                                  )}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {discount.status !== "pending" && (
                          <span className="font-semibold text-green-600">
                            +{discount.discount_percentage || 5}%
                          </span>
                        )}
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}

          {discounts.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-2"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Ver menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Ver todos ({discounts.length})
                </>
              )}
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="bg-muted/30 rounded-xl p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">💡 Información</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Los descuentos se acumulan y aplican automáticamente</li>
            <li>Cada referido que complete una cita te da 5% de descuento</li>
            <li>Sin límite de referidos ni de descuentos acumulables</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
