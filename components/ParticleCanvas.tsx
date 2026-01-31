"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: "circle" | "rect" | "star" | "heart";
  gravity: number;
  life: number;
  maxLife: number;
}

const COLORS = [
  "#FFD700", "#FFA500", "#FF69B4", "#FF1493",
  "#E8B4B8", "#D4A574", "#FFB6C1", "#FFDAB9",
  "#F0E68C", "#DDA0DD", "#FF6347", "#FFF8DC",
  "#FFE4E1", "#FFFACD", "#E6E6FA",
];

function createBurst(
  canvas: HTMLCanvasElement,
  particles: Particle[],
  originX?: number,
  originY?: number
) {
  const cx = originX ?? canvas.width * (0.2 + Math.random() * 0.6);
  const cy = originY ?? canvas.height * (0.3 + Math.random() * 0.4);
  const count = 40 + Math.floor(Math.random() * 40);

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 3 + Math.random() * 8;
    const shapes: Particle["shape"][] = ["circle", "rect", "star", "heart"];

    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      size: 3 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      opacity: 1,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      gravity: 0.12 + Math.random() * 0.08,
      life: 0,
      maxLife: 80 + Math.random() * 60,
    });
  }
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  const spikes = 5;
  const outerRadius = size;
  const innerRadius = size * 0.4;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI * i) / spikes - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  const s = size * 0.6;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.4);
  ctx.bezierCurveTo(cx, cy - s * 0.2, cx - s, cy - s * 0.6, cx - s, cy);
  ctx.bezierCurveTo(cx - s, cy + s * 0.6, cx, cy + s, cx, cy + s * 1.2);
  ctx.bezierCurveTo(cx, cy + s, cx + s, cy + s * 0.6, cx + s, cy);
  ctx.bezierCurveTo(cx + s, cy - s * 0.6, cx, cy - s * 0.2, cx, cy + s * 0.4);
  ctx.closePath();
  ctx.fill();
}

export default function ParticleCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const burstTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleBursts = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    const burst = () => {
      if (!active) return;
      createBurst(canvas, particlesRef.current);
      const delay = 400 + Math.random() * 600;
      burstTimerRef.current = setTimeout(burst, delay);
    };

    // Initial bursts - fire 3 immediately
    createBurst(canvas, particlesRef.current);
    setTimeout(() => createBurst(canvas, particlesRef.current), 150);
    setTimeout(() => createBurst(canvas, particlesRef.current), 300);

    burstTimerRef.current = setTimeout(burst, 500);
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    if (active) {
      scheduleBursts();
    }

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.rotation += p.rotationSpeed;

        const lifeRatio = p.life / p.maxLife;
        p.opacity = lifeRatio > 0.7 ? 1 - (lifeRatio - 0.7) / 0.3 : 1;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        switch (p.shape) {
          case "circle":
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
            break;
          case "rect":
            ctx.fillRect(-p.size, -p.size * 0.4, p.size * 2, p.size * 0.8);
            break;
          case "star":
            drawStar(ctx, 0, 0, p.size);
            break;
          case "heart":
            drawHeart(ctx, 0, 0, p.size);
            break;
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameRef.current);
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    };
  }, [active, scheduleBursts]);

  return <canvas ref={canvasRef} className="particle-canvas" />;
}
