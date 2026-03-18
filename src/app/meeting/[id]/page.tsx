'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import VideoTile from '@/components/meeting/VideoTile';
import ChatPanel from '@/components/meeting/ChatPanel';
import ParticipantList from '@/components/meeting/ParticipantList';
import ControlsBar from '@/components/meeting/ControlsBar';
import { Loader2, CheckCircle } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default function MeetingRoom({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (!data.success) { router.push('/login'); return; }
        setUser(data.user);
        setLoading(false);
      });
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <MeetingRoomInner
      meetingId={id}
      user={user}
      showChat={showChat}
      showParticipants={showParticipants}
      onToggleChat={() => { setShowChat(s => !s); setShowParticipants(false); }}
      onToggleParticipants={() => { setShowParticipants(s => !s); setShowChat(false); }}
    />
  );
}

function MeetingRoomInner({
  meetingId, user, showChat, showParticipants, onToggleChat, onToggleParticipants
}: {
  meetingId: string;
  user: any;
  showChat: boolean;
  showParticipants: boolean;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
}) {
  const router = useRouter();
  const isAdmin = user.role === 'admin';
  const [maximizedSocketId, setMaximizedSocketId] = useState<string | null>(null);

  const {
    localStream, screenStream, participants, messages,
    micOn, cameraOn, isScreenSharing, activeScreenSharer,
    screenShareRequests, isRecording, meetingEnded, socketId,
    toggleMic, toggleCamera, requestScreenShare, stopScreenShare,
    approveScreenShare, denyScreenShare, adminStopScreenShare,
    adminForceMute, adminToggleUserCamera,
    sendMessage, startRecording, stopRecording,
    endMeeting, leaveMeeting,
  } = useWebRTC({
    meetingId,
    userId: user.id,
    userName: `${user.firstName} ${user.lastName}`,
    isAdmin,
  });

  // Auto-maximize screen sharer
  useEffect(() => {
    if (activeScreenSharer) {
      setMaximizedSocketId(activeScreenSharer);
    } else {
      setMaximizedSocketId(null);
    }
  }, [activeScreenSharer]);

  const handleLeave = () => {
    leaveMeeting();
    router.push(isAdmin ? '/admin/meetings' : '/meetings');
  };

  const handleEndMeeting = async () => {
    if (!confirm('End the meeting for everyone?')) return;
    await endMeeting();
    router.push('/admin/meetings');
  };

  const handleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      requestScreenShare();
    }
  };

  // Meeting ended by admin (non-admin side)
  if (meetingEnded) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-6 text-white">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Meeting Ended</h2>
          <p className="text-neutral-400">This meeting was ended by the administrator.</p>
        </div>
        <button
          onClick={() => router.push('/meetings')}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold transition-all"
        >
          Back to Meetings
        </button>
      </div>
    );
  }

  // Grid layout: how many columns based on participant count
  const allStreams = [
    { socketId: 'local', userName: `${user.firstName} ${user.lastName}`, stream: isScreenSharing && screenStream ? screenStream : localStream, micOn, cameraOn, isLocal: true },
    ...participants.map(p => ({
      socketId: p.socketId,
      userName: p.userName,
      stream: p.stream || null,
      micOn: p.micOn,
      cameraOn: p.cameraOn,
      isLocal: false,
    })),
  ];

  const gridCols = allStreams.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
    allStreams.length === 2 ? 'grid-cols-2' :
    allStreams.length <= 4 ? 'grid-cols-2' :
    allStreams.length <= 6 ? 'grid-cols-3' : 'grid-cols-4';

  const maximizedStream = maximizedSocketId ? allStreams.find(s => s.socketId === maximizedSocketId) : null;
  const gridStreams = maximizedStream ? allStreams.filter(s => s.socketId !== maximizedSocketId) : allStreams;

  return (
    <div className="h-screen bg-neutral-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-neutral-900/80 border-b border-neutral-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-bold text-sm">Shamod Meet</span>
          <span className="hidden sm:block text-neutral-500 text-sm">Meeting ID: <span className="text-neutral-300 font-mono">{meetingId}</span></span>
        </div>
        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-1.5 text-red-400 text-sm animate-pulse">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="hidden sm:block">Recording</span>
            </div>
          )}
          {isAdmin && <span className="text-xs bg-blue-600/20 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-full">Admin</span>}
        </div>
      </header>

      {/* Screen Share Requests (Admin only) */}
      {isAdmin && screenShareRequests.length > 0 && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-6 py-3 flex items-center justify-between gap-4">
          <span className="text-yellow-400 text-sm font-medium">
            <strong>{screenShareRequests[0].userName}</strong> is requesting to share their screen
          </span>
          <div className="flex gap-2">
            <button onClick={() => approveScreenShare(screenShareRequests[0].socketId)}
              className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold">
              Approve
            </button>
            <button onClick={() => denyScreenShare(screenShareRequests[0].socketId)}
              className="bg-red-600/80 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold">
              Deny
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {maximizedStream ? (
            <div className="flex flex-col h-full gap-4">
              <div className="flex-1 w-full min-h-0">
                <VideoTile
                  key={maximizedStream.socketId}
                  stream={maximizedStream.stream}
                  userName={maximizedStream.userName}
                  micOn={maximizedStream.micOn}
                  cameraOn={maximizedStream.cameraOn}
                  isLocal={maximizedStream.isLocal}
                  isScreenSharing={activeScreenSharer === maximizedStream.socketId}
                  isMaximized={true}
                  onMaximize={() => setMaximizedSocketId(null)}
                />
              </div>
              {gridStreams.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-2 shrink-0 h-48">
                  {gridStreams.map(s => (
                    <div key={s.socketId} className="w-80 shrink-0">
                      <VideoTile
                        stream={s.stream}
                        userName={s.userName}
                        micOn={s.micOn}
                        cameraOn={s.cameraOn}
                        isLocal={s.isLocal}
                        isScreenSharing={activeScreenSharer === s.socketId}
                        isMaximized={false}
                        onMaximize={() => setMaximizedSocketId(s.socketId)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={`grid ${gridCols} gap-4 h-full`}>
              {allStreams.map(s => (
                <VideoTile
                  key={s.socketId}
                  stream={s.stream}
                  userName={s.userName}
                  micOn={s.micOn}
                  cameraOn={s.cameraOn}
                  isLocal={s.isLocal}
                  isScreenSharing={activeScreenSharer === s.socketId}
                  isMaximized={false}
                  onMaximize={() => setMaximizedSocketId(s.socketId)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Side Panel (Chat or Participants) */}
        {(showChat || showParticipants) && (
          <div className="w-80 flex flex-col border-l border-neutral-800 overflow-hidden">
            {showChat && (
              <ChatPanel
                messages={messages}
                currentUserId={user.id}
                onSend={sendMessage}
              />
            )}
            {showParticipants && !showChat && (
              <ParticipantList
                participants={participants}
                localUserId={user.id}
                localSocketId={socketId}
                localMicOn={micOn}
                localCameraOn={cameraOn}
                localUserName={`${user.firstName} ${user.lastName}`}
                isAdmin={isAdmin}
                activeScreenSharer={activeScreenSharer}
                onAdminStopScreenShare={adminStopScreenShare}
                onAdminForceMute={adminForceMute}
                onAdminToggleUserCamera={adminToggleUserCamera}
              />
            )}
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <ControlsBar
        micOn={micOn}
        cameraOn={cameraOn}
        isScreenSharing={isScreenSharing}
        isRecording={isRecording}
        isAdmin={isAdmin}
        showChat={showChat}
        showParticipants={showParticipants}
        activeScreenSharer={activeScreenSharer}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onScreenShare={handleScreenShare}
        onToggleChat={onToggleChat}
        onToggleParticipants={onToggleParticipants}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onLeave={handleLeave}
        onEndMeeting={handleEndMeeting}
        participantCount={allStreams.length}
      />
    </div>
  );
}
