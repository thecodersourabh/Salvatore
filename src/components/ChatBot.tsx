import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, X, Search, PenSquare } from 'lucide-react';
import { chatService } from '../services/chatService';
import { aiService } from '../services/aiService';
import { teamService } from '../services/teamService';
import { NewMessageModal } from './NewMessageModal';
import { ConversationDetailModal } from './ConversationDetailModal';
import { User } from '../types/user';
import { UserService } from '../services/userService';

type ConversationItem = {
  id: string;
  recipientId: string;
  title?: string;
  lastMessage?: string;
  unread?: number;
  timestamp?: string;
  isAI?: boolean;
  isGroup?: boolean;
  isTeam?: boolean;
  teamId?: string;
  participantIds?: string[];
};

type ChatMessage = {
  id?: string;
  senderId?: string;
  content: string;
  createdAt?: string;
};

type ViewMode = 'list' | 'conversation';

export const ChatBot: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'focused' | 'other'>('focused');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [authError, setAuthError] = useState(false);
  const [newMessageModalOpen, setNewMessageModalOpen] = useState(false);
  const [conversationDetailModalOpen, setConversationDetailModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Helper to scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isChatOpen]);

  // Load conversations when opening the chat
  useEffect(() => {
    if (!isChatOpen) return;
    let mounted = true;
    const load = async () => {
      setLoadingConversations(true);
      try {
        // Fetch direct messages, AI conversations, and teams in parallel
        const [chatResult, aiResult, teamsResult] = await Promise.allSettled([
          chatService.getConversations(),
          aiService.getConversations(),
          teamService.getTeams()
        ]);

        const conversationMap = new Map<string, ConversationItem>();

        // Process direct message conversations
        if (chatResult.status === 'fulfilled') {
          const data = chatResult.value?.conversations || chatResult.value;
          
          if (Array.isArray(data)) {
            // Fetch user details for all unique recipient IDs
            const recipientIds = [...new Set(data.map((c: any) => c.recipientId || c.with || c.userId || c.participantId || c.id))];
            const userDetailsMap = new Map<string, User>();
            
            // Fetch user details in parallel
            await Promise.allSettled(
              recipientIds.map(async (recipientId: string) => {
                try {
                  const user = await UserService.getUser(recipientId);
                  if (user) {
                    userDetailsMap.set(recipientId, user);
                  }
                } catch (error) {
                  console.error(`Failed to fetch user details for ${recipientId}:`, error);
                }
              })
            );
            
            data.forEach((c: any) => {
              const recipientId = c.recipientId || c.with || c.userId || c.participantId || c.id;
              const timestamp = c.timestamp || c.updatedAt;
              
              // Get user details from the map
              const userDetails = userDetailsMap.get(recipientId);
              const displayName = userDetails?.displayName || userDetails?.name || c.recipientName;
              
              // If we already have this recipient, keep the most recent one
              const existing = conversationMap.get(recipientId);
              if (!existing || (timestamp && existing.timestamp && new Date(timestamp) > new Date(existing.timestamp))) {
                conversationMap.set(recipientId, {
                  id: c.id || c.conversationId || `${recipientId}`,
                  recipientId,
                  title: displayName || recipientId,
                  lastMessage: c.lastMessage?.content || c.lastMessage || c.preview || undefined,
                  unread: c.unreadCount || c.unread || 0,
                  timestamp: timestamp || undefined,
                  isAI: false,
                });
              }
            });
          }
        } else {
          console.error('Failed to load chat conversations:', chatResult.reason);
        }

        // Process AI conversations
        if (aiResult.status === 'fulfilled') {
          const data = aiResult.value?.data || aiResult.value?.conversations || aiResult.value;
          
          if (Array.isArray(data)) {
            data.forEach((c: any) => {
              const conversationId = c.conversationId || c.id;
              const timestamp = c.timestamp || c.updatedAt || c.createdAt;
              
              conversationMap.set(`ai_${conversationId}`, {
                id: conversationId,
                recipientId: conversationId,
                title: c.title || 'AI Assistant',
                lastMessage: c.lastMessage?.content || c.lastMessage || c.preview || undefined,
                unread: c.unreadCount || c.unread || 0,
                timestamp: timestamp || undefined,
                isAI: true,
              });
            });
          }
        } else {
          console.error('Failed to load AI conversations:', aiResult.reason);
        }

        // Process team conversations
        if (teamsResult.status === 'fulfilled') {
          const teams = teamsResult.value || [];
          
          if (Array.isArray(teams)) {
            teams.forEach((team: any) => {
              const teamId = team.teamId || team.id;
              // Use current timestamp to ensure teams appear in focused tab
              const timestamp = new Date().toISOString();
              
              conversationMap.set(`team_${teamId}`, {
                id: teamId,
                recipientId: teamId,
                teamId: teamId,
                title: team.name || 'Team Chat',
                lastMessage: team.lastMessage || undefined,
                unread: team.unreadCount || 0,
                timestamp: timestamp,
                isAI: false,
                isTeam: true,
                participantIds: team.members?.map((m: any) => m.userId) || [],
              });
            });
          }
        } else {
          console.error('Failed to load teams:', teamsResult.reason);
        }
        
        const list = Array.from(conversationMap.values())
          .sort((a, b) => {
            // Sort by timestamp, most recent first
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          });

        if (mounted) setConversations(list);
      } catch (e: any) {
        console.error('Failed to load conversations for ChatBot', e);
        console.error('Error details:', {
          message: e?.message,
          status: e?.status,
          details: e?.details
        });
        
        // Check if it's an auth error
        if (e?.status === 401 || e?.status === 403 || e?.message?.toLowerCase().includes('auth')) {
          if (mounted) setAuthError(true);
          console.warn('Authentication required. Please login again.');
        }
      } finally {
        if (mounted) setLoadingConversations(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [isChatOpen]);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (!selectedConv) return;
    let mounted = true;
    const load = async () => {
      setLoadingMessages(true);
      try {
        // Use appropriate service based on conversation type
        let result: any;
        if (selectedConv.isAI) {
          result = await aiService.getConversation(selectedConv.recipientId);
        } else if (selectedConv.isTeam) {
          const messages = await teamService.getTeamMessages({ teamId: selectedConv.teamId || selectedConv.recipientId, limit: 100 });
          result = { data: messages };
        } else {
          result = await chatService.getConversation(selectedConv.recipientId, 100);
        }
        
        // API returns {success: true, data: [...]}
        const data = result?.data || result?.messages || result;
        const msgs: ChatMessage[] = Array.isArray(data)
          ? data.map((m: any) => ({ 
              id: m.id || m.messageId, 
              senderId: m.senderId || m.userId || (m.role === 'assistant' ? 'ai' : 'user'), 
              content: m.content || m.message || m.body || m.text, 
              createdAt: m.timestamp || m.createdAt 
            }))
          : [];
        
        // Sort messages by timestamp (oldest first)
        msgs.sort((a, b) => {
          if (!a.createdAt) return -1;
          if (!b.createdAt) return 1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        
        if (mounted) setMessages(msgs.length ? msgs : [{ content: "No messages yet. Say hello!" }]);
      } catch (e: any) {
        console.error('Failed to load conversation messages', e);
        console.error('Error details:', {
          message: e?.message,
          status: e?.status,
          details: e?.details
        });
        
        // Load mock messages for development/testing
        if (mounted) {
          setMessages([
            { id: '1', senderId: selectedConv.recipientId, content: 'Hello! How can I help you?', createdAt: new Date(Date.now() - 3600000).toISOString() },
            { id: '2', senderId: 'me', content: 'Hi there!', createdAt: new Date(Date.now() - 1800000).toISOString() }
          ]);
        }
      } finally {
        if (mounted) setLoadingMessages(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [selectedConv]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    return conversations.filter(c => (c.title || c.recipientId || '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase()));
  }, [conversations, searchQuery]);

  // Separate conversations by focused/other
  // Focused: teams OR unread > 0 OR recent activity (within last 24 hours)
  const focusedConversations = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return filteredConversations.filter(c => {
      // Always show teams in focused tab
      if (c.isTeam) return true;
      if ((c.unread || 0) > 0) return true;
      if (c.timestamp && new Date(c.timestamp).getTime() > oneDayAgo) return true;
      return false;
    });
  }, [filteredConversations]);
  
  const otherConversations = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return filteredConversations.filter(c => {
      // Don't show teams in other tab
      if (c.isTeam) return false;
      if ((c.unread || 0) > 0) return false;
      if (c.timestamp && new Date(c.timestamp).getTime() > oneDayAgo) return false;
      return true;
    });
  }, [filteredConversations]);
  
  const displayedConversations = activeTab === 'focused' ? focusedConversations : otherConversations;

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedConv) return;

    const content = newMessage.trim();
    // optimistic UI
    const optimistic: ChatMessage = { id: `tmp-${Date.now()}`, senderId: 'me', content, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    setNewMessage('');

    try {
      // Use appropriate service based on conversation type
      if (selectedConv.isAI) {
        await aiService.sendChatMessage({ 
          message: content,
          conversationId: selectedConv.recipientId 
        });
        // Refresh AI conversation messages
        const result: any = await aiService.getConversation(selectedConv.recipientId);
        const data = result?.data || result?.messages || result;
        const msgs: ChatMessage[] = Array.isArray(data)
          ? data.map((m: any) => ({ 
              id: m.id || m.messageId, 
              senderId: m.senderId || m.userId || (m.role === 'assistant' ? 'ai' : 'user'), 
              content: m.content || m.message || m.body || m.text, 
              createdAt: m.timestamp || m.createdAt 
            }))
          : [];
        
        msgs.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        
        setMessages(msgs);
      } else if (selectedConv.isTeam) {
        // Send team message
        await teamService.sendTeamMessage({ teamId: selectedConv.teamId || selectedConv.recipientId, content });
        // Refresh team conversation messages
        const teamMessages = await teamService.getTeamMessages({ teamId: selectedConv.teamId || selectedConv.recipientId, limit: 100 });
        const msgs: ChatMessage[] = teamMessages.map((m: any) => ({ 
          id: m.id || m.messageId, 
          senderId: m.senderId || m.userId, 
          content: m.content || m.message || m.body || m.text, 
          createdAt: m.timestamp || m.createdAt 
        }));
        
        // Sort messages by timestamp (oldest first)
        msgs.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        
        setMessages(msgs);
      } else {
        // Send direct message
        await chatService.sendDirectMessage({ recipientId: selectedConv.recipientId, content });
        // Refresh conversation messages
        const result: any = await chatService.getConversation(selectedConv.recipientId, 100);
        const data = result?.data || result?.messages || result;
        const msgs: ChatMessage[] = Array.isArray(data)
          ? data.map((m: any) => ({ 
              id: m.id || m.messageId, 
              senderId: m.senderId || m.userId, 
              content: m.content || m.message || m.body || m.text, 
              createdAt: m.timestamp || m.createdAt 
            }))
          : [];
        
        // Sort messages by timestamp (oldest first)
        msgs.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        
        setMessages(msgs);
      }
      
      // Update conversation list with latest message
      setConversations(prev => prev.map(c => 
        c.recipientId === selectedConv.recipientId 
          ? { ...c, lastMessage: content, timestamp: new Date().toISOString() }
          : c
      ).sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }));
    } catch (err) {
      console.error('Failed to send message', err);
      // keep optimistic message but mark as failed (simple UX)
      setMessages(prev => prev.map(m => m === optimistic ? { ...m, content: m.content + ' (failed)' } : m));
    }
  };

  const openConversation = async (conv: ConversationItem) => {
    setSelectedConv(conv);
    setConversationDetailModalOpen(true);
    setViewMode('conversation'); // Switch to conversation view on mobile
  };

  const closeConversation = () => {
    setSelectedConv(null);
    setConversationDetailModalOpen(false);
    setViewMode('list');
    setMessages([]);
  };

  // Handler for renaming a team
  const handleRenameTeam = (teamId: string, newName: string) => {
    // Update the conversation in the list
    setConversations(prev => prev.map(conv => 
      (conv.teamId === teamId || conv.id === teamId)
        ? { ...conv, title: newName }
        : conv
    ));
    
    // Update selected conversation if it's the one being renamed
    if (selectedConv && (selectedConv.teamId === teamId || selectedConv.id === teamId)) {
      setSelectedConv(prev => prev ? { ...prev, title: newName } : null);
    }
  };

  // Handler for when a user is selected from NewMessageModal
  const handleSelectUser = (user: User) => {
    // Create or open a conversation with this user
    const existingConv = conversations.find(c => c.recipientId === user.id);
    
    if (existingConv) {
      // Open existing conversation
      openConversation(existingConv);
    } else {
      // Create new conversation
      const newConv: ConversationItem = {
        id: `new_${user.id}`,
        recipientId: user.id,
        title: user.displayName || user.name || user.userName,
        lastMessage: undefined,
        unread: 0,
        timestamp: new Date().toISOString(),
        isAI: false,
      };
      
      setConversations(prev => [newConv, ...prev]);
      openConversation(newConv);
    }
  };

  // Handler for team/group creation
  const handleCreateGroup = async (users: User[], groupName: string) => {
    try {
      // Extract participant IDs
      const memberIds = users.map(u => u.id);
      
      // Call API to create the team
      const result = await teamService.createTeam({
        name: groupName,
        memberIds,
        description: `Team chat with ${users.length + 1} members`
      });
      
      // Extract team ID from response
      const teamId = result?.teamId || result?.id || `team_${Date.now()}`;
      
      // Create a new team conversation
      const teamConv: ConversationItem = {
        id: teamId,
        recipientId: teamId,
        teamId: teamId,
        title: groupName,
        lastMessage: undefined,
        unread: 0,
        timestamp: new Date().toISOString(),
        isAI: false,
        isTeam: true,
        participantIds: memberIds,
      };
      
      setConversations(prev => [teamConv, ...prev]);
      openConversation(teamConv);
    } catch (error) {
      console.error('Failed to create team:', error);
      // Still create a local conversation for testing/fallback
      const teamConv: ConversationItem = {
        id: `team_${Date.now()}`,
        recipientId: `team_${Date.now()}`,
        teamId: `team_${Date.now()}`,
        title: groupName,
        lastMessage: undefined,
        unread: 0,
        timestamp: new Date().toISOString(),
        isAI: false,
        isTeam: true,
        participantIds: users.map(u => u.id),
      };
      
      setConversations(prev => [teamConv, ...prev]);
      openConversation(teamConv);
    }
  };

  const renderAvatar = (title?: string) => (
    <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-100">
      {title ? title.trim().charAt(0).toUpperCase() : 'U'}
    </div>
  );

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    // Format as "Oct 24" or similar
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed bottom-6 right-6 max-sm:bottom-4 max-sm:right-4 z-50">
      {!isChatOpen ? (
        <button
          onClick={() => setIsChatOpen(true)}
          className="bg-rose-600 text-white p-4 max-sm:p-3 rounded-full shadow-lg hover:bg-rose-700 transition"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6 max-sm:h-5 max-sm:w-5" />
        </button>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[280px] h-[520px] max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:fixed max-sm:inset-0 flex">
          {/* Conversations List Component - Hidden on mobile when conversation is open */}
          <div className={`w-full md:w-[280px] border-r dark:border-gray-700 flex flex-col ${viewMode === 'conversation' ? 'max-md:hidden' : ''}`}>
            <div className="p-3 bg-white dark:bg-gray-900 flex items-center justify-between border-b dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-rose-600" />
                <span className="font-semibold">Messaging</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNewMessageModalOpen(true)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition"
                  title="New message"
                >
                  <PenSquare className="h-5 w-5" />
                </button>
                <button onClick={() => setIsChatOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b dark:border-gray-700">
              {authError && (
                <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
                  Authentication expired. Please refresh the page to login again.
                </div>
              )}
              <div className="relative">
                <input 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  placeholder="Search messages" 
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-md border dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:border-rose-500" 
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Tabs - Focused / Other */}
            <div className="flex border-b dark:border-gray-700">
              <button
                onClick={() => setActiveTab('focused')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                  activeTab === 'focused'
                    ? 'text-rose-600 border-b-2 border-rose-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Focused {focusedConversations.length > 0 && `(${focusedConversations.length})`}
              </button>
              <button
                onClick={() => setActiveTab('other')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                  activeTab === 'other'
                    ? 'text-rose-600 border-b-2 border-rose-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Help & Support {otherConversations.length > 0 && `(${otherConversations.length})`}
              </button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loadingConversations ? (
                <div className="p-4 text-sm text-gray-500 text-center">Loading conversations...</div>
              ) : (
                <div>
                  {displayedConversations.length === 0 && (
                    <div className="p-4 text-sm text-gray-500 text-center">
                      {activeTab === 'focused' ? 'No unread messages' : 'No other conversations'}
                    </div>
                  )}
                  {displayedConversations.map((conv) => (
                    <button 
                      key={conv.id} 
                      onClick={() => openConversation(conv)} 
                      className={`w-full text-left p-3 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 transition ${
                        selectedConv?.id === conv.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      {renderAvatar(conv.title || conv.recipientId)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-sm truncate">{conv.title || conv.recipientId}</div>
                          <div className="flex items-center space-x-2">
                            {conv.timestamp && <span className="text-xs text-gray-500">{formatTimestamp(conv.timestamp)}</span>}
                            {(conv.unread || 0) > 0 && (
                              <div className="text-xs bg-rose-600 text-white rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                {conv.unread}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 truncate">{conv.lastMessage || 'Say hello'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        
        </div>
      )}
      
      {/* New Message Modal */}
      <NewMessageModal
        isOpen={newMessageModalOpen}
        onClose={() => setNewMessageModalOpen(false)}
        isConversationDetailModalOpen={conversationDetailModalOpen}
        onSelectUser={handleSelectUser}
        onCreateGroup={handleCreateGroup}
      />
      
      {/* Conversation Detail Modal */}
      <ConversationDetailModal
        isOpen={conversationDetailModalOpen}
        onClose={closeConversation}
        isNewMessageModalOpen={newMessageModalOpen}
        conversation={selectedConv}
        messages={messages}
        newMessage={newMessage}
        onMessageChange={setNewMessage}
        onSendMessage={handleSendMessage}
        loadingMessages={loadingMessages}
        onRenameTeam={handleRenameTeam}
      />
    </div>
  );
};