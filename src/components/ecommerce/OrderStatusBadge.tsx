import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: {
    label: "Pendiente",
    color: "text-yellow-300",
    bgColor: "bg-yellow-500/20 border-yellow-500/30"
  },
  confirmed: {
    label: "Confirmado",
    color: "text-blue-300",
    bgColor: "bg-blue-500/20 border-blue-500/30"
  },
  processing: {
    label: "En Proceso",
    color: "text-purple-300",
    bgColor: "bg-purple-500/20 border-purple-500/30"
  },
  shipped: {
    label: "Enviado",
    color: "text-cyan-300",
    bgColor: "bg-cyan-500/20 border-cyan-500/30"
  },
  delivered: {
    label: "Entregado",
    color: "text-green-300",
    bgColor: "bg-green-500/20 border-green-500/30"
  },
  cancelled: {
    label: "Cancelado",
    color: "text-red-300",
    bgColor: "bg-red-500/20 border-red-500/30"
  },
  refunded: {
    label: "Reembolsado",
    color: "text-orange-300",
    bgColor: "bg-orange-500/20 border-orange-500/30"
  },
};

const paymentStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: {
    label: "Pago Pendiente",
    color: "text-yellow-300",
    bgColor: "bg-yellow-500/20 border-yellow-500/30"
  },
  partial: {
    label: "Pago Parcial",
    color: "text-orange-300",
    bgColor: "bg-orange-500/20 border-orange-500/30"
  },
  paid: {
    label: "Pagado",
    color: "text-green-300",
    bgColor: "bg-green-500/20 border-green-500/30"
  },
  refunded: {
    label: "Reembolsado",
    color: "text-red-300",
    bgColor: "bg-red-500/20 border-red-500/30"
  },
};

export const OrderStatusBadge = ({ status, size = "md" }: OrderStatusBadgeProps) => {
  const config = statusConfig[status] || {
    label: status,
    color: "text-gray-300",
    bgColor: "bg-gray-500/20 border-gray-500/30"
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5"
  };

  return (
    <span className={cn(
      "inline-flex items-center font-medium rounded-full border",
      config.color,
      config.bgColor,
      sizeClasses[size]
    )}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full mr-1.5",
        config.color.replace("text-", "bg-")
      )} />
      {config.label}
    </span>
  );
};

export const PaymentStatusBadge = ({ status, size = "md" }: OrderStatusBadgeProps) => {
  const config = paymentStatusConfig[status] || {
    label: status,
    color: "text-gray-300",
    bgColor: "bg-gray-500/20 border-gray-500/30"
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5"
  };

  return (
    <span className={cn(
      "inline-flex items-center font-medium rounded-full border",
      config.color,
      config.bgColor,
      sizeClasses[size]
    )}>
      {config.label}
    </span>
  );
};

export const PaymentMethodBadge = ({ method }: { method: string }) => {
  const methodConfig: Record<string, { label: string; icon: string }> = {
    efectivo: { label: "Efectivo", icon: "💵" },
    transferencia: { label: "Transferencia", icon: "🏦" },
    credito: { label: "Crédito", icon: "💳" },
    tarjeta: { label: "Tarjeta", icon: "💳" },
  };

  const config = methodConfig[method] || { label: method, icon: "💰" };

  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-300 bg-white/5 px-2 py-1 rounded">
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
};
