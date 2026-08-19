import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { MessageSquare, Plus, Brain, Sparkles, Clock } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [convCount, setConvCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Get user session info
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        if (currentUser) {
          // Count user conversations dynamically using head query
          const { count, error } = await supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true });

          if (!error && count !== null) {
            setConvCount(count);
          } else {
            setConvCount(0);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setConvCount(0);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const handleStartChat = () => {
    navigate('/chat');
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900/60 p-8 md:p-10 border border-indigo-500/10 shadow-2xl">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-semibold w-fit tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI POWERED WORKSPACE</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Welcome back, <span className="bg-gradient-to-r from-indigo-300 via-indigo-100 to-white bg-clip-text text-transparent">{displayName}</span>!
          </h1>
          <p className="text-gray-400 max-w-xl text-sm md:text-base leading-relaxed">
            Create structured conversational flows, ask intelligence-driven questions, and tap into the secure power of Gemini API.
          </p>
        </div>
      </div>

      {/* Grid Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Total Conversations */}
        <div className="glass-panel rounded-3xl p-6 shadow-xl glass-card-hover flex flex-col justify-between h-56 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300 pointer-events-none">
            <Brain className="h-36 w-36 text-white" />
          </div>
          <div className="flex items-start justify-between">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Clock className="h-3.5 w-3.5" />
              <span>Realtime updates</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Total Conversations</h3>
            {loading ? (
              <div className="h-9 w-20 animate-pulse bg-gray-800 rounded-lg mt-1" />
            ) : (
              <p className="text-4xl font-extrabold text-white mt-1">
                {convCount !== null ? convCount : 0}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">Active conversational threads in Supabase</p>
          </div>
        </div>

        {/* Card 2: Start New Chat Action Card */}
        <button
          onClick={handleStartChat}
          className="glass-panel rounded-3xl p-6 shadow-xl glass-card-hover flex flex-col justify-between h-56 text-left relative overflow-hidden group border border-dashed border-indigo-500/20 hover:border-solid hover:border-indigo-500/40 bg-gradient-to-br hover:from-indigo-950/20 hover:to-slate-950/30"
        >
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300 pointer-events-none">
            <Plus className="h-36 w-36 text-indigo-400" />
          </div>
          <div className="flex items-center justify-between">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 shadow-md shadow-indigo-500/10">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold text-indigo-400 tracking-wider">RECOMMENDED</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">Start New Conversation</h3>
            <p className="text-sm text-gray-400 mt-1 leading-relaxed">
              Launch a full-page chat interface and query Gemini for answers instantly.
            </p>
            <p className="text-xs text-indigo-400 font-semibold mt-3 flex items-center gap-1">
              Open chat console &rarr;
            </p>
          </div>
        </button>

      </div>
    </div>
  );
};

export default Dashboard;
