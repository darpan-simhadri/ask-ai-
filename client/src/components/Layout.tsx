import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  LayoutDashboard, 
  MessageSquare, 
  LogOut, 
  Menu, 
  X, 
  Sparkles
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export const Layout: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial authenticated user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen to authentication changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const userInitials = displayName.substring(0, 2).toUpperCase();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'AI Chatbot', path: '/chat', icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#030712]">
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Responsive Left Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-gray-950/80 border-r border-gray-800/40 backdrop-blur-md transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-gray-800/30">
          <Link to="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/25">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-200 via-indigo-100 to-white bg-clip-text text-transparent">
                AskFlow AI
              </span>
            </div>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/chat' && location.pathname.startsWith('/chat'));
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-700/90 text-white shadow-md shadow-indigo-600/15' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/30'}
                `}
              >
                <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Bottom (Profile & Logout) */}
        <div className="p-4 border-t border-gray-800/30 bg-gray-950/40">
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-900/30 border border-gray-800/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-200 truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-gray-800/30 lg:hidden bg-gray-950/40 backdrop-blur-md z-30">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-200 to-white bg-clip-text text-transparent">
            AskFlow AI
          </span>
          <div className="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/20">
            {userInitials}
          </div>
        </header>

        {/* Dynamic content rendering container */}
        <main className="flex-1 overflow-auto bg-gradient-to-b from-[#0a0f1d] to-[#030712] relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
