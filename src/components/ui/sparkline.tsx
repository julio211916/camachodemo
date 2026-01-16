import React from 'react';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  className?: string;
  color?: string;
  height?: number;
  showArea?: boolean;
  animate?: boolean;
}

export function Sparkline({ 
  data, 
  className,
  color = 'hsl(var(--primary))',
  height = 24,
  showArea = true,
  animate = true
}: SparklineProps) {
  if (!data || data.length === 0) {
    return <div className={cn("bg-muted/30 rounded", className)} style={{ height }} />;
  }

  const width = 100;
  const padding = 2;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y };
  });
  
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  
  const areaPath = `${linePath} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

  // Calculate trend
  const trend = data.length >= 2 ? data[data.length - 1] - data[0] : 0;
  const trendColor = trend >= 0 ? 'hsl(142 76% 36%)' : 'hsl(0 84% 60%)';
  const finalColor = color === 'auto' ? trendColor : color;

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className={cn("w-full", className)}
      style={{ height }}
      preserveAspectRatio="none"
    >
      {showArea && (
        <path
          d={areaPath}
          fill={finalColor}
          fillOpacity={0.1}
          className={animate ? "animate-in fade-in duration-500" : ""}
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={finalColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? "animate-in slide-in-from-left duration-700" : ""}
      />
      {/* Last point indicator */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={2}
          fill={finalColor}
          className={animate ? "animate-pulse" : ""}
        />
      )}
    </svg>
  );
}

export function SparklineWithLabel({
  data,
  label,
  value,
  trend,
  className,
  color = 'auto'
}: {
  data: number[];
  label: string;
  value: string;
  trend?: number;
  className?: string;
  color?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        {trend !== undefined && (
          <span className={cn(
            "text-[10px] font-medium",
            trend >= 0 ? "text-green-500" : "text-red-500"
          )}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(0)}%
          </span>
        )}
      </div>
      <Sparkline data={data} height={20} color={color} />
      <p className="text-xs font-semibold">{value}</p>
    </div>
  );
}

export default Sparkline;
