"use client";

import { useRef, useState, useEffect, useCallback } from "react";

// Pachelbel's Canon in D - simplified piano arrangement
// Each note: [frequency, duration in beats]
const CANON_MELODY: [number, number][] = [
  // Bar 1-2: D major arpeggio theme
  [587.33, 1], // D5
  [523.25, 1], // C#5 -> use C5 approx
  [587.33, 1], // D5
  [440.00, 1], // A4
  [493.88, 1], // B4
  [440.00, 0.5], // A4
  [392.00, 0.5], // G4
  [440.00, 1], // A4
  // Bar 3-4
  [587.33, 1.5], // D5
  [523.25, 0.5], // C5
  [493.88, 1], // B4
  [440.00, 1], // A4
  [392.00, 1.5], // G4
  [440.00, 0.5], // A4
  [493.88, 1], // B4
  // Bar 5-6: ascending
  [523.25, 1], // C5
  [493.88, 0.5], // B4
  [440.00, 0.5], // A4
  [392.00, 1], // G4
  [349.23, 1], // F4
  [392.00, 1], // G4
  [440.00, 0.5], // A4
  [493.88, 0.5], // B4
  [523.25, 1], // C5
  // Bar 7-8: resolution
  [587.33, 1.5], // D5
  [523.25, 0.5], // C5
  [493.88, 1], // B4
  [440.00, 1.5], // A4
  [392.00, 0.5], // G4
  [349.23, 1], // F4
  [392.00, 2], // G4 (hold)
  // Bar 9-10: gentle descent
  [587.33, 1], // D5
  [659.25, 1], // E5
  [587.33, 1], // D5
  [523.25, 1], // C5
  [493.88, 0.5], // B4
  [440.00, 0.5], // A4
  [493.88, 1], // B4
  [523.25, 1], // C5
  [440.00, 1], // A4
  // Bar 11-12: warm ending
  [392.00, 1], // G4
  [440.00, 1], // A4
  [493.88, 1.5], // B4
  [440.00, 0.5], // A4
  [392.00, 1], // G4
  [349.23, 1], // F4
  [293.66, 2], // D4 (hold - home)
];

// Bass line (Canon chord progression: D-A-Bm-F#m-G-D-G-A)
const BASS_NOTES: [number, number][] = [
  [146.83, 2], // D3
  [110.00, 2], // A2
  [123.47, 2], // B2
  [92.50, 2],  // F#2 approx
  [98.00, 2],  // G2
  [146.83, 2], // D3
  [98.00, 2],  // G2
  [110.00, 2], // A2
  [146.83, 2], // D3
  [110.00, 2], // A2
  [123.47, 2], // B2
  [92.50, 2],  // F#2
  [98.00, 2],  // G2
  [146.83, 2], // D3
  [98.00, 2],  // G2
  [110.00, 2], // A2
  [146.83, 4], // D3 (final hold)
];

// Chord pads for warmth
const CHORD_PROGRESSION: [number[], number][] = [
  [[293.66, 369.99, 440.00], 4], // D major
  [[220.00, 277.18, 329.63], 4], // A major
  [[246.94, 293.66, 369.99], 4], // B minor
  [[185.00, 220.00, 277.18], 4], // F# minor
  [[196.00, 246.94, 293.66], 4], // G major
  [[293.66, 369.99, 440.00], 4], // D major
  [[196.00, 246.94, 293.66], 4], // G major
  [[220.00, 277.18, 329.63], 4], // A major
  [[293.66, 369.99, 440.00], 8], // D major (final)
];

const BEAT_DURATION = 0.45; // seconds per beat - gentle tempo

function createPianoTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume: number = 0.06
) {
  // Layer multiple harmonics for piano-like timbre
  const harmonics = [1, 2, 3, 4, 5];
  const harmonicVolumes = [1, 0.5, 0.25, 0.12, 0.06];

  harmonics.forEach((h, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = h === 1 ? "sine" : "sine";
    osc.frequency.value = freq * h;

    // Soft low-pass to tame high harmonics
    filter.type = "lowpass";
    filter.frequency.value = Math.min(freq * 6, 8000);
    filter.Q.value = 0.5;

    const vol = volume * harmonicVolumes[i];
    const dur = duration * BEAT_DURATION;

    // Piano-like ADSR envelope
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.02); // fast attack
    gain.gain.exponentialRampToValueAtTime(
      vol * 0.6,
      startTime + Math.min(0.15, dur * 0.3)
    ); // decay
    gain.gain.exponentialRampToValueAtTime(
      vol * 0.3,
      startTime + dur * 0.7
    ); // sustain
    gain.gain.linearRampToValueAtTime(0.001, startTime + dur); // release

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + dur + 0.1);
  });
}

function createPadTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume: number = 0.015
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = "sine";
  osc.frequency.value = freq;

  filter.type = "lowpass";
  filter.frequency.value = 1500;
  filter.Q.value = 0.3;

  const dur = duration * BEAT_DURATION;

  // Very soft pad envelope
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + dur * 0.2); // slow attack
  gain.gain.setValueAtTime(volume, startTime + dur * 0.7);
  gain.gain.linearRampToValueAtTime(0.001, startTime + dur); // release

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + dur + 0.2);
}

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [hasMusic, setHasMusic] = useState(false);
  const [usingSynth, setUsingSynth] = useState(false);

  // Try to load external music file from public/, fall back to synthesized music
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const audio = new Audio(`${base}/music/bgm.mp3`);
    audio.loop = true;
    audio.volume = 0.3;

    audio.addEventListener("canplaythrough", () => {
      audioRef.current = audio;
      setHasMusic(true);
    });

    audio.addEventListener("error", () => {
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

    function scheduleMusic(baseTime: number): number {
      let t = baseTime;

      // Schedule melody
      let melodyTime = t;
      CANON_MELODY.forEach(([freq, dur]) => {
        createPianoTone(ctx, freq, melodyTime, dur, 0.055);
        melodyTime += dur * BEAT_DURATION;
      });

      // Schedule bass (lower, softer)
      let bassTime = t;
      BASS_NOTES.forEach(([freq, dur]) => {
        createPianoTone(ctx, freq, bassTime, dur, 0.03);
        bassTime += dur * BEAT_DURATION;
      });

      // Schedule chord pads (very soft background)
      let chordTime = t;
      CHORD_PROGRESSION.forEach(([freqs, dur]) => {
        freqs.forEach((freq) => {
          createPadTone(ctx, freq, chordTime, dur, 0.012);
        });
        chordTime += dur * BEAT_DURATION;
      });

      // Return the end time (longest sequence)
      return Math.max(melodyTime, bassTime, chordTime);
    }

    const totalBeats =
      CANON_MELODY.reduce((sum, [, dur]) => sum + dur, 0);
    const totalDurationSec = totalBeats * BEAT_DURATION;

    let currentTime = ctx.currentTime + 0.2;

    function scheduleLoop() {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") return;
      currentTime = scheduleMusic(currentTime);
      currentTime += 2; // 2 second gap between loops
      loopTimerRef.current = setTimeout(
        scheduleLoop,
        (totalDurationSec - 2) * 1000
      );
    }

    scheduleLoop();
  }, []);

  const stopSynth = useCallback(() => {
    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, []);

  const toggleMusic = useCallback(() => {
    if (playing) {
      if (usingSynth) {
        stopSynth();
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
  }, [playing, usingSynth, playSynthMusic, stopSynth]);

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
