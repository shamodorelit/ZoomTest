'use client';

import { useEffect, useState } from 'react';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { Calendar, Video, LogOut, Loader2, Clock } from 'lucide-react';

export default function UserMeetings() {
  const [user, setUser] = useState<any>(null);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { goToLogin, goToMeeting } = useAppNavigation();

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/meetings').then(r => r.json()),
    ]).then(([userData, meetingsData]) => {
      if (!userData.success) { goToLogin(); return; }
      setUser(userData.user);
      setMeetings(meetingsData.meetings || []);
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/me', { method: 'DELETE' });
    goToLogin();
  };

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[150px]" />
      </div>

      <nav className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Shamod Meet</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-neutral-500">Participant</p>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Available Meetings</h1>
          <p className="text-neutral-400">Select a live meeting to join.</p>
        </header>

        {meetings.length === 0 ? (
          <div className="text-center py-24">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-neutral-700" />
            <p className="text-neutral-500 text-lg">No active meetings at the moment.</p>
            <p className="text-neutral-600 text-sm mt-2">Check back later or contact your administrator.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetings.map((meeting: any) => (
              <div key={meeting._id}
                className="bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all group flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    meeting.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {meeting.status === 'active' ? '● Live Now' : 'Scheduled'}
                  </span>
                  <span className="text-xs font-mono text-neutral-500 bg-neutral-800 px-2 py-1 rounded">{meeting.meetingId}</span>
                </div>
                <h3 className="text-xl font-bold mb-1 group-hover:text-blue-400 transition-colors">{meeting.title}</h3>
                {meeting.description && <p className="text-sm text-neutral-500 mb-2">{meeting.description}</p>}
                <div className="flex items-center gap-1 text-xs text-neutral-500 mt-auto mb-6">
                  <Clock className="w-3 h-3" />
                  {new Date(meeting.startTime).toLocaleString()}
                </div>
                <button
                  disabled={meeting.status !== 'active'}
                  onClick={() => goToMeeting(meeting._id)}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition-all">
                  {meeting.status === 'active' ? 'Join Meeting' : 'Not Started Yet'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
