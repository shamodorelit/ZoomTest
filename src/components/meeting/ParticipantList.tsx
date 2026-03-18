'use client';

interface Participant {
  socketId: string;
  userId: string;
  userName: string;
  isAdmin: boolean;
  micOn: boolean;
  cameraOn: boolean;
}

interface ParticipantListProps {
  participants: Participant[];
  localUserId: string;
  localMicOn: boolean;
  localCameraOn: boolean;
  localUserName: string;
  isAdmin: boolean;
  activeScreenSharer: string | null;
  localSocketId: string;
  onAdminStopScreenShare: () => void;
  onAdminForceMute?: (socketId: string) => void;
  onAdminToggleUserCamera?: (socketId: string) => void;
}

export default function ParticipantList({
  participants, localUserId, localMicOn, localCameraOn, localUserName, isAdmin,
  activeScreenSharer, localSocketId, onAdminStopScreenShare, 
  onAdminForceMute, onAdminToggleUserCamera
}: ParticipantListProps) {
  const allParticipants = [
    { socketId: localSocketId, userId: localUserId, userName: localUserName, isAdmin, micOn: localMicOn, cameraOn: localCameraOn },
    ...participants,
  ];

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <span className="font-semibold text-sm text-white">Participants</span>
        <span className="text-xs text-neutral-400 bg-neutral-800 px-2 py-1 rounded-full">{allParticipants.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {allParticipants.map((p) => {
          const isSharing = activeScreenSharer === p.socketId;
          const initials = p.userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
          return (
            <div key={p.socketId}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-neutral-700 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-sm font-medium truncate">{p.userName}</span>
                    {p.isAdmin && <span className="text-xs bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-medium shrink-0">Admin</span>}
                    {p.socketId === localSocketId && <span className="text-xs text-neutral-500 shrink-0">(you)</span>}
                  </div>
                  {isSharing && <p className="text-xs text-green-400">Sharing screen</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-2 shrink-0">
                {isAdmin && p.micOn && p.socketId !== localSocketId && onAdminForceMute ? (
                  <button
                    onClick={() => onAdminForceMute(p.socketId)}
                    title="Force Mute participant"
                    className="p-1 hover:bg-neutral-700 rounded transition-colors text-lg opacity-100"
                  >
                    🎤
                  </button>
                ) : (
                  <span title={p.micOn ? 'Mic On' : 'Mic Off'}
                    className={`text-lg px-1 ${p.micOn ? 'opacity-100' : 'opacity-30'}`}>🎤</span>
                )}
                
                {isAdmin && p.socketId !== localSocketId && onAdminToggleUserCamera ? (
                  <button
                    onClick={() => onAdminToggleUserCamera(p.socketId)}
                    title={p.cameraOn ? "Turn off participant camera" : "Turn on participant camera"}
                    className={`p-1 hover:bg-neutral-700 rounded transition-colors text-lg ${p.cameraOn ? 'opacity-100' : 'opacity-30'}`}
                  >
                    📷
                  </button>
                ) : (
                  <span title={p.cameraOn ? 'Camera On' : 'Camera Off'}
                    className={`text-lg px-1 ${p.cameraOn ? 'opacity-100' : 'opacity-30'}`}>📷</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isAdmin && activeScreenSharer && activeScreenSharer !== localSocketId && (
        <div className="p-3 border-t border-neutral-800">
          <button onClick={onAdminStopScreenShare}
            className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm py-2 rounded-xl font-medium transition-all">
            Stop Screen Share
          </button>
        </div>
      )}
    </div>
  );
}
