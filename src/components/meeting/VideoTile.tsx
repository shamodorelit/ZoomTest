'use client';

import { useEffect, useRef } from 'react';
import { MicOff, Maximize } from 'lucide-react';

interface VideoTileProps {
  stream: MediaStream | null;
  userName: string;
  micOn?: boolean;
  cameraOn?: boolean;
  isLocal?: boolean;
  isScreenSharing?: boolean;
  onMaximize?: () => void;
  isMaximized?: boolean;
}

export default function VideoTile({ 
  stream, userName, micOn = true, cameraOn = true, isLocal = false, 
  isScreenSharing = false, onMaximize, isMaximized = false 
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate a consistent color based on name
  const colors = [
    'from-blue-600 to-indigo-700',
    'from-violet-600 to-purple-700',
    'from-cyan-600 to-blue-700',
    'from-emerald-600 to-teal-700',
    'from-rose-600 to-pink-700',
    'from-amber-600 to-orange-700',
  ];
  const colorIndex = userName.charCodeAt(0) % colors.length;
  const avatarGradient = colors[colorIndex];

  return (
    <div 
      className={`relative bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-neutral-800 transition-all ${isMaximized ? 'w-full h-full' : 'aspect-video group'} ${onMaximize ? 'cursor-pointer ring-0 hover:ring-2 ring-blue-500/50' : ''}`}
      onClick={onMaximize}
    >
      {stream && (cameraOn || isScreenSharing) ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full ${isScreenSharing ? 'object-contain bg-neutral-950' : 'object-cover'} ${isLocal && !isScreenSharing ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 w-full h-full">
          <div className={`w-20 h-20 bg-gradient-to-br ${avatarGradient} rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg`}>
            {initials}
          </div>
          <span className="text-neutral-400 text-xs font-medium">Camera off</span>
        </div>
      )}

      {/* Name badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <span className="bg-black/60 backdrop-blur text-white text-xs px-2.5 py-1 rounded-lg font-medium">
          {isLocal ? `${userName} (You)` : userName}
        </span>
        {!micOn && (
          <span className="bg-red-600/80 backdrop-blur rounded-full p-1">
            <MicOff className="w-3 h-3 text-white" />
          </span>
        )}
      </div>

      {/* Local badge */}
      {isLocal && (
        <div className="absolute top-3 right-3 bg-blue-600/80 backdrop-blur text-white text-xs px-2 py-0.5 rounded-full font-medium">
          You
        </div>
      )}

      {/* Native Fullscreen Button */}
      {stream && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (videoRef.current) {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(console.error);
              } else {
                videoRef.current.requestFullscreen().catch(console.error);
              }
            }
          }}
          className={`absolute top-3 ${isLocal ? 'right-14' : 'right-3'} bg-black/50 hover:bg-black/70 backdrop-blur text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10`}
          title="Full Screen"
        >
          <Maximize className="w-4 h-4" />
        </button>
      )}

      {/* Removed Maximize toggle as entire tile is now clickable */}

      {/* Subtle hover overlay */}
      <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-all pointer-events-none rounded-2xl" />
    </div>
  );
}
