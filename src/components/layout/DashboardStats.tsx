import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  color?: "primary" | "success" | "warning" | "danger" | "info" | "purple";
  delay?: number;
}

const colorVariants = {
  primary: {
    bg: "bg-primary/10",
    border: "border-primary/20",
    icon: "text-primary",
    trend: "text-primary"
  },
  success: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: "text-emerald-500",
    trend: "text-emerald-500"
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: "text-amber-500",
    trend: "text-amber-500"
  },
  danger: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: "text-red-500",
    trend: "text-red-500"
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: "text-blue-500",
    trend: "text-blue-500"
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    icon: "text-purple-500",
    trend: "text-purple-500"
  }
};

export const StatCard = ({
  label,
  value,
  icon: Icon,
  trend,
  color = "primary",
  delay = 0
}: StatCardProps) => {
  const colors = colorVariants[color];
  
  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
      ? TrendingDown
      : Minus
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-xl border p-5 transition-all hover:shadow-md",
        colors.bg,
        colors.border
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {trend && TrendIcon && (
            <div className="flex items-center gap-1">
              <TrendIcon className={cn("h-4 w-4", 
                trend.value > 0 ? "text-emerald-500" : 
                trend.value < 0 ? "text-red-500" : "text-muted-foreground"
              )} />
              <span className={cn("text-xs font-medium",
                trend.value > 0 ? "text-emerald-500" : 
                trend.value < 0 ? "text-red-500" : "text-muted-foreground"
              )}>
                {Math.abs(trend.value)}% {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={cn("rounded-xl p-3", colors.bg)}>
          <Icon className={cn("h-6 w-6", colors.icon)} />
        </div>
      </div>
      
      {/* Decorative gradient */}
      <div className={cn(
        "absolute -bottom-4 -right-4 h-24 w-24 rounded-full opacity-20 blur-2xl",
        colors.bg.replace("/10", "")
      )} />
    </motion.div>
  );
};

interface StatsGridProps {
  stats: StatCardProps[];
  columns?: 2 | 3 | 4;
}

export const StatsGrid = ({ stats, columns = 4 }: StatsGridProps) => {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns])}>
      {stats.map((stat, index) => (
        <StatCard key={stat.label} {...stat} delay={index * 0.1} />
      ))}
    </div>
  );
};
