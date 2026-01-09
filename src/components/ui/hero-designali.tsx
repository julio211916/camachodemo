"use client";

import { cn } from "@/lib/utils";

let ctx: CanvasRenderingContext2D | null = null;
let f: Oscillator | null = null;
let e = 0;
let pos: { x: number; y: number } = { x: 0, y: 0 };
let lines: Line[] = [];

const E = {
  debug: true,
  friction: 0.5,
  trails: 80,
  size: 50,
  dampening: 0.025,
  tension: 0.99,
};

interface OscillatorConfig {
  phase?: number;
  offset?: number;
  frequency?: number;
  amplitude?: number;
}

class Oscillator {
  phase: number;
  offset: number;
  frequency: number;
  amplitude: number;

  constructor(config: OscillatorConfig = {}) {
    this.phase = config.phase || 0;
    this.offset = config.offset || 0;
    this.frequency = config.frequency || 0.001;
    this.amplitude = config.amplitude || 1;
  }

  update(): number {
    this.phase += this.frequency;
    e = this.offset + Math.sin(this.phase) * this.amplitude;
    return e;
  }

  value(): number {
    return e;
  }
}

class Node {
  x: number = 0;
  y: number = 0;
  vx: number = 0;
  vy: number = 0;
}

interface LineConfig {
  spring: number;
}

class Line {
  spring: number;
  friction: number;
  nodes: Node[];

  constructor(config: LineConfig) {
    this.spring = config.spring + 0.1 * Math.random() - 0.05;
    this.friction = E.friction + 0.01 * Math.random() - 0.005;
    this.nodes = [];
    
    for (let i = 0; i < E.size; i++) {
      const node = new Node();
      node.x = pos.x;
      node.y = pos.y;
      this.nodes.push(node);
    }
  }

  update(): void {
    let spring = this.spring;
    let node = this.nodes[0];
    
    node.vx += (pos.x - node.x) * spring;
    node.vy += (pos.y - node.y) * spring;

    for (let i = 0; i < this.nodes.length; i++) {
      node = this.nodes[i];
      
      if (i > 0) {
        const prev = this.nodes[i - 1];
        node.vx += (prev.x - node.x) * spring;
        node.vy += (prev.y - node.y) * spring;
        node.vx += prev.vx * E.dampening;
        node.vy += prev.vy * E.dampening;
      }

      node.vx *= this.friction;
      node.vy *= this.friction;
      node.x += node.vx;
      node.y += node.vy;
      spring *= E.tension;
    }
  }

  draw(): void {
    if (!ctx) return;
    
    let x = this.nodes[0].x;
    let y = this.nodes[0].y;

    ctx.beginPath();
    ctx.moveTo(x, y);

    for (let i = 1; i < this.nodes.length - 2; i++) {
      const curr = this.nodes[i];
      const next = this.nodes[i + 1];
      x = 0.5 * (curr.x + next.x);
      y = 0.5 * (curr.y + next.y);
      ctx.quadraticCurveTo(curr.x, curr.y, x, y);
    }

    const a = this.nodes[this.nodes.length - 2];
    const b = this.nodes[this.nodes.length - 1];
    ctx.quadraticCurveTo(a.x, a.y, b.x, b.y);
    ctx.stroke();
    ctx.closePath();
  }
}

function initLines(): void {
  lines = [];
  for (let i = 0; i < E.trails; i++) {
    lines.push(new Line({ spring: 0.45 + (i / E.trails) * 0.025 }));
  }
}

function handleMove(event: MouseEvent | TouchEvent): void {
  if ('touches' in event && event.touches) {
    pos.x = event.touches[0].pageX;
    pos.y = event.touches[0].pageY;
  } else if ('clientX' in event) {
    pos.x = event.clientX;
    pos.y = event.clientY;
  }
}

function onMousemove(event: MouseEvent | TouchEvent): void {
  document.removeEventListener("mousemove", onMousemove as EventListener);
  document.removeEventListener("touchstart", onMousemove as EventListener);
  document.addEventListener("mousemove", handleMove as EventListener);
  document.addEventListener("touchmove", handleMove as EventListener);
  document.addEventListener("touchstart", handleMove as EventListener);
  handleMove(event);
  initLines();
  render();
}

function render(): void {
  if (!ctx || !(ctx as any).running) return;

  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `hsla(${Math.round(f?.update() || 0)}, 100%, 50%, 0.025)`;
  ctx.lineWidth = 10;

  for (let i = 0; i < E.trails; i++) {
    lines[i].update();
    lines[i].draw();
  }

  (ctx as any).frame++;
  window.requestAnimationFrame(render);
}

function resizeCanvas(): void {
  if (!ctx) return;
  ctx.canvas.width = window.innerWidth - 20;
  ctx.canvas.height = window.innerHeight;
}

const renderCanvas = function (): void {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  if (!canvas) return;
  
  ctx = canvas.getContext("2d");
  if (!ctx) return;
  
  (ctx as any).running = true;
  (ctx as any).frame = 1;
  
  f = new Oscillator({
    phase: Math.random() * 2 * Math.PI,
    amplitude: 85,
    frequency: 0.0015,
    offset: 285,
  });

  document.addEventListener("mousemove", onMousemove as EventListener);
  document.addEventListener("touchstart", onMousemove as EventListener);
  document.body.addEventListener("orientationchange", resizeCanvas);
  window.addEventListener("resize", resizeCanvas);
  
  window.addEventListener("focus", () => {
    if (ctx && !(ctx as any).running) {
      (ctx as any).running = true;
      render();
    }
  });
  
  window.addEventListener("blur", () => {
    if (ctx) (ctx as any).running = true;
  });
  
  resizeCanvas();
};

import { ReactTyped } from "react-typed";

interface TypeWriterProps {
  strings: string[];
}

const TypeWriter = ({ strings }: TypeWriterProps) => {
  return (
    <ReactTyped
      loop
      typeSpeed={80}
      backSpeed={20}
      strings={strings}
      smartBackspace
      backDelay={1000}
      loopCount={0}
      showCursor
      cursorChar="|"
    />
  );
};

type TColorProp = string | string[];

interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: TColorProp;
  className?: string;
  children: React.ReactNode;
}

function ShineBorder({
  borderRadius = 8,
  borderWidth = 1,
  duration = 14,
  color = "#000000",
  className,
  children,
}: ShineBorderProps) {
  return (
    <div
      style={{
        "--border-radius": `${borderRadius}px`,
        "--border-width": `${borderWidth}px`,
        "--duration": `${duration}s`,
        "--mask-linear-gradient": `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
        "--background-radial-gradient": `radial-gradient(transparent, transparent, ${Array.isArray(color) ? color.join(",") : color}, transparent, transparent)`,
      } as React.CSSProperties}
      className={cn(
        "relative rounded-[--border-radius] p-[--border-width] overflow-hidden",
        className
      )}
    >
      <div
        className="absolute inset-0 animate-[spin_var(--duration)_linear_infinite]"
        style={{
          background: "var(--background-radial-gradient)",
          WebkitMask: "var(--mask-linear-gradient)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      {children}
    </div>
  );
}

export { renderCanvas, TypeWriter, ShineBorder };
