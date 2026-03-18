'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, PlayCircle, StopCircle, Trash2, Calendar, Clock, Loader2, LogIn } from 'lucide-react';

export default function AdminMeetings() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '', description: '', meetingId: '', startTime: '',
  });

  useEffect(() => { fetchMeetings(); }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    const res = await fetch('/api/meetings');
    const data = await res.json();
    if (data.success) setMeetings(data.meetings);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setFormData({ title: '', description: '', meetingId: '', startTime: '' });
        fetchMeetings();
      } else {
        setError(data.message || 'Failed to create meeting');
      }
    } catch { setError('Something went wrong'); }
    finally { setIsSubmitting(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/meetings/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchMeetings();
  };

  const deleteMeeting = async (id: string) => {
    if (!confirm('Delete this meeting?')) return;
    await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
    fetchMeetings();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Meeting Management</h1>
          <p className="text-neutral-400 mt-1">Create, start and manage your meetings.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20 active:scale-95 shrink-0">
          <Plus className="w-5 h-5" /> Create Meeting
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-16 text-neutral-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No meetings yet. Create your first meeting.</p>
          </div>
        ) : meetings.map((meeting) => (
          <div key={meeting._id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-lg">{meeting.title}</h3>
                    <span className="text-xs font-mono bg-neutral-800 px-2 py-1 rounded-lg text-neutral-400">{meeting.meetingId}</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      meeting.status === 'active' ? 'bg-green-500/10 text-green-500' :
                      meeting.status === 'ended' ? 'bg-red-500/10 text-red-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>● {meeting.status}</span>
                  </div>
                  {meeting.description && <p className="text-sm text-neutral-400 mt-1">{meeting.description}</p>}
                  <div className="flex items-center gap-1 mt-2 text-xs text-neutral-500">
                    <Clock className="w-3 h-3" />
                    {new Date(meeting.startTime).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {meeting.status === 'scheduled' && (
                  <button onClick={() => updateStatus(meeting._id, 'active')}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                    <PlayCircle className="w-4 h-4" /> Start
                  </button>
                )}
                {meeting.status === 'active' && (
                  <>
                    <button onClick={() => router.push(`/meeting/${meeting._id}`)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                      <LogIn className="w-4 h-4" /> Join
                    </button>
                    <button onClick={() => updateStatus(meeting._id, 'ended')}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                      <StopCircle className="w-4 h-4" /> End
                    </button>
                  </>
                )}
                <button onClick={() => deleteMeeting(meeting._id)}
                  className="p-2 hover:bg-neutral-800 rounded-xl transition-colors text-neutral-500 hover:text-red-500">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-neutral-900 border border-neutral-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-neutral-800">
              <h2 className="text-2xl font-bold">Create Meeting</h2>
              <p className="text-neutral-400 mt-1 text-sm">Fill in the details to schedule a new meeting.</p>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Meeting Title</label>
                <input type="text" required value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-neutral-800 border border-neutral-700 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Weekly Team Sync" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Meeting ID</label>
                <input type="text" required value={formData.meetingId}
                  onChange={e => setFormData({...formData, meetingId: e.target.value.toUpperCase()})}
                  className="w-full bg-neutral-800 border border-neutral-700 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
                  placeholder="SM-001" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Scheduled Time</label>
                <input type="datetime-local" required value={formData.startTime}
                  onChange={e => setFormData({...formData, startTime: e.target.value})}
                  className="w-full bg-neutral-800 border border-neutral-700 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Description (optional)</label>
                <textarea rows={3} value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-neutral-800 border border-neutral-700 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  placeholder="Meeting agenda or description..." />
              </div>
              {error && <div className="text-red-500 text-xs bg-red-500/10 py-2 text-center rounded-lg border border-red-500/20">{error}</div>}
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-3 rounded-xl transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
