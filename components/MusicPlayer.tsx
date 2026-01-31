"use client";

import { useRef, useState, useEffect, useCallback } from "react";

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [playing, setPlaying] = useState(false);
  const [hasMusic, setHasMusic] = useState(false);
  const [usingSynth, setUsingSynth] = useState(false);

  // Try to load external music file, fall back to synthesized music
  useEffect(() => {
    const audio = new Audio("/api/music");
    audio.loop = true;
    audio.volume = 0.3;

    audio.addEventListener("canplaythrough", () => {
      audioRef.current = audio;
      setHasMusic(true);
    });

    audio.addEventListener("error", () => {
      // No music file available, use synthesized music
      setUsingSynth(true);
      setHasMusic(true);
    });

    audio.load();

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const playSynthMusic = useCallback(() => {
    if (audioCtxRef.current) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // Warm, gentle melody
    const notes = [
      { freq: 523.25, dur: 0.8 },  // C5
      { freq: 587.33, dur: 0.4 },  // D5
      { freq: 659.25, dur: 0.8 },  // E5
      { freq: 523.25, dur: 0.4 },  // C5
      { freq: 698.46, dur: 1.0 },  // F5
      { freq: 659.25, dur: 0.6 },  // E5
      { freq: 587.33, dur: 0.6 },  // D5
      { freq: 523.25, dur: 1.0 },  // C5
      { freq: 493.88, dur: 0.8 },  // B4
      { freq: 523.25, dur: 0.4 },  // C5
      { freq: 587.33, dur: 0.8 },  // D5
      { freq: 523.25, dur: 1.2 },  // C5
      { freq: 440.00, dur: 0.8 },  // A4
      { freq: 493.88, dur: 0.4 },  // B4
      { freq: 523.25, dur: 1.0 },  // C5
      { freq: 440.00, dur: 1.0 },  // A4
    ];

    function playSequence(startTime: number) {
      let t = startTime;
      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "sine";
        osc.frequency.value = note.freq;

        filter.type = "lowpass";
        filter.frequency.value = 2000;

        // Soft envelope
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.04, t + note.dur * 0.6);
        gain.gain.linearRampToValueAtTime(0.001, t + note.dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + note.dur);

        t += note.dur;
      });
      return t;
    }

    // Loop the melody
    let currentTime = ctx.currentTime + 0.1;
    const totalDuration = notes.reduce((sum, n) => sum + n.dur, 0);

    function scheduleLoop() {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") return;
      currentTime = playSequence(currentTime);
      currentTime += 1; // pause between loops
      setTimeout(scheduleLoop, (totalDuration + 0.5) * 1000);
    }

    scheduleLoop();
  }, []);

  const toggleMusic = useCallback(() => {
    if (playing) {
      if (usingSynth && audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlaying(false);
    } else {
      if (usingSynth) {
        playSynthMusic();
      } else if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      setPlaying(true);
    }
  }, [playing, usingSynth, playSynthMusic]);

  // Auto-play on first user interaction
  useEffect(() => {
    if (!hasMusic) return;

    const autoPlay = () => {
      if (!playing) {
        toggleMusic();
      }
      document.removeEventListener("click", autoPlay);
      document.removeEventListener("touchstart", autoPlay);
    };

    document.addEventListener("click", autoPlay, { once: true });
    document.addEventListener("touchstart", autoPlay, { once: true });

    return () => {
      document.removeEventListener("click", autoPlay);
      document.removeEventListener("touchstart", autoPlay);
    };
  }, [hasMusic, playing, toggleMusic]);

  if (!hasMusic) return null;

  return (
    <button
      className={`music-btn ${playing ? "playing" : ""}`}
      onClick={toggleMusic}
      aria-label={playing ? "음악 끄기" : "음악 켜기"}
    >
      {playing ? (
        <svg
          className="music-icon"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      ) : (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" opacity="0.5" />
          <line
            x1="3"
            y1="3"
            x2="21"
            y2="21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
