'use client';

import { useEffect, useState } from 'react';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { 
  Users, 
  Video, 
  LayoutDashboard, 
  LogOut, 
  Settings,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { goToLogin } = useAppNavigation();
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user.role === 'admin') {
          setUser(data.user);
        } else {
          goToLogin();
        }
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/me', { method: 'DELETE' });
    goToLogin();
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { name: 'User Management', icon: Users, href: '/admin/users' },
    { name: 'Meetings', icon: Video, href: '/admin/meetings' },
    { name: 'Settings', icon: Settings, href: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      {/* Sidebar */}
      <aside className={`
        ${isSidebarOpen ? 'w-64' : 'w-20'} 
        bg-neutral-900 border-r border-neutral-800 transition-all duration-300 flex flex-col z-50
      `}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Video className="w-5 h-5 text-white" />
          </div>
          {isSidebarOpen && <span className="font-bold text-lg tracking-tight truncate">Shamod Admin</span>}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-4 px-4 py-3 rounded-xl transition-all group
                  ${isActive ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}
                `}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'group-hover:text-blue-500'}`} />
                {isSidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 rounded-xl text-neutral-400 hover:bg-red-500/10 hover:text-red-500 transition-all w-full group"
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:text-red-500" />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-neutral-500 capitalize">{user?.role}</p>
            </div>
            <div className="w-10 h-10 bg-neutral-800 rounded-full border border-neutral-700 flex items-center justify-center text-blue-500 font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
