"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface HolographicCardProps {
  src: string;
  alt: string;
  index: number;
}

function generateSparkles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 4,
    duration: 1.5 + Math.random() * 2,
    size: 2 + Math.random() * 4,
  }));
}

export default function HolographicCard({
  src,
  alt,
  index,
}: HolographicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [touching, setTouching] = useState(false);
  const [sparkles] = useState(() => generateSparkles(12));
  const [style, setStyle] = useState({
    transform: "rotateX(0deg) rotateY(0deg)",
    "--shine-x": "50%",
    "--shine-y": "50%",
    "--rainbow-angle": "125deg",
    "--bg-x": "50%",
    "--bg-y": "50%",
    "--glare-angle": "135deg",
  } as React.CSSProperties);

  const resetCard = useCallback(() => {
    setTouching(false);
    setStyle({
      transform: "rotateX(0deg) rotateY(0deg)",
      "--shine-x": "50%",
      "--shine-y": "50%",
      "--rainbow-angle": "125deg",
      "--bg-x": "50%",
      "--bg-y": "50%",
      "--glare-angle": "135deg",
    } as React.CSSProperties);
  }, []);

  const updateCard = useCallback((clientX: number, clientY: number) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = clientX - centerX;
    const mouseY = clientY - centerY;

    const percentX = mouseX / (rect.width / 2);
    const percentY = mouseY / (rect.height / 2);

    const rotateX = -percentY * 15;
    const rotateY = percentX * 15;

    const shineX = ((clientX - rect.left) / rect.width) * 100;
    const shineY = ((clientY - rect.top) / rect.height) * 100;

    const rainbowAngle = Math.atan2(mouseY, mouseX) * (180 / Math.PI) + 180;
    const glareAngle = rainbowAngle + 90;

    const bgX = 50 + percentX * 30;
    const bgY = 50 + percentY * 30;

    setStyle({
      transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`,
      "--shine-x": `${shineX}%`,
      "--shine-y": `${shineY}%`,
      "--rainbow-angle": `${rainbowAngle}deg`,
      "--bg-x": `${bgX}%`,
      "--bg-y": `${bgY}%`,
      "--glare-angle": `${glareAngle}deg`,
    } as React.CSSProperties);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      updateCard(e.clientX, e.clientY);
    },
    [updateCard]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length > 0) {
        updateCard(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    [updateCard]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setTouching(true);
      if (e.touches.length > 0) {
        updateCard(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    [updateCard]
  );

  // Gyroscope support for mobile
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (!touching && cardRef.current) {
        const beta = e.beta ?? 0; // -180 to 180 (front/back tilt)
        const gamma = e.gamma ?? 0; // -90 to 90 (left/right tilt)

        const rotateX = Math.max(-15, Math.min(15, beta * 0.3));
        const rotateY = Math.max(-15, Math.min(15, gamma * 0.3));

        const shineX = 50 + gamma;
        const shineY = 50 + beta * 0.5;

        setStyle({
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          "--shine-x": `${shineX}%`,
          "--shine-y": `${shineY}%`,
          "--rainbow-angle": `${125 + gamma}deg`,
          "--bg-x": `${50 + gamma * 0.5}%`,
          "--bg-y": `${50 + beta * 0.3}%`,
          "--glare-angle": `${135 + gamma}deg`,
        } as React.CSSProperties);
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);
    return () =>
      window.removeEventListener("deviceorientation", handleOrientation);
  }, [touching]);

  return (
    <div className="holo-card-wrapper">
      <div
        ref={cardRef}
        className={`holo-card ${touching ? "touching" : ""}`}
        style={style}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setTouching(true)}
        onMouseLeave={resetCard}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={resetCard}
      >
        <div className="holo-card-border" />
        <div className="holo-card-shadow" />
        <img
          src={src}
          alt={alt}
          className="holo-card-image"
          draggable={false}
        />
        <div className="holo-card-shine" />
        <div className="holo-card-rainbow" />
        <div className="holo-card-glare" />
        <div className="holo-sparkles">
          {sparkles.map((s) => (
            <span
              key={s.id}
              className="sparkle"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: s.size,
                height: s.size,
                animationDelay: `${s.delay}s`,
                animationDuration: `${s.duration}s`,
              }}
            />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(8px)",
            color: "white",
            padding: "4px 16px",
            borderRadius: "20px",
            fontSize: "0.75rem",
            fontFamily: "'Noto Serif KR', serif",
            zIndex: 10,
            whiteSpace: "nowrap",
          }}
        >
          {index + 1}
        </div>
      </div>
    </div>
  );
}
