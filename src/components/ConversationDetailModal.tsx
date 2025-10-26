import React, { useRef, useEffect } from 'react';
import { X, Send, MoreVertical } from 'lucide-react';

interface ConversationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  isNewMessageModalOpen?: boolean;
  conversation: {
    id: string;
    recipientId: string;
    title?: string;
    isAI?: boolean;
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
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

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
    <div className="fixed bottom-6 right-6 z-50" style={{ marginRight: `${marginRight}px` }} onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[460px] h-[520px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Conversation Header */}
        <div className="p-3 border-b dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-900">
          <div className="flex items-center space-x-3">
            {/* More options button - moved to left */}
            <button className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition">
              <MoreVertical className="h-5 w-5" />
            </button>
            {renderAvatar(conversation.title || conversation.recipientId)}
            <div>
              <div className="font-semibold text-sm">{conversation.title || conversation.recipientId}</div>
              <div className="text-xs text-gray-500">Active now</div>
            </div>
          </div>
          {/* Close button */}
          <button 
            onClick={onClose}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
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
      </div>
    </div>
  );
};
