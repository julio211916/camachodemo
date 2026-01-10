import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Gift,
  Users,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Loader2,
  DollarSign,
  Calendar,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
  Eye,
  Check,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

interface Referral {
  id: string;
  referrer_email: string;
  referred_email: string;
  referral_code: string;
  status: string;
  discount_percentage: number | null;
  discount_amount: number | null;
  discount_applied_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  appliedDiscounts: number;
  totalDiscountAmount: number;
  conversionRate: number;
  topReferrers: { email: string; count: number }[];
  monthlyTrend: { month: string; count: number; completed: number }[];
}

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];

export const ReferralsManager = () => {
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const referralData = data as Referral[];
      setReferrals(referralData);
      calculateStats(referralData);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los referidos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data: Referral[]) => {
    const pending = data.filter((r) => r.status === "pending");
    const completed = data.filter(
      (r) => r.status === "completed" || r.status === "discount_applied"
    );
    const applied = data.filter((r) => r.status === "discount_applied");

    // Calculate top referrers
    const referrerCounts: Record<string, number> = {};
    data.forEach((r) => {
      referrerCounts[r.referrer_email] =
        (referrerCounts[r.referrer_email] || 0) + 1;
    });
    const topReferrers = Object.entries(referrerCounts)
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate monthly trend (last 6 months)
    const monthlyData: Record<string, { count: number; completed: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(d, "MMM yyyy", { locale: es });
      monthlyData[key] = { count: 0, completed: 0 };
    }

    data.forEach((r) => {
      const d = new Date(r.created_at);
      const key = format(d, "MMM yyyy", { locale: es });
      if (monthlyData[key]) {
        monthlyData[key].count++;
        if (r.status === "completed" || r.status === "discount_applied") {
          monthlyData[key].completed++;
        }
      }
    });

    const monthlyTrend = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
    }));

    setStats({
      totalReferrals: data.length,
      pendingReferrals: pending.length,
      completedReferrals: completed.length,
      appliedDiscounts: applied.length,
      totalDiscountAmount: applied.reduce(
        (acc, r) => acc + (r.discount_amount || 0),
        0
      ),
      conversionRate:
        data.length > 0 ? (completed.length / data.length) * 100 : 0,
      topReferrers,
      monthlyTrend,
    });
  };

  const updateReferralStatus = async (
    referralId: string,
    newStatus: string,
    discountAmount?: number
  ) => {
    setIsUpdating(true);
    try {
      const updateData: any = { status: newStatus };

      if (newStatus === "discount_applied" && discountAmount) {
        updateData.discount_amount = discountAmount;
        updateData.discount_applied_at = new Date().toISOString();
      }

      if (newStatus === "completed") {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("referrals")
        .update(updateData)
        .eq("id", referralId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: "El referido ha sido actualizado correctamente",
      });

      fetchReferrals();
      setSelectedReferral(null);
    } catch (error) {
      console.error("Error updating referral:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el referido",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredReferrals = referrals.filter((r) => {
    const matchesSearch =
      r.referrer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referred_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referral_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completado
          </Badge>
        );
      case "discount_applied":
        return (
          <Badge className="bg-primary/10 text-primary border-primary/30">
            <Sparkles className="w-3 h-3 mr-1" />
            Aplicado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const statusDistribution = [
    { name: "Pendientes", value: stats?.pendingReferrals || 0, color: "#f59e0b" },
    { name: "Completados", value: (stats?.completedReferrals || 0) - (stats?.appliedDiscounts || 0), color: "#22c55e" },
    { name: "Aplicados", value: stats?.appliedDiscounts || 0, color: "#3b82f6" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Gift className="w-7 h-7 text-primary" />
            Gestión de Referidos
          </h2>
          <p className="text-muted-foreground mt-1">
            Administra el programa de referidos y descuentos
          </p>
        </div>
        <Button onClick={fetchReferrals} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold">{stats?.totalReferrals}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-xs text-muted-foreground">Pendientes</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {stats?.pendingReferrals}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-xs text-muted-foreground">Completados</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {stats?.completedReferrals}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-muted-foreground">Aplicados</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {stats?.appliedDiscounts}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-muted-foreground">Descuentos</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                ${stats?.totalDiscountAmount.toFixed(0)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-muted-foreground">Conversión</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">
                {stats?.conversionRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Tendencia Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats?.monthlyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Total"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Completados"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Distribución
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {statusDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Referrers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Top Referidores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stats?.topReferrers.map((referrer, index) => (
              <motion.div
                key={referrer.email}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0
                      ? "bg-yellow-500"
                      : index === 1
                      ? "bg-gray-400"
                      : index === 2
                      ? "bg-amber-600"
                      : "bg-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{referrer.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {referrer.count} referidos
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle className="text-lg">Lista de Referidos</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="completed">Completados</SelectItem>
                  <SelectItem value="discount_applied">Aplicados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Referidor</TableHead>
                  <TableHead>Referido</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredReferrals.map((referral) => (
                    <motion.tr
                      key={referral.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group"
                    >
                      <TableCell className="font-mono text-sm">
                        {referral.referral_code}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{referral.referrer_email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{referral.referred_email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(referral.status)}</TableCell>
                      <TableCell>
                        {referral.discount_amount ? (
                          <span className="text-green-600 font-medium">
                            ${referral.discount_amount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {referral.discount_percentage || 5}%
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(referral.created_at), "dd/MM/yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedReferral(referral)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {referral.status === "pending" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700"
                              onClick={() =>
                                updateReferralStatus(referral.id, "completed")
                              }
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          {referral.status === "completed" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-primary"
                              onClick={() =>
                                updateReferralStatus(referral.id, "discount_applied", 50)
                              }
                            >
                              <Sparkles className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>

          {filteredReferrals.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No se encontraron referidos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedReferral}
        onOpenChange={() => setSelectedReferral(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Detalles del Referido
            </DialogTitle>
            <DialogDescription>
              Código: {selectedReferral?.referral_code}
            </DialogDescription>
          </DialogHeader>

          {selectedReferral && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Referidor</p>
                  <p className="text-sm font-medium">
                    {selectedReferral.referrer_email}
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Referido</p>
                  <p className="text-sm font-medium">
                    {selectedReferral.referred_email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Estado</p>
                  {getStatusBadge(selectedReferral.status)}
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Descuento</p>
                  <p className="text-sm font-medium">
                    {selectedReferral.discount_amount
                      ? `$${selectedReferral.discount_amount}`
                      : `${selectedReferral.discount_percentage || 5}%`}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Fechas</p>
                <div className="text-sm space-y-1">
                  <p>
                    Creado:{" "}
                    {format(new Date(selectedReferral.created_at), "PPP", {
                      locale: es,
                    })}
                  </p>
                  {selectedReferral.completed_at && (
                    <p>
                      Completado:{" "}
                      {format(new Date(selectedReferral.completed_at), "PPP", {
                        locale: es,
                      })}
                    </p>
                  )}
                  {selectedReferral.discount_applied_at && (
                    <p>
                      Aplicado:{" "}
                      {format(
                        new Date(selectedReferral.discount_applied_at),
                        "PPP",
                        { locale: es }
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {selectedReferral?.status === "pending" && (
              <Button
                onClick={() =>
                  updateReferralStatus(selectedReferral.id, "completed")
                }
                disabled={isUpdating}
                className="gap-2"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Marcar Completado
              </Button>
            )}
            {selectedReferral?.status === "completed" && (
              <Button
                onClick={() =>
                  updateReferralStatus(selectedReferral.id, "discount_applied", 50)
                }
                disabled={isUpdating}
                className="gap-2"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Aplicar Descuento
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedReferral(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
