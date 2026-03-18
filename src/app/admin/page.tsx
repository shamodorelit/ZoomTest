'use client';

import { useEffect, useState } from 'react';
import { Video, Users, Calendar, Activity } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, meetings: 0, active: 0 });
  const [meetings, setMeetings] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/users').then(r => r.json()),
      fetch('/api/meetings').then(r => r.json()),
    ]).then(([usersData, meetingsData]) => {
      const users = usersData.users || [];
      const allMeetings = meetingsData.meetings || [];
      setMeetings(allMeetings.slice(0, 5));
      setStats({
        users: users.length,
        meetings: allMeetings.length,
        active: allMeetings.filter((m: any) => m.status === 'active').length,
      });
    });
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total Meetings', value: stats.meetings, icon: Calendar, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Active Now', value: stats.active, icon: Activity, color: 'text-green-400', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-neutral-400 mt-1">Welcome back. Here's what's happening.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
            <div className="text-4xl font-bold mb-1">{card.value}</div>
            <div className="text-neutral-400 text-sm">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Recent Meetings</h2>
          <Link href="/admin/meetings" className="text-blue-500 text-sm hover:underline">View All</Link>
        </div>
        <div className="space-y-3">
          {meetings.length === 0 ? (
            <p className="text-neutral-500 text-sm py-6 text-center">No meetings yet. Create your first meeting.</p>
          ) : meetings.map((m) => (
            <div key={m._id} className="flex items-center justify-between py-3 border-b border-neutral-800 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-800 rounded-xl flex items-center justify-center">
                  <Video className="w-5 h-5 text-neutral-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">{m.title}</p>
                  <p className="text-xs text-neutral-500">{m.meetingId}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                m.status === 'active' ? 'bg-green-500/10 text-green-500' :
                m.status === 'ended' ? 'bg-red-500/10 text-red-500' :
                'bg-blue-500/10 text-blue-400'
              }`}>{m.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
