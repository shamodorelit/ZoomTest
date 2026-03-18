'use client';

import { useEffect, useState } from 'react';
import { Shield, Database, Globe, Key, CheckCircle, Info } from 'lucide-react';

export default function AdminSettings() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.success) setUser(data.user);
    });
  }, []);

  const systemInfo = [
    { label: 'Application', value: 'Shamod Meeting System', icon: Globe },
    { label: 'Version', value: '1.0.0', icon: Info },
    { label: 'Database', value: 'MongoDB Atlas', icon: Database },
    { label: 'Authentication', value: 'JWT (HS256)', icon: Key },
    { label: 'Real-time Layer', value: 'Socket.io + WebRTC', icon: Globe },
    { label: 'Deployment', value: 'Vercel (Edge-ready)', icon: CheckCircle },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-neutral-400 mt-1">System configuration and administrator information.</p>
      </div>

      {/* Admin Profile */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          Admin Profile
        </h2>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-2xl font-bold text-blue-400">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <p className="text-xl font-bold">{user?.firstName} {user?.lastName}</p>
            <p className="text-neutral-400 text-sm mt-0.5">{user?.email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-medium uppercase tracking-wide">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-400" />
          System Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemInfo.map(item => (
            <div key={item.label} className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-neutral-400 shrink-0" />
                <span className="text-sm text-neutral-400">{item.label}</span>
              </div>
              <span className="text-sm font-medium text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          Security
        </h2>
        <div className="space-y-4">
          {[
            { label: 'User Self-Registration', status: 'Disabled', safe: true, desc: 'Users cannot create their own accounts. Only admins can create user accounts.' },
            { label: 'JWT Token Expiry', status: '24 hours', safe: true, desc: 'Sessions automatically expire after 24 hours for security.' },
            { label: 'Password Hashing', status: 'bcrypt (salt 10)', safe: true, desc: 'All passwords are hashed using bcrypt before storage.' },
            { label: 'Route Protection', status: 'Middleware enforced', safe: true, desc: 'All admin and meeting routes are protected by JWT middleware.' },
          ].map(item => (
            <div key={item.label} className="flex items-start justify-between gap-4 p-4 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
              <div>
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-neutral-500 text-xs mt-1">{item.desc}</p>
              </div>
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                item.safe ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400'
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Environment Variables Note */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-blue-400 mb-3">⚙️ Environment Variables</h2>
        <p className="text-neutral-400 text-sm mb-4">
          The following environment variables must be configured in your deployment:
        </p>
        <div className="space-y-2 font-mono text-sm">
          {['MONGODB_URI', 'JWT_SECRET', 'NEXT_PUBLIC_SIGNAL_SERVER'].map(v => (
            <div key={v} className="flex items-center gap-2 text-neutral-300">
              <span className="text-green-400">✓</span>
              <code className="bg-neutral-800 px-2 py-0.5 rounded text-xs">{v}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
