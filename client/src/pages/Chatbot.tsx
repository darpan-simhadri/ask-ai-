import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  Send, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Sparkles, 
  Loader2, 
  Bot, 
  User as UserIcon,
  Menu
} from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  created_at: string;
}

export const Chatbot: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fetchingConvs, setFetchingConvs] = useState(true);
  const [fetchingMsgs, setFetchingMsgs] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Fetch all conversations
  const fetchConversations = async (selectNewId?: string) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);

      if (selectNewId) {
        navigate(`/chat/${selectNewId}`);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setFetchingConvs(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setFetchingMsgs(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setFetchingMsgs(false);
      }
    };

    fetchMessages();
  }, [conversationId]);

  // Create new conversation
  const handleNewChat = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({ title: 'New Conversation' })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        await fetchConversations(data.id);
        setSidebarOpen(false);
      }
    } catch (err) {
      console.error('Error creating new conversation:', err);
    }
  };

  // Delete a conversation
  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update list
      setConversations(conversations.filter(c => c.id !== id));
      
      // If we deleted the active conversation, navigate back to chat index
      if (conversationId === id) {
        navigate('/chat');
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    let activeId = conversationId;
    const messageText = input.trim();
    setInput('');
    setLoading(true);

    try {
      // 1. If no active conversation, create one first
      if (!activeId) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({ title: messageText.substring(0, 30) || 'New Conversation' })
          .select()
          .single();

        if (convError || !newConv) throw convError || new Error('Failed to create chat');
        activeId = newConv.id;
        
        // Wait briefly for route/state update, or push history update manually
        setConversations(prev => [newConv, ...prev]);
        navigate(`/chat/${activeId}`, { replace: true });
      }

      // 2. Insert user message in Supabase
      const userMessageObj = {
        conversation_id: activeId,
        role: 'user' as const,
        content: messageText
      };

      const { data: userMsg, error: userMsgError } = await supabase
        .from('messages')
        .insert(userMessageObj)
        .select()
        .single();

      if (userMsgError || !userMsg) throw userMsgError || new Error('Failed to save message');
      
      // Update message list locally for instant feedback
      setMessages(prev => [...prev, userMsg]);

      // Update parent conversation's updated_at timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeId);

      // If the conversation title is 'New Conversation', update it to the first prompt
      const currentConv = conversations.find(c => c.id === activeId);
      if (currentConv && currentConv.title === 'New Conversation') {
        const newTitle = messageText.substring(0, 30) + (messageText.length > 30 ? '...' : '');
        await supabase
          .from('conversations')
          .update({ title: newTitle })
          .eq('id', activeId);
        
        // Refresh conversation titles list
        fetchConversations();
      }

      // 3. Build message history for Gemini backend
      // Fetch fresh list of messages to prevent race conditions or missing historical contexts
      const { data: historyMsgs } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', activeId)
        .order('created_at', { ascending: true });

      const history = (historyMsgs || [])
        .filter(m => m.role === 'user' || m.role === 'model')
        .map(m => ({
          role: m.role as 'user' | 'model',
          content: m.content
        }));

      // 4. Fetch Supabase user session token to verify in backend
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error('Unauthenticated user session');

      // 5. Query Express Backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: messageText,
          history: history.slice(0, -1) // slice user message because backend appends it manually
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson?.message || 'Failed to fetch reply from server');
      }

      const replyData = await response.json();

      // 6. Save Model response to database
      const modelMessageObj = {
        conversation_id: activeId,
        role: 'model' as const,
        content: replyData.content
      };

      const { data: modelMsg, error: modelMsgError } = await supabase
        .from('messages')
        .insert(modelMessageObj)
        .select()
        .single();

      if (modelMsgError || !modelMsg) throw modelMsgError || new Error('Failed to save AI response');

      setMessages(prev => [...prev, modelMsg]);

    } catch (err: any) {
      console.error('Error during chat flow:', err);
      // Append a local system error message
      setMessages(prev => [
        ...prev, 
        {
          id: 'error-' + Date.now(),
          role: 'model',
          content: `⚠️ Error: ${err.message || 'Unable to communicate with AskFlow backend service.'}`,
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format/render messages (splits by triple backticks for neat code view)
  const formatMessageContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        // Check if there is a language tag on the first line (e.g. ```typescript)
        const possibleLang = lines[0]?.trim();
        const hasLang = possibleLang && !possibleLang.includes(' ') && possibleLang.length < 15;
        const codeText = hasLang ? lines.slice(1).join('\n') : lines.join('\n');
        
        return (
          <div key={index} className="my-3 overflow-hidden rounded-xl border border-gray-800 bg-gray-950 font-mono text-xs">
            {hasLang && (
              <div className="flex items-center justify-between bg-gray-900 px-4 py-1.5 text-[10px] uppercase font-semibold text-indigo-400 tracking-wider">
                <span>{possibleLang}</span>
              </div>
            )}
            <pre className="overflow-x-auto p-4 text-gray-300">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }
      // Replace double asterisks with bold styling, and preserve carriage returns
      return (
        <span key={index} className="whitespace-pre-line">
          {part.split(/(\*\*.*?\*\*)/g).map((subPart, subIndex) => {
            if (subPart.startsWith('**') && subPart.endsWith('**')) {
              return <strong key={subIndex} className="font-bold text-white">{subPart.slice(2, -2)}</strong>;
            }
            return subPart;
          })}
        </span>
      );
    });
  };

  const activeConversation = conversations.find(c => c.id === conversationId);

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-screen w-full relative overflow-hidden">
      
      {/* Secondary Sidebar (Conversations List) */}
      <aside className={`
        absolute inset-y-0 left-0 z-20 flex w-72 flex-col bg-gray-900/95 border-r border-gray-800/40 backdrop-blur-md transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800/30">
          <span className="text-sm font-semibold text-gray-400 tracking-wider">CHATS</span>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all duration-200"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversation List Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {fetchingConvs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500">
              No conversations found.
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === conversationId;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    navigate(`/chat/${conv.id}`);
                    setSidebarOpen(false);
                  }}
                  className={`
                    flex items-center justify-between gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 group relative
                    ${isActive 
                      ? 'bg-indigo-500/10 border border-indigo-500/25 text-white' 
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40 border border-transparent'}
                  `}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-indigo-400'}`} />
                    <span className="text-sm font-medium truncate">{conv.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Panel */}
      <section className="flex flex-1 flex-col bg-slate-950/20 relative min-w-0">
        
        {/* Chat Panel Header */}
        <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-gray-800/30 bg-gray-950/20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Bot className="h-4.5 w-4.5" />
            </div>
            <h2 className="text-sm font-bold text-gray-200 truncate">
              {activeConversation ? activeConversation.title : 'AskFlow AI Assistant'}
            </h2>
          </div>
          
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/15 transition-all duration-200"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Chat</span>
          </button>
        </header>

        {/* Message History Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {fetchingMsgs ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : !conversationId && messages.length === 0 ? (
            /* Empty Welcome State */
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/5">
                <Sparkles className="h-8 w-8 text-indigo-400 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">AskFlow Conversation Console</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Start a new intelligent flow. Write a prompt below to launch a conversation secure with Gemini API.
                </p>
              </div>
              <button
                onClick={handleNewChat}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold text-white hover:opacity-95 shadow-lg shadow-indigo-500/10 active:scale-[0.99] transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Chat Thread</span>
              </button>
            </div>
          ) : (
            /* Styled message bubbles */
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((msg) => {
                const isAI = msg.role === 'model';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3.5 ${isAI ? '' : 'flex-row-reverse'}`}
                  >
                    {/* User / AI initials bubble */}
                    <div className={`
                      flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold border
                      ${isAI 
                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                        : 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/15'}
                    `}>
                      {isAI ? <Bot className="h-4.5 w-4.5" /> : <UserIcon className="h-4.5 w-4.5" />}
                    </div>

                    {/* Content text card */}
                    <div className={`
                      max-w-[80%] rounded-2xl px-4.5 py-3 text-sm leading-relaxed shadow-sm
                      ${isAI 
                        ? 'bg-gray-900/60 border border-gray-800/40 text-gray-200 rounded-tl-sm' 
                        : 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm'}
                    `}>
                      {formatMessageContent(msg.content)}
                    </div>
                  </div>
                );
              })}

              {/* Bot loading state bubble */}
              {loading && (
                <div className="flex items-start gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Bot className="h-4.5 w-4.5 animate-bounce" />
                  </div>
                  <div className="bg-gray-900/60 border border-gray-800/40 text-gray-200 rounded-2xl rounded-tl-sm px-5 py-4.5 text-sm flex items-center gap-1.5 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar Section */}
        <footer className="p-4 md:p-6 border-t border-gray-800/30 bg-gray-950/20">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-gray-900/50 border border-gray-800 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:bg-gray-900/80 focus:ring-1 focus:ring-indigo-500/20 transition-all duration-200"
              placeholder={conversationId ? "Ask Gemini anything..." : "Write a prompt to start a new chat..."}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-95 shadow-md shadow-indigo-500/15 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </footer>

      </section>

    </div>
  );
};

export default Chatbot;
