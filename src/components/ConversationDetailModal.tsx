import React, { useRef, useEffect, useState } from 'react';
import { X, Send, MoreVertical, Users, Edit2 } from 'lucide-react';
import { TeamMembersModal } from './TeamMembersModal';
import { teamService } from '../services/teamService';

interface ConversationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  isNewMessageModalOpen?: boolean;
  conversation: {
    id: string;
    recipientId: string;
    title?: string;
    isAI?: boolean;
    isTeam?: boolean;
    teamId?: string;
  } | null;
  messages: Array<{
    id?: string;
    senderId?: string;
    content: string;
    createdAt?: string;
  }>;
  newMessage: string;
  onMessageChange: (value: string) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  loadingMessages: boolean;
  onRenameTeam?: (teamId: string, newName: string) => void;
}

export const ConversationDetailModal: React.FC<ConversationDetailModalProps> = ({
  isOpen,
  onClose,
  isNewMessageModalOpen,
  conversation,
  messages,
  newMessage,
  onMessageChange,
  onSendMessage,
  loadingMessages,
  onRenameTeam,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const [showTeamMembers, setShowTeamMembers] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [renamingTeam, setRenamingTeam] = useState(false);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMoreMenu]);

  const handleRenameTeam = async () => {
    if (!newTeamName.trim() || !conversation?.teamId) return;
    
    try {
      setRenamingTeam(true);
      await teamService.updateTeam(conversation.teamId, { name: newTeamName.trim() });
      
      // Call parent callback to update conversation list
      if (onRenameTeam) {
        onRenameTeam(conversation.teamId, newTeamName.trim());
      }
      
      setShowRenameModal(false);
      setNewTeamName('');
    } catch (error) {
      console.error('Failed to rename team:', error);
      alert('Failed to rename team. Please try again.');
    } finally {
      setRenamingTeam(false);
    }
  };

  const renderAvatar = (title?: string) => (
    <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-100">
      {title ? title.trim().charAt(0).toUpperCase() : 'U'}
    </div>
  );

  if (!isOpen || !conversation) return null;

  // Calculate margin based on what's open
  // ChatBot is always 280px, NewMessageModal is 280px when open
  const marginRight = isNewMessageModalOpen ? 560 : 280; // 280 (ChatBot) + 280 (NewMessageModal) or just 280 (ChatBot)

  return (
    <div className="fixed bottom-6 right-6 z-50 max-sm:inset-0 max-sm:bottom-0 max-sm:right-0" style={{ marginRight: window.innerWidth < 640 ? '0px' : `${marginRight}px` }} onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[460px] h-[520px] max-sm:w-full max-sm:h-full max-sm:rounded-none flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Conversation Header */}
        <div className="p-3 border-b dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-900">
          <div className="flex items-center space-x-3">
            {/* More options button with dropdown */}
            <div className="relative" ref={moreMenuRef}>
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              
              {/* Dropdown Menu */}
              {showMoreMenu && (
                <div className="absolute left-0 top-8 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50">
                  {conversation.isTeam && (
                    <>
                      <button
                        onClick={() => {
                          setNewTeamName(conversation.title || '');
                          setShowRenameModal(true);
                          setShowMoreMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-lg"
                      >
                        <Edit2 className="h-4 w-4" />
                        Rename Team
                      </button>
                      <button
                        onClick={() => {
                          setShowTeamMembers(true);
                          setShowMoreMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-b-lg"
                      >
                        <Users className="h-4 w-4" />
                        Manage Members
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            {renderAvatar(conversation.title || conversation.recipientId)}
            <div>
              <div className="font-semibold text-sm">{conversation.title || conversation.recipientId}</div>
              <div className="text-xs text-gray-500">Active now</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Team Members button - only show for team conversations */}
            {conversation.isTeam && (
              <button
                onClick={() => setShowTeamMembers(true)}
                className="text-gray-600 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 transition"
                title="Manage members"
              >
                <Users className="h-5 w-5" />
              </button>
            )}
            {/* Close button */}
            <button 
              onClick={onClose}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900" ref={scrollRef}>
          {loadingMessages ? (
            <div className="text-sm text-gray-500 text-center">Loading messages...</div>
          ) : (
            messages.map((m, i) => {
              // Check if message is from the current user or from AI/assistant
              const isAIMessage = m.senderId === 'ai' || m.senderId === 'assistant';
              const isMe = !isAIMessage && (m.senderId?.startsWith('google-oauth2|') || m.senderId === 'me');
              return (
                <div key={m.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] md:max-w-[70%] p-3 rounded-2xl ${
                    isMe 
                      ? 'bg-rose-600 text-white rounded-br-sm' 
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border dark:border-gray-700 rounded-bl-sm'
                  }`}>
                    <div className="text-sm break-words">{m.content}</div>
                    {m.createdAt && (
                      <div className={`text-xs mt-1 ${isMe ? 'text-rose-100' : 'text-gray-500'}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={onSendMessage} className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Write a message..."
              className="flex-1 border dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />
            <button 
              type="submit" 
              className="bg-rose-600 text-white p-2 rounded-full hover:bg-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!newMessage.trim()}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>

        {/* Team Members Modal */}
        {conversation.isTeam && (
          <TeamMembersModal
            isOpen={showTeamMembers}
            onClose={() => setShowTeamMembers(false)}
            teamId={conversation.teamId || conversation.recipientId}
            teamName={conversation.title || 'Team Chat'}
          />
        )}

        {/* Rename Team Modal */}
        {showRenameModal && conversation.isTeam && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowRenameModal(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-sm:mx-2 p-6 max-sm:p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Rename Team
              </h3>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Enter new team name"
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 mb-4"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleRenameTeam()}
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowRenameModal(false);
                    setNewTeamName('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={renamingTeam}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameTeam}
                  disabled={!newTeamName.trim() || renamingTeam}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {renamingTeam ? 'Renaming...' : 'Rename'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
