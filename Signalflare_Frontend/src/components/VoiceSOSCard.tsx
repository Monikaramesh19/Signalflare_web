import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Flame, Users, MapPin, Radio, CheckCircle, Volume2 } from 'lucide-react';

interface VoiceSOSCardProps {
  severity: string;
  peopleCount: number;
  locationLat: number;
  locationLng: number;
  audioBase64: string; // Stored in "message" column
  status: string;
  createdAt: string | number;
  senderName?: string;
}

export const VoiceSOSCard: React.FC<VoiceSOSCardProps> = ({
  severity,
  peopleCount,
  locationLat,
  locationLng,
  audioBase64,
  status,
  createdAt,
  senderName,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioBase64) {
      audioRef.current = new Audio(audioBase64);
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current) setDuration(audioRef.current.duration);
      };
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
      };
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioBase64]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => console.warn('Audio playback failed', err));
      setIsPlaying(true);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-5 rounded-xl glass-panel border border-slate-800 bg-slate-950/20 text-xs text-slate-300 space-y-4 shadow-lg max-w-sm">
      {/* Title Header */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-3">
        <h4 className="font-bold text-white flex items-center gap-2">
          <Flame className="w-4 h-4 text-red-500 animate-pulse" />
          🚨 VOICE SOS
        </h4>
        <span className="text-[9px] text-slate-500 font-mono">
          {new Date(createdAt).toLocaleTimeString()}
        </span>
      </div>

      {/* Distress Badges */}
      <div className="grid grid-cols-3 gap-2">
        <div className="py-2.5 rounded bg-red-950/20 border border-red-500/20 text-center font-bold text-red-400">
          {severity === 'CRITICAL' ? '🔴 CRITICAL' : `🟡 ${severity}`}
        </div>
        <div className="py-2.5 rounded bg-slate-900 border border-slate-800 text-center flex items-center justify-center gap-1">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-white">{peopleCount} people</span>
        </div>
        <div className="py-2.5 rounded bg-slate-900 border border-slate-800 text-center flex items-center justify-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold text-emerald-400">📍 MAP OK</span>
        </div>
      </div>

      {/* Audio Player Panel */}
      <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-900 flex items-center gap-3">
        <button
          onClick={togglePlayback}
          className="w-8 h-8 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center cursor-pointer transition-colors shadow"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <div className="flex-1 space-y-1">
          <p className="text-[10px] font-bold text-white flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-cyan-400" />
            Voice Emergency Recording
          </p>
          <div className="flex items-center gap-2 font-mono text-[9px] text-slate-400">
            <span className="text-cyan-400 font-bold">{formatTime(currentTime)}</span>
            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Mesh Relaying Pathways */}
      <div className="border-t border-slate-900 pt-3 flex flex-col gap-2 font-mono text-[10px]">
        <div className="flex items-center gap-2 text-cyan-400">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>📡 Relayed through 2 mesh nodes</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>✓ Delivered to Rescue Team</span>
        </div>
      </div>
    </div>
  );
};
