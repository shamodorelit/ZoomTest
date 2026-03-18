'use client';

import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  MessageSquare, Users, PhoneOff, Circle, Square, StopCircle
} from 'lucide-react';

interface ControlsBarProps {
  micOn: boolean;
  cameraOn: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  isAdmin: boolean;
  showChat: boolean;
  showParticipants: boolean;
  activeScreenSharer: string | null;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onScreenShare: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onLeave: () => void;
  onEndMeeting: () => void;
  participantCount: number;
}

export default function ControlsBar({
  micOn, cameraOn, isScreenSharing, isRecording, isAdmin, showChat, showParticipants,
  activeScreenSharer, onToggleMic, onToggleCamera, onScreenShare,
  onToggleChat, onToggleParticipants, onStartRecording, onStopRecording,
  onLeave, onEndMeeting, participantCount,
}: ControlsBarProps) {
  const canRequestScreenShare = !activeScreenSharer || isScreenSharing;

  return (
    <div className="h-20 bg-neutral-900/90 backdrop-blur-md border-t border-neutral-800 flex items-center justify-between px-6 gap-4 shrink-0">
      {/* Left group */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleMic}
          title={micOn ? 'Mute' : 'Unmute'}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
            micOn ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-red-600 hover:bg-red-500'
          }`}>
          {micOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
          <span className="text-[10px] text-neutral-300">{micOn ? 'Mute' : 'Unmute'}</span>
        </button>

        <button
          onClick={onToggleCamera}
          title={cameraOn ? 'Stop Video' : 'Start Video'}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
            cameraOn ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-red-600 hover:bg-red-500'
          }`}>
          {cameraOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
          <span className="text-[10px] text-neutral-300">{cameraOn ? 'Stop Video' : 'Start Video'}</span>
        </button>

        <button
          onClick={onScreenShare}
          disabled={!canRequestScreenShare && !isAdmin}
          title={isScreenSharing ? 'Stop Share' : 'Share Screen'}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all disabled:opacity-40 ${
            isScreenSharing ? 'bg-green-600 hover:bg-green-500' : 'bg-neutral-800 hover:bg-neutral-700'
          }`}>
          {isScreenSharing ? <MonitorOff className="w-5 h-5 text-white" /> : <Monitor className="w-5 h-5 text-white" />}
          <span className="text-[10px] text-neutral-300">{isScreenSharing ? 'Stop Share' : 'Share'}</span>
        </button>
      </div>

      {/* Center group */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleChat}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
            showChat ? 'bg-blue-600' : 'bg-neutral-800 hover:bg-neutral-700'
          }`}>
          <MessageSquare className="w-5 h-5 text-white" />
          <span className="text-[10px] text-neutral-300">Chat</span>
        </button>

        <button
          onClick={onToggleParticipants}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all relative ${
            showParticipants ? 'bg-blue-600' : 'bg-neutral-800 hover:bg-neutral-700'
          }`}>
          <Users className="w-5 h-5 text-white" />
          <span className="text-[10px] text-neutral-300">People</span>
          {participantCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {participantCount}
            </span>
          )}
        </button>
      </div>

      {/* Right group */}
      <div className="flex items-center gap-2">
        {isAdmin && (
          <>
            <button
              onClick={isRecording ? onStopRecording : onStartRecording}
              title={isRecording ? 'Stop Recording' : 'Start Recording'}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                isRecording ? 'bg-red-600 animate-pulse' : 'bg-neutral-800 hover:bg-neutral-700'
              }`}>
              {isRecording ? <Square className="w-5 h-5 text-white" /> : <Circle className="w-5 h-5 text-red-400" />}
              <span className="text-[10px] text-neutral-300">{isRecording ? 'Stop Rec' : 'Record'}</span>
            </button>

            <button
              onClick={onEndMeeting}
              title="End Meeting for All"
              className="flex flex-col items-center gap-1 p-3 bg-red-700 hover:bg-red-600 rounded-xl transition-all">
              <StopCircle className="w-5 h-5 text-white" />
              <span className="text-[10px] text-white font-medium">End</span>
            </button>
          </>
        )}

        <button
          onClick={onLeave}
          title="Leave Meeting"
          className="flex flex-col items-center gap-1 p-3 bg-red-600 hover:bg-red-500 rounded-xl transition-all ml-2">
          <PhoneOff className="w-5 h-5 text-white" />
          <span className="text-[10px] text-white font-medium">Leave</span>
        </button>
      </div>
    </div>
  );
}
