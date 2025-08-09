import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

export function ChatBot() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm here to help with your fabric design questions. How can I assist you today?", isBot: true }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setMessages([...messages, { text: newMessage, isBot: false }]);
    setNewMessage('');

    setTimeout(() => {
      setMessages(prev => [...prev, {
        text: "Thanks for your message! A design specialist will respond shortly. In the meantime, feel free to browse our featured collections.",
        isBot: true
      }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isChatOpen ? (
        <button
          onClick={() => setIsChatOpen(true)}
          className="bg-rose-600 text-white p-4 rounded-full shadow-lg hover:bg-rose-700 transition"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl w-[360px] h-[480px] flex flex-col">
          <div className="p-4 bg-rose-600 text-white rounded-t-lg flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">Design Assistant</span>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-white hover:text-rose-200 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.isBot
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:border-rose-600"
              />
              <button
                type="submit"
                className="bg-rose-600 text-white p-2 rounded-full hover:bg-rose-700 transition"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}