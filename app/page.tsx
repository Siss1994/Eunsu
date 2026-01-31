"use client";

import { useState, useEffect, useCallback } from "react";
import ParticleCanvas from "@/components/ParticleCanvas";
import Gallery from "@/components/Gallery";
import MusicPlayer from "@/components/MusicPlayer";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [splashFading, setSplashFading] = useState(false);

  // Fetch image list
  useEffect(() => {
    fetch("/api/images")
      .then((res) => res.json())
      .then((data) => {
        if (data.images && data.images.length > 0) {
          setImages(data.images);
        } else {
          setImagesLoaded(true);
        }
      })
      .catch(() => {
        setImagesLoaded(true);
      });
  }, []);

  // Preload all images in background
  useEffect(() => {
    if (images.length === 0) return;

    let loadedCount = 0;
    const total = images.length;

    images.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loadedCount++;
        if (loadedCount >= total) {
          setImagesLoaded(true);
        }
      };
      img.src = src;
    });
  }, [images]);

  // Minimum splash time
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Transition when both conditions met
  const transitionOut = useCallback(() => {
    if (!splashFading) {
      setSplashFading(true);
      setTimeout(() => {
        setShowSplash(false);
      }, 1000); // match CSS transition duration
    }
  }, [splashFading]);

  useEffect(() => {
    if (minTimeElapsed && imagesLoaded) {
      transitionOut();
    }
  }, [minTimeElapsed, imagesLoaded, transitionOut]);

  return (
    <main>
      {showSplash && (
        <>
          <div className={`splash-container ${splashFading ? "fade-out" : ""}`}>
            <h1 className="splash-title">
              최은수
              <br />
              결혼을 축하한다!
            </h1>
            <p className="splash-subtitle">Congratulations on your wedding</p>
            <div
              style={{
                position: "absolute",
                bottom: "3rem",
                color: "rgba(255,255,255,0.4)",
                fontSize: "0.8rem",
                animation: "fadeInUp 2s ease-out 1.5s forwards",
                opacity: 0,
              }}
            >
              잠시만 기다려주세요...
            </div>
          </div>
          <ParticleCanvas active={!splashFading} />
        </>
      )}

      {!showSplash && (
        <>
          <Gallery images={images} />
          <MusicPlayer />
        </>
      )}
    </main>
  );
}
