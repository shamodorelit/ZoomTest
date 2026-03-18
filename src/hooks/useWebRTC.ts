'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
};

interface Participant {
  socketId: string;
  userId: string;
  userName: string;
  isAdmin: boolean;
  micOn: boolean;
  cameraOn: boolean;
  stream?: MediaStream;
}

interface ChatMessage {
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

interface UseWebRTCOptions {
  meetingId: string;
  userId: string;
  userName: string;
  isAdmin: boolean;
}

export function useWebRTC({ meetingId, userId, userName, isAdmin }: UseWebRTCOptions) {
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const candidateQueueRef = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeScreenSharer, setActiveScreenSharer] = useState<string | null>(null);
  const [screenShareRequests, setScreenShareRequests] = useState<Array<{socketId: string; userName: string}>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [socketId, setSocketId] = useState<string>('');

  const createPeerConnection = useCallback((targetSocketId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          to: targetSocketId,
          from: socketRef.current.id,
          candidate: event.candidate,
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setParticipants(prev => prev.map(p =>
        p.socketId === targetSocketId ? { ...p, stream: remoteStream } : p
      ));
    };

    peerConnectionsRef.current[targetSocketId] = pc;
    candidateQueueRef.current[targetSocketId] = [];
    return pc;
  }, []);

  const sendOffer = useCallback(async (targetSocketId: string) => {
    const pc = createPeerConnection(targetSocketId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit('offer', {
      to: targetSocketId,
      from: socketRef.current.id,
      offer,
    });
  }, [createPeerConnection]);

  // Initialize media and socket
  useEffect(() => {
    let isMounted = true;
    const signalingUrl = process.env.NEXT_PUBLIC_SIGNAL_SERVER || 'http://localhost:3001';

    const init = async () => {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        // Connect to signaling server
        const socket = io(signalingUrl, { transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('connect', () => {
          setSocketId(socket.id || '');
          socket.emit('join-room', { meetingId, userId, userName, isAdmin });
        });

        // Existing participants
        socket.on('existing-participants', async (participants: Participant[]) => {
          setParticipants(participants);
          // Create offer for each existing participant
          for (const p of participants) {
            await sendOffer(p.socketId);
          }
        });

        // New user joined
        socket.on('user-joined', (participant: Participant) => {
          setParticipants(prev => {
            if (prev.find(p => p.socketId === participant.socketId)) return prev;
            return [...prev, participant];
          });
        });

        // Updated participant list
        socket.on('participant-list', (list: Participant[]) => {
          setParticipants(prev => list
            .filter(p => p.socketId !== socket.id) // Exclude local participant
            .map(p => ({
              ...p,
              stream: prev.find(pp => pp.socketId === p.socketId)?.stream,
            }))
          );
        });

        // Handle offer
        socket.on('offer', async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
          const pc = createPeerConnection(from);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          
          // Process queued candidates
          if (candidateQueueRef.current[from]) {
            for (const cand of candidateQueueRef.current[from]) {
              try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) { console.error(e); }
            }
            candidateQueueRef.current[from] = [];
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', { to: from, from: socket.id, answer });
        });

        // Handle answer
        socket.on('answer', async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
          const pc = peerConnectionsRef.current[from];
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));

            // Process queued candidates
            if (candidateQueueRef.current[from]) {
              for (const cand of candidateQueueRef.current[from]) {
                try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) { console.error(e); }
              }
              candidateQueueRef.current[from] = [];
            }
          }
        });

        // Handle ICE candidate
        socket.on('ice-candidate', async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
          const pc = peerConnectionsRef.current[from];
          if (pc) {
            if (pc.remoteDescription) {
              try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
              catch (e) { console.error('Error adding ICE candidate:', e); }
            } else {
              if (!candidateQueueRef.current[from]) candidateQueueRef.current[from] = [];
              candidateQueueRef.current[from].push(candidate);
            }
          }
        });

        // User left
        socket.on('user-left', ({ socketId }: { socketId: string }) => {
          setParticipants(prev => prev.filter(p => p.socketId !== socketId));
          if (peerConnectionsRef.current[socketId]) {
            peerConnectionsRef.current[socketId].close();
            delete peerConnectionsRef.current[socketId];
          }
        });

        // Chat messages
        socket.on('new-message', (msg: ChatMessage) => {
          setMessages(prev => [...prev, msg]);
        });

        // Screen share events
        socket.on('active-screen-sharer', ({ socketId }: { socketId: string | null }) => {
          setActiveScreenSharer(socketId);
          if (!socketId) setIsScreenSharing(false);
        });

        socket.on('screen-share-approved', async () => {
          try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            screenStreamRef.current = stream;
            setScreenStream(stream);
            setIsScreenSharing(true);

            // Replace video track in all peer connections
            Object.values(peerConnectionsRef.current).forEach(pc => {
              const videoSender = pc.getSenders().find(s => s.track?.kind === 'video');
              if (videoSender && stream.getVideoTracks()[0]) {
                videoSender.replaceTrack(stream.getVideoTracks()[0]).catch(console.error);
              }
            });

            stream.getVideoTracks()[0].onended = () => {
              stopScreenShare();
            };

            socket.emit('start-screen-share', { meetingId });
          } catch (e) {
            console.error('Screen share error:', e);
          }
        });

        socket.on('screen-share-denied', () => {
          alert('Screen share permission denied by admin.');
        });

        socket.on('screen-share-stopped', () => {
          stopScreenShare(false);
        });

        socket.on('screen-share-request', ({ socketId, userName }: { socketId: string; userName: string }) => {
          setScreenShareRequests(prev => [...prev, { socketId, userName }]);
        });

        // Force mute from admin
        socket.on('force-mute', () => {
          if (localStreamRef.current) {
            const track = localStreamRef.current.getAudioTracks()[0];
            if (track && track.enabled) {
              track.enabled = false;
              setMicOn(false);
              const camState = localStreamRef.current.getVideoTracks().some(t => t.enabled);
              socket.emit('media-state', { meetingId, micOn: false, cameraOn: camState });
              alert('An administrator has muted your microphone.');
            }
          }
        });

        // Force toggle camera from admin
        socket.on('force-toggle-camera', () => {
          if (localStreamRef.current) {
            const track = localStreamRef.current.getVideoTracks()[0];
            if (track) {
              const newState = !track.enabled;
              track.enabled = newState;
              setCameraOn(newState);
              const micState = localStreamRef.current.getAudioTracks().some(t => t.enabled);
              socket.emit('media-state', { meetingId, micOn: micState, cameraOn: newState });
              alert(`An administrator has turned your camera ${newState ? 'on' : 'off'}.`);
            }
          }
        });

        // Meeting ended
        socket.on('meeting-ended', () => {
          setMeetingEnded(true);
          cleanup();
        });

      } catch (err) {
        console.error('Media/socket init error:', err);
      }
    };

    if (meetingId && userId && userName) {
      init();
    }

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [meetingId, userId, userName, isAdmin]);

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    socketRef.current?.disconnect();
  };

  // Toggle mic
  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;
    const newState = !micOn;
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = newState; });
    setMicOn(newState);
    socketRef.current?.emit('media-state', { meetingId, micOn: newState, cameraOn });
  }, [micOn, cameraOn, meetingId]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const newState = !cameraOn;
    localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = newState; });
    setCameraOn(newState);
    socketRef.current?.emit('media-state', { meetingId, micOn, cameraOn: newState });
  }, [micOn, cameraOn, meetingId]);

  // Request screen share
  const requestScreenShare = useCallback(() => {
    if (!socketRef.current) return;
    if (isAdmin) {
      // Admin can share directly
      socketRef.current.emit('approve-screen-share', { meetingId, targetSocketId: socketRef.current.id });
    } else {
      socketRef.current.emit('request-screen-share', { meetingId, userId, userName });
    }
  }, [meetingId, userId, userName, isAdmin]);

  // Stop screen share
  const stopScreenShare = useCallback((emit = true) => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      // Restore original camera track
      if (localStreamRef.current) {
        Object.values(peerConnectionsRef.current).forEach(pc => {
          const videoSender = pc.getSenders().find(s => s.track?.kind === 'video');
          const camTrack = localStreamRef.current!.getVideoTracks()[0];
          if (videoSender && camTrack) {
            videoSender.replaceTrack(camTrack).catch(console.error);
          }
        });
      }
      screenStreamRef.current = null;
      setScreenStream(null);
    }
    setIsScreenSharing(false);
    if (emit) {
      socketRef.current?.emit('stop-screen-share', { meetingId });
    }
  }, [meetingId]);

  // Approve/deny screen share requests (admin)
  const approveScreenShare = useCallback((targetSocketId: string) => {
    socketRef.current?.emit('approve-screen-share', { meetingId, targetSocketId });
    setScreenShareRequests(prev => prev.filter(r => r.socketId !== targetSocketId));
  }, [meetingId]);

  const denyScreenShare = useCallback((targetSocketId: string) => {
    socketRef.current?.emit('deny-screen-share', { meetingId, targetSocketId });
    setScreenShareRequests(prev => prev.filter(r => r.socketId !== targetSocketId));
  }, [meetingId]);

  const adminStopScreenShare = useCallback(() => {
    socketRef.current?.emit('admin-stop-screen-share', { meetingId });
  }, [meetingId]);

  const adminForceMute = useCallback((targetSocketId: string) => {
    socketRef.current?.emit('admin-force-mute', { meetingId, targetSocketId });
  }, [meetingId]);

  const adminToggleUserCamera = useCallback((targetSocketId: string) => {
    socketRef.current?.emit('admin-toggle-camera', { meetingId, targetSocketId });
  }, [meetingId]);

  // Send chat message
  const sendMessage = useCallback((message: string) => {
    if (!message.trim() || !socketRef.current) return;
    const msg = { meetingId, senderId: userId, senderName: userName, message, timestamp: new Date().toISOString() };
    socketRef.current.emit('send-message', msg);

    // Also save to DB
    fetch(`/api/meetings/${meetingId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, senderName: userName }),
    });
  }, [meetingId, userId, userName]);

  // Start recording
  const startRecording = useCallback(() => {
    if (!localStreamRef.current || !isAdmin) return;
    const stream = new MediaStream();
    localStreamRef.current.getTracks().forEach(t => stream.addTrack(t));
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => stream.addTrack(t));
    }

    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
    recordedChunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meeting-${meetingId}-${Date.now()}.webm`;
      a.click();
    };
    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  }, [isAdmin, meetingId]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  // End meeting (admin)
  const endMeeting = useCallback(async () => {
    socketRef.current?.emit('end-meeting', { meetingId });
    // Update DB status
    const meetingRes = await fetch(`/api/meetings`);
    const meetingData = await meetingRes.json();
    const meeting = meetingData.meetings?.find((m: any) => m._id === meetingId || m.meetingId === meetingId);
    if (meeting) {
      await fetch(`/api/meetings/${meeting._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ended' }),
      });
    }
  }, [meetingId]);

  // Leave meeting
  const leaveMeeting = useCallback(() => {
    cleanup();
  }, []);

  return {
    localStream,
    screenStream,
    participants,
    messages,
    micOn, cameraOn,
    isScreenSharing,
    activeScreenSharer,
    screenShareRequests,
    isRecording,
    meetingEnded,
    socketId,
    toggleMic, toggleCamera,
    requestScreenShare, stopScreenShare,
    approveScreenShare, denyScreenShare, adminStopScreenShare,
    adminForceMute,
    adminToggleUserCamera,
    sendMessage,
    startRecording, stopRecording,
    endMeeting, leaveMeeting,
  };
}
