"use client";

import { useRef, useState } from "react";

interface MusicPlayerProps {
  src: string;
}

/**
 * Reproductor discreto y "autoplay-safe": nunca reproduce sin interacción
 * explícita del usuario. Los navegadores móviles bloquean el autoplay con
 * audio de todas formas, así que forzarlo solo generaría errores en consola.
 */
export function MusicPlayer({ src }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      void audioRef.current.play();
    }
    setPlaying(!playing);
  }

  return (
    <button
      onClick={toggle}
      className="fixed right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-md backdrop-blur"
      aria-label={playing ? "Pausar música" : "Reproducir música"}
    >
      <audio ref={audioRef} src={src} loop />
      {playing ? "⏸" : "♪"}
    </button>
  );
}
