"use client";

import { useState, useRef, useEffect } from "react";
import HolographicCard from "./HolographicCard";

interface GalleryProps {
  images: string[];
}

export default function Gallery({ images }: GalleryProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(idx)) setCurrentSlide(idx);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    const slides = container.querySelectorAll(".gallery-slide");
    slides.forEach((slide) => observer.observe(slide));

    return () => observer.disconnect();
  }, [images]);

  if (images.length === 0) {
    return (
      <div className="empty-state page-enter">
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.4, marginBottom: "1rem" }}
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <h2>아직 사진이 없어요</h2>
        <p style={{ lineHeight: 1.8 }}>
          public/images/ 폴더에 사진을 추가하고
          <br />
          images.json에 경로를 넣어주세요
        </p>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ position: "relative" }}>
      <div className="slide-counter">
        {currentSlide + 1} / {images.length}
      </div>

      <div ref={containerRef} className="gallery-container">
        {images.map((img, i) => (
          <div
            key={img}
            className="gallery-slide"
            data-index={i}
            style={{
              background:
                i % 2 === 0
                  ? "linear-gradient(180deg, #FFF8F0 0%, #F5E6E0 100%)"
                  : "linear-gradient(180deg, #F5E6E0 0%, #FFF8F0 100%)",
            }}
          >
            <HolographicCard
              src={img}
              alt={`추억 사진 ${i + 1}`}
              index={i}
            />
            {i === 0 && images.length > 1 && (
              <div className="scroll-indicator">
                <span>아래로 스크롤</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            )}
          </div>
        ))}

        {/* Final slide */}
        <div
          className="gallery-slide"
          data-index={images.length}
          style={{
            background: "linear-gradient(180deg, #F5E6E0 0%, #FFF8F0 100%)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontSize: "1.5rem",
                color: "var(--wedding-deep)",
                marginBottom: "0.5rem",
                lineHeight: 1.6,
              }}
            >
              은수야, 결혼 축하해!
            </p>
            <p
              style={{
                color: "rgba(44,24,16,0.5)",
                fontSize: "0.9rem",
                lineHeight: 1.8,
              }}
            >
              행복하게 잘 살아 ~
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
