"use client";

import { useState, useEffect, useCallback } from "react";
import ParticleCanvas from "@/components/ParticleCanvas";
import Gallery from "@/components/Gallery";
import MusicPlayer from "@/components/MusicPlayer";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [splashFading, setSplashFading] = useState(false);

  // Fetch image list from static JSON
  useEffect(() => {
    fetch(`${BASE}/images.json`)
      .then((res) => res.json())
      .then((data: string[]) => {
        if (data && data.length > 0) {
          setImages(data.map((src) => `${BASE}${src}`));
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

    const total = images.length;
    setTotalCount(total);
    let count = 0;

    images.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        count++;
        setLoadedCount(count);
        if (count >= total) {
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
            <div className="splash-loading">
              <div className="loading-bar-track">
                <div
                  className="loading-bar-fill"
                  style={{ width: totalCount > 0 ? `${(loadedCount / totalCount) * 100}%` : '0%' }}
                />
              </div>
              <p className="loading-text">
                {totalCount > 0
                  ? `${loadedCount} / ${totalCount}`
                  : '불러오는 중...'}
              </p>
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
